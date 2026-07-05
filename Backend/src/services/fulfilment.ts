import { Types } from "mongoose";
import { Enrollment, IEnrollment } from "../models/Enrollment";
import { CourseProgress } from "../models/CourseProgress";
import { Course } from "../models/Course";
import { sendMailAsync } from "../mail/mailSender";
import { courseEnrollmentEmail } from "../mail/templates";

interface FulfilArgs {
  userId: string | Types.ObjectId;
  course: { _id: Types.ObjectId; courseName: string; slug: string };
  paymentRef: string;
  amountPaid: number;
  /** For the enrollment confirmation email. */
  email?: string;
  name?: string;
}

/**
 * Grant a user access to a course: enrollment doc + progress doc + counter + email.
 * Idempotent — safe to call from both the IPN handler and the browser callback,
 * which race each other after a successful payment.
 */
export async function fulfilEnrollment(args: FulfilArgs): Promise<IEnrollment> {
  const existing = await Enrollment.findOne({ userId: args.userId, course: args.course._id, status: "active" });
  if (existing) return existing;

  let enrollment: IEnrollment;
  try {
    enrollment = await Enrollment.create({
      userId: args.userId,
      course: args.course._id,
      paymentRef: args.paymentRef,
      amountPaid: args.amountPaid,
    });
  } catch (err) {
    // Unique index (userId, course, active) — a concurrent fulfil won the race.
    if ((err as { code?: number }).code === 11000) {
      const winner = await Enrollment.findOne({ userId: args.userId, course: args.course._id, status: "active" });
      if (winner) return winner;
    }
    throw err;
  }

  await CourseProgress.updateOne(
    { userId: args.userId, course: args.course._id },
    { $setOnInsert: { completedTopics: [], passedTests: [] } },
    { upsert: true }
  );
  await Course.updateOne({ _id: args.course._id }, { $inc: { studentsEnrolledCount: 1 } });

  if (args.email && args.name) {
    sendMailAsync(
      args.email,
      ...(Object.values(courseEnrollmentEmail(args.name, args.course.courseName, args.course.slug)) as [string, string])
    );
  }
  return enrollment;
}
