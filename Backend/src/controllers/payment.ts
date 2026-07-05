import crypto from "crypto";
import { Request, Response } from "express";
import { asyncHandler, ApiError } from "../utils/asyncHandler";
import { env, isPesapalConfigured } from "../config/env";
import { Course } from "../models/Course";
import { Enrollment } from "../models/Enrollment";
import { PaymentOrder, IPaymentOrder } from "../models/PaymentOrder";
import { fulfilEnrollment } from "../services/fulfilment";
import { submitOrder, getTransactionStatus, PESAPAL_STATUS } from "../services/pesapal";
import { isCourseUnlockedForUser } from "../utils/progression";

/**
 * Pesapal payment flow.
 *
 * Security model:
 *  - The charge amount is ALWAYS the server-side course price — nothing from the
 *    client body is trusted for money.
 *  - Access is only ever granted after GetTransactionStatus (server→Pesapal, over
 *    our authenticated session) reports COMPLETED. Neither the browser callback's
 *    query params nor the IPN request body are proof of payment on their own.
 *  - The status endpoint only reconciles orders owned by the requesting user.
 *  - Fulfilment is idempotent, so the IPN and the callback racing is harmless.
 */

function callbackUrl(): string {
  if (env.PESAPAL_CALLBACK_URL) return env.PESAPAL_CALLBACK_URL;
  const firstOrigin = env.CLIENT_URL.split(",")[0]!.trim().replace(/\/$/, "");
  return `${firstOrigin}/payment/callback`;
}

/**
 * Pull the authoritative outcome from Pesapal and apply it to the order.
 * Grants (or revokes, on reversal) the enrollment accordingly.
 */
async function reconcileOrder(order: IPaymentOrder): Promise<void> {
  if (!order.orderTrackingId) return;
  // Already settled — don't re-hit the gateway on every poll.
  if (order.status === "paid" || order.status === "reversed") return;

  const tx = await getTransactionStatus(order.orderTrackingId);

  if (tx.status_code === PESAPAL_STATUS.COMPLETED) {
    // Defense in depth: the settled amount/currency must match what we asked for.
    if (tx.currency !== order.currency || Number(tx.amount) + 0.001 < order.amount) {
      console.error(
        `Pesapal amount mismatch on ${order.merchantRef}: expected ${order.amount} ${order.currency}, got ${tx.amount} ${tx.currency}`
      );
      return;
    }
    order.status = "paid";
    order.paymentMethod = tx.payment_method ?? undefined;
    order.confirmationCode = tx.confirmation_code ?? undefined;
    await order.save();

    const course = await Course.findById(order.course).select("courseName slug");
    if (course) {
      await fulfilEnrollment({
        userId: order.userId,
        course,
        paymentRef: `pesapal:${order.confirmationCode ?? order.orderTrackingId}`,
        amountPaid: order.amount,
        email: order.payerEmail,
        name: order.payerName,
      });
    }
  } else if (tx.status_code === PESAPAL_STATUS.FAILED) {
    order.status = "failed";
    await order.save();
  } else if (tx.status_code === PESAPAL_STATUS.REVERSED) {
    order.status = "reversed";
    await order.save();
    // A charge-back revokes access granted for it.
    await Enrollment.updateOne(
      { userId: order.userId, course: order.course, status: "active" },
      { $set: { status: "cancelled" } }
    );
  }
  // INVALID / still pending → leave the order as-is.
}

/**
 * Student: start a Pesapal checkout for a paid course.
 * POST /payments/pesapal/initiate/:courseId → { redirectUrl, orderTrackingId }
 */
export const initiatePesapalPayment = asyncHandler(async (req: Request, res: Response) => {
  if (!isPesapalConfigured) throw new ApiError(503, "Payments are not configured on this server");

  const userId = req.auth!.id;
  const course = await Course.findById(req.params.courseId);
  if (!course || course.status !== "Published") throw new ApiError(404, "Course not available");
  if (course.price <= 0) throw new ApiError(400, "This course is free — enrol directly");

  const enrolled = await Enrollment.exists({ userId, course: course._id, status: "active" });
  if (enrolled) throw new ApiError(409, "Already enrolled in this course");

  // Same progression gate as free enrollment — payment must not bypass it.
  const unlocked = await isCourseUnlockedForUser(userId, course);
  if (!unlocked) {
    throw new ApiError(403, "This course is locked. Complete previous levels and earn the required points to unlock it.");
  }

  const order = await PaymentOrder.create({
    userId,
    course: course._id,
    merchantRef: `CA-${crypto.randomUUID()}`,
    amount: course.price, // server-side price — client input is never used for money
    currency: env.PESAPAL_CURRENCY,
    payerEmail: req.auth!.email,
    payerName: req.auth!.name,
  });

  const nameParts = (req.auth!.name ?? "").trim().split(/\s+/);
  const { orderTrackingId, redirectUrl } = await submitOrder({
    merchantRef: order.merchantRef,
    amount: order.amount,
    description: `Enrollment: ${course.courseName}`,
    callbackUrl: callbackUrl(),
    email: req.auth!.email,
    firstName: nameParts[0],
    lastName: nameParts.slice(1).join(" ") || undefined,
  });

  order.orderTrackingId = orderTrackingId;
  await order.save();

  res.status(201).json({ success: true, redirectUrl, orderTrackingId });
});

/**
 * Pesapal server-to-server notification (public endpoint, registered via RegisterIPN).
 * We look the order up by OUR record of the tracking id and verify with
 * GetTransactionStatus — the request body itself proves nothing.
 */
export const pesapalIpn = asyncHandler(async (req: Request, res: Response) => {
  const src = req.method === "GET" ? req.query : (req.body as Record<string, unknown>);
  const orderTrackingId = String(src?.OrderTrackingId ?? "");
  const merchantReference = String(src?.OrderMerchantReference ?? "");
  const notificationType = String(src?.OrderNotificationType ?? "IPNCHANGE");

  let ok = false;
  if (orderTrackingId) {
    const order = await PaymentOrder.findOne({ orderTrackingId });
    if (order) {
      try {
        await reconcileOrder(order);
        ok = true;
      } catch (err) {
        console.error("Pesapal IPN reconcile failed:", (err as Error).message);
      }
    }
  }

  // Pesapal's expected acknowledgement shape; non-200 status tells it to retry.
  res.json({
    orderNotificationType: notificationType,
    orderTrackingId,
    orderMerchantReference: merchantReference,
    status: ok ? 200 : 500,
  });
});

/**
 * Student: poll the outcome after being redirected back from Pesapal.
 * GET /payments/pesapal/status?orderTrackingId=…
 * Ownership-scoped: users can only see (and trigger reconciliation of) their own orders.
 */
export const pesapalPaymentStatus = asyncHandler(async (req: Request, res: Response) => {
  const orderTrackingId = String(req.query.orderTrackingId ?? "");
  if (!orderTrackingId) throw new ApiError(400, "orderTrackingId is required");

  const order = await PaymentOrder.findOne({ orderTrackingId, userId: req.auth!.id });
  if (!order) throw new ApiError(404, "Payment not found");

  await reconcileOrder(order);

  const course = await Course.findById(order.course).select("courseName slug").lean();

  res.json({
    success: true,
    payment: {
      status: order.status,
      courseId: order.course.toString(),
      courseName: course?.courseName ?? null,
      courseSlug: course?.slug ?? null,
      amount: order.amount,
      currency: order.currency,
      confirmationCode: order.confirmationCode ?? null,
    },
  });
});
