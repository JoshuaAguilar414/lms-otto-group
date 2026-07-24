import nodemailer from "nodemailer";

async function sendEmail(input: { to: string; subject: string; text: string; html: string }): Promise<boolean> {
  const from = process.env.MAIL_FROM || process.env.SMTP_FROM || "Otto Group Academy <onboarding@resend.dev>";

  if (process.env.RESEND_API_KEY) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text
      })
    });
    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Resend email failed: ${response.status} ${detail}`);
    }
    return true;
  }

  // Prefer SendGrid HTTP API (works on Render free tier; SMTP ports 587/465 are blocked there).
  const sendgridKey = process.env.SENDGRID_API_KEY || process.env.SMTP_PASSWORD;
  if (sendgridKey?.startsWith("SG.")) {
    return sendViaSendGridApi({
      apiKey: sendgridKey,
      from: process.env.SMTP_FROM || from,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html
    });
  }

  if (!process.env.SMTP_HOST) return false;

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
      : undefined
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || from,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html
  });
  return true;
}

async function sendViaSendGridApi(input: {
  apiKey: string;
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<boolean> {
  const parsed = parseFromAddress(input.from);
  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${input.apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: input.to }] }],
      from: parsed,
      subject: input.subject,
      content: [
        { type: "text/plain", value: input.text },
        { type: "text/html", value: input.html }
      ]
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`SendGrid API email failed: ${response.status} ${detail}`);
  }
  return true;
}

function parseFromAddress(from: string): { email: string; name?: string } {
  const match = from.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  if (match) {
    const name = match[1].replace(/^["']|["']$/g, "").trim();
    return name ? { email: match[2].trim(), name } : { email: match[2].trim() };
  }
  return { email: from.trim() };
}

export async function sendInvitationEmail(input: {
  to: string;
  learnerName: string;
  activationUrl: string;
}): Promise<boolean> {
  const subject = "Activate your Otto Group training account";
  const text = `Hello ${input.learnerName},\n\nYour Otto Group training account is ready. Activate it here:\n${input.activationUrl}\n\nThis link expires in 7 days.`;
  const html = `<p>Hello ${escapeHtml(input.learnerName)},</p><p>Your Otto Group training account is ready.</p><p><a href="${escapeHtml(input.activationUrl)}">Activate your account</a></p><p>This link expires in 7 days.</p>`;
  return sendEmail({ to: input.to, subject, text, html });
}

export async function sendPasswordResetEmail(input: {
  to: string;
  learnerName: string;
  resetUrl: string;
}): Promise<boolean> {
  const subject = "Reset your Otto Group Academy password";
  const text = `Hello ${input.learnerName},\n\nReset your password here:\n${input.resetUrl}\n\nThis link expires in 2 hours. If you did not request this, ignore this email.`;
  const html = `<p>Hello ${escapeHtml(input.learnerName)},</p><p><a href="${escapeHtml(input.resetUrl)}">Reset your password</a></p><p>This link expires in 2 hours. If you did not request this, ignore this email.</p>`;
  return sendEmail({ to: input.to, subject, text, html });
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;"
  })[character] || character);
}
