import "server-only";
import nodemailer from "nodemailer";

/**
 * Sends email via SMTP when SMTP_* env vars are configured; otherwise logs the
 * message to the server console (handy in development without a mail provider).
 *
 * Configure in .env:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM
 */
export async function sendEmail(opts: { to: string; subject: string; text: string }) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.log("📧 [email:console-fallback]", {
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
    });
    return { delivered: false, transport: "console" as const };
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT ?? 587),
    secure: Number(SMTP_PORT ?? 587) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  await transporter.sendMail({
    from: EMAIL_FROM ?? SMTP_USER,
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
  });
  return { delivered: true, transport: "smtp" as const };
}
