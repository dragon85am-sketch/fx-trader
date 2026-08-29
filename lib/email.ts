import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;

const emailFrom =
  process.env.EMAIL_FROM ??
  "FX-TRADER <onboarding@resend.dev>";

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!resendApiKey) {
    console.warn("RESEND_API_KEY missing");
    return;
  }

  const resend = new Resend(resendApiKey);

  try {
    return await resend.emails.send({
      from: emailFrom,
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error("SEND EMAIL ERROR:", error);
  }
}