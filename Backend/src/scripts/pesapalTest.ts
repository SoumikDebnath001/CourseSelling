/**
 * End-to-end smoke test against the Pesapal SANDBOX (cybqa.pesapal.com).
 * Run: npm run pesapal:test
 *
 * Exercises the exact code paths the API uses: auth token → IPN registration →
 * SubmitOrderRequest → GetTransactionStatus. No database needed and no real money —
 * the sandbox is Pesapal's demo environment.
 *
 * Uses PESAPAL_* from .env when present; otherwise falls back to Pesapal's PUBLIC
 * demo merchant keys (published at developer.pesapal.com — safe to use for testing).
 */

// The env schema requires Mongo/JWT vars this script never touches — satisfy it
// with placeholders BEFORE the config module loads.
process.env.MONGODB_URI ??= "mongodb://127.0.0.1:27017/unused-by-this-script";
process.env.JWT_SECRET ??= "unused-by-this-script";
process.env.PESAPAL_ENV ??= "sandbox";
process.env.PESAPAL_CONSUMER_KEY ??= "qkio1BGGYAXTu2JOfm7XSXNruoZsrqEW"; // public demo key (Kenya)
process.env.PESAPAL_CONSUMER_SECRET ??= "osGQ364R49cXKeOYSpaOnT++rHs="; // public demo secret
process.env.PESAPAL_IPN_URL ??= "https://www.example.com/api/v1/payments/pesapal/ipn";

async function main() {
  const { env } = await import("../config/env.js");
  if (env.PESAPAL_ENV !== "sandbox") {
    console.error("Refusing to run: PESAPAL_ENV must be 'sandbox' for this test.");
    process.exit(1);
  }

  const { pesapalBaseUrl, getIpnId, submitOrder, getTransactionStatus } = await import("../services/pesapal.js");
  console.log(`Pesapal smoke test → ${pesapalBaseUrl}\n`);

  console.log("1) RegisterIPN…");
  const ipnId = await getIpnId();
  console.log(`   ✅ ipn_id: ${ipnId}\n`);

  console.log("2) SubmitOrderRequest…");
  const merchantRef = `CA-TEST-${Date.now()}`;
  const { orderTrackingId, redirectUrl } = await submitOrder({
    merchantRef,
    amount: 100,
    description: "Sandbox test: course enrollment",
    callbackUrl: "http://localhost:3000/payment/callback",
    email: "student@example.com",
    firstName: "Test",
    lastName: "Student",
  });
  console.log(`   ✅ order_tracking_id: ${orderTrackingId}`);
  console.log(`   ✅ redirect_url:      ${redirectUrl}\n`);

  console.log("3) GetTransactionStatus (expect PENDING/INVALID — nobody has paid)…");
  const tx = await getTransactionStatus(orderTrackingId);
  console.log(`   ✅ status_code: ${tx.status_code} (${tx.payment_status_description ?? "not paid yet"})`);
  console.log(`   ✅ amount: ${tx.amount} ${tx.currency ?? env.PESAPAL_CURRENCY}\n`);

  console.log("All Pesapal sandbox calls succeeded. 🎉");
  console.log("To test a full payment: open the redirect_url above in a browser and pay");
  console.log("with Pesapal's sandbox test cards/M-Pesa, then re-run GetTransactionStatus.");
}

main().catch((err) => {
  console.error("\n❌ Pesapal sandbox test failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
