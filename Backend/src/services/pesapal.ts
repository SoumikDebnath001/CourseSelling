import { env, isPesapalConfigured } from "../config/env";
import { ApiError } from "../utils/asyncHandler";

/**
 * Pesapal API 3.0 client (https://developer.pesapal.com/how-to-integrate/e-commerce/api-30-json).
 *
 * Flow: RequestToken → RegisterIPN (once) → SubmitOrderRequest (returns a hosted
 * checkout redirect_url) → the payer pays on Pesapal's page → Pesapal notifies our
 * IPN endpoint AND redirects the browser to our callback — both of which must call
 * GetTransactionStatus to learn the real outcome. Query params on the callback are
 * NEVER trusted as proof of payment.
 */

const BASE_URLS = {
  sandbox: "https://cybqa.pesapal.com/pesapalv3",
  live: "https://pay.pesapal.com/v3",
} as const;

export const pesapalBaseUrl = BASE_URLS[env.PESAPAL_ENV];

/** GetTransactionStatus status_code values. */
export const PESAPAL_STATUS = { INVALID: 0, COMPLETED: 1, FAILED: 2, REVERSED: 3 } as const;

interface TokenResponse {
  token: string | null;
  expiryDate: string | null;
  error: { code?: string; message?: string } | null;
  status: string;
}

interface RegisterIpnResponse {
  ipn_id: string | null;
  url: string | null;
  error: { code?: string; message?: string } | null;
  status: string;
}

interface SubmitOrderResponse {
  order_tracking_id: string | null;
  merchant_reference: string | null;
  redirect_url: string | null;
  error: { code?: string; message?: string; call_back_url?: string } | null;
  status: string;
}

export interface PesapalTransactionStatus {
  payment_method: string | null;
  amount: number;
  created_date: string;
  confirmation_code: string | null;
  payment_status_description: string | null;
  message: string | null;
  payment_account: string | null;
  merchant_reference: string | null;
  currency: string | null;
  /** 0 INVALID · 1 COMPLETED · 2 FAILED · 3 REVERSED */
  status_code: number;
  error: { code?: string; message?: string } | null;
}

function requireConfigured(): void {
  if (!isPesapalConfigured) {
    throw new ApiError(503, "Payments are not configured on this server");
  }
}

async function pesapalFetch<T>(path: string, init: RequestInit): Promise<T> {
  const res = await fetch(`${pesapalBaseUrl}${path}`, {
    ...init,
    headers: { Accept: "application/json", "Content-Type": "application/json", ...init.headers },
  });
  if (!res.ok) {
    throw new ApiError(502, `Payment gateway error (${res.status})`);
  }
  return (await res.json()) as T;
}

// ── Auth token (valid ~5 min) — cached and refreshed 30 s early ──
let cachedToken: { value: string; expiresAt: number } | null = null;

async function getToken(): Promise<string> {
  requireConfigured();
  if (cachedToken && Date.now() < cachedToken.expiresAt) return cachedToken.value;

  const data = await pesapalFetch<TokenResponse>("/api/Auth/RequestToken", {
    method: "POST",
    body: JSON.stringify({
      consumer_key: env.PESAPAL_CONSUMER_KEY,
      consumer_secret: env.PESAPAL_CONSUMER_SECRET,
    }),
  });
  if (!data.token) {
    console.error("Pesapal auth failed:", data.error?.message ?? data.status);
    throw new ApiError(502, "Payment gateway authentication failed");
  }
  const expiresAt = data.expiryDate
    ? new Date(data.expiryDate).getTime() - 30_000
    : Date.now() + 4 * 60_000;
  cachedToken = { value: data.token, expiresAt };
  return data.token;
}

async function authed<T>(path: string, init: RequestInit): Promise<T> {
  const token = await getToken();
  return pesapalFetch<T>(path, { ...init, headers: { Authorization: `Bearer ${token}` } });
}

// ── IPN registration — one id per server URL, cached for the process lifetime ──
let cachedIpnId: string | null = null;

export async function getIpnId(): Promise<string> {
  if (env.PESAPAL_IPN_ID) return env.PESAPAL_IPN_ID;
  if (cachedIpnId) return cachedIpnId;
  if (!env.PESAPAL_IPN_URL) {
    throw new ApiError(503, "PESAPAL_IPN_URL (or PESAPAL_IPN_ID) must be configured for payments");
  }
  const data = await authed<RegisterIpnResponse>("/api/URLSetup/RegisterIPN", {
    method: "POST",
    body: JSON.stringify({ url: env.PESAPAL_IPN_URL, ipn_notification_type: "POST" }),
  });
  if (!data.ipn_id) {
    console.error("Pesapal IPN registration failed:", data.error?.message ?? data.status);
    throw new ApiError(502, "Payment gateway IPN registration failed");
  }
  cachedIpnId = data.ipn_id;
  return data.ipn_id;
}

export interface SubmitOrderArgs {
  /** Our unique merchant reference (PaymentOrder.merchantRef). */
  merchantRef: string;
  amount: number;
  description: string;
  callbackUrl: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

/** Create a hosted-checkout order. Returns Pesapal's tracking id + redirect URL. */
export async function submitOrder(args: SubmitOrderArgs): Promise<{ orderTrackingId: string; redirectUrl: string }> {
  const notificationId = await getIpnId();
  const data = await authed<SubmitOrderResponse>("/api/Transactions/SubmitOrderRequest", {
    method: "POST",
    body: JSON.stringify({
      id: args.merchantRef,
      currency: env.PESAPAL_CURRENCY,
      // Pesapal expects a decimal amount; course prices are whole KES but keep cents-safe.
      amount: Math.round(args.amount * 100) / 100,
      description: args.description.slice(0, 100),
      callback_url: args.callbackUrl,
      notification_id: notificationId,
      billing_address: {
        email_address: args.email,
        first_name: args.firstName ?? "",
        last_name: args.lastName ?? "",
      },
    }),
  });
  if (!data.order_tracking_id || !data.redirect_url) {
    console.error("Pesapal SubmitOrderRequest failed:", data.error?.message ?? data.status);
    throw new ApiError(502, "Could not start the payment. Please try again.");
  }
  return { orderTrackingId: data.order_tracking_id, redirectUrl: data.redirect_url };
}

/** Authoritative payment outcome — the ONLY basis on which enrollments are granted. */
export async function getTransactionStatus(orderTrackingId: string): Promise<PesapalTransactionStatus> {
  return authed<PesapalTransactionStatus>(
    `/api/Transactions/GetTransactionStatus?orderTrackingId=${encodeURIComponent(orderTrackingId)}`,
    { method: "GET" }
  );
}
