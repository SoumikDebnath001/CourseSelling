/**
 * Verifies the SMTP setup end-to-end without going through the API.
 *   npm run mail:test                 → sends to MAIL_USER (yourself)
 *   npm run mail:test you@example.com → sends to a specific address
 *
 * Prints the SMTP connection result and the send result so you can confirm your
 * (Gmail app) password works before testing the signup flow.
 */
import { env, isMailConfigured } from "../config/env";
import { mailSender } from "../mail/mailSender";
import { otpVerifyEmail } from "../mail/templates";

async function main() {
  console.log("\n──────── MAIL TEST ────────");
  console.log("Configured :", isMailConfigured ? "yes ✅" : "no ❌");
  console.log("Host       :", env.MAIL_HOST ?? "(empty)");
  console.log("Port       :", env.MAIL_PORT ?? "(empty)");
  console.log("User       :", env.MAIL_USER ?? "(empty)");
  console.log("From       :", env.MAIL_FROM);

  if (!isMailConfigured) {
    console.error("\n❌ Mail is not configured. Set MAIL_*/SMTP_* in Backend/.env and retry.\n");
    process.exit(1);
  }

  const to = process.argv[2] || env.MAIL_USER!;
  const sample = otpVerifyEmail("there", "123456");
  console.log(`\nSending a test email to: ${to} …`);

  const ok = await mailSender(to, "✅ Cricket Academy mail test", sample.html);
  if (ok) {
    console.log("\n✅ Sent. Check that inbox (and Spam). SMTP credentials work.\n");
    process.exit(0);
  } else {
    console.error("\n❌ Send failed — see the error above. Common causes:");
    console.error("   • Using your normal Gmail password instead of a 16-char App Password");
    console.error("   • 2-Step Verification not enabled on the Google account");
    console.error("   • App password copied with spaces\n");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("mail:test crashed:", err);
  process.exit(1);
});
