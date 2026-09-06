import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ?? "FINCY <noreply@fincy.app>";

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// ──────────────────────────────────────────────
// Base sender
// ──────────────────────────────────────────────
async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<EmailResult> {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });
    if (error) {
      console.error("[Email] Resend error:", error);
      return { success: false, error: error.message };
    }
    return { success: true, messageId: data?.id };
  } catch (err) {
    console.error("[Email] Failed to send email:", err);
    return { success: false, error: "Email delivery failed" };
  }
}

// ──────────────────────────────────────────────
// Email Templates
// ──────────────────────────────────────────────

function baseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>FINCY</title>
</head>
<body style="margin:0;padding:0;background:#0f0f14;font-family:system-ui,-apple-system,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <!-- Header -->
    <div style="text-align:center;margin-bottom:32px;">
      <h1 style="color:#e879f9;font-size:28px;font-weight:800;letter-spacing:-0.5px;margin:0;">
        FINCY
      </h1>
      <p style="color:#71717a;font-size:13px;margin:4px 0 0;">Personal Finance Tracker</p>
    </div>
    <!-- Content -->
    <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:32px;">
      ${content}
    </div>
    <!-- Footer -->
    <div style="text-align:center;margin-top:24px;">
      <p style="color:#52525b;font-size:12px;margin:0;">
        You received this email from FINCY. If you did not request this, please ignore it.
      </p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Send a password reset email
 */
export async function sendPasswordResetEmail(
  to: string,
  name: string,
  resetUrl: string
): Promise<EmailResult> {
  const html = baseTemplate(`
    <h2 style="color:#f4f4f5;font-size:20px;font-weight:700;margin:0 0 8px;">Reset Your Password</h2>
    <p style="color:#a1a1aa;font-size:15px;margin:0 0 24px;">Hi ${name}, we received a request to reset your FINCY password.</p>
    <a href="${resetUrl}"
       style="display:inline-block;background:linear-gradient(135deg,#a855f7,#ec4899);color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:600;font-size:15px;">
      Reset Password
    </a>
    <p style="color:#71717a;font-size:13px;margin:24px 0 0;">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
  `);

  return sendEmail(to, "Reset your FINCY password", html);
}

/**
 * Send a reminder notification email
 */
export async function sendReminderEmail(
  to: string,
  name: string,
  reminder: { title: string; description?: string | null; amount?: number | null; dueDate: Date }
): Promise<EmailResult> {
  const amountStr = reminder.amount
    ? `<p style="color:#a1a1aa;font-size:14px;margin:8px 0 0;"><strong style="color:#f4f4f5;">Amount:</strong> $${reminder.amount.toFixed(2)}</p>`
    : "";

  const html = baseTemplate(`
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
      <div style="background:rgba(168,85,247,0.2);border-radius:10px;padding:10px;font-size:20px;">🔔</div>
      <div>
        <h2 style="color:#f4f4f5;font-size:18px;font-weight:700;margin:0;">${reminder.title}</h2>
        <p style="color:#71717a;font-size:13px;margin:2px 0 0;">Due: ${reminder.dueDate.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
      </div>
    </div>
    ${reminder.description ? `<p style="color:#a1a1aa;font-size:14px;margin:0 0 12px;">${reminder.description}</p>` : ""}
    ${amountStr}
    <div style="margin-top:24px;padding:16px;background:rgba(255,255,255,0.04);border-radius:10px;border:1px solid rgba(255,255,255,0.08);">
      <p style="color:#71717a;font-size:13px;margin:0;">Open FINCY to mark this reminder as done or snooze it.</p>
    </div>
  `);

  return sendEmail(to, `⏰ Reminder: ${reminder.title}`, html);
}

/**
 * Send a budget alert email
 */
export async function sendBudgetAlertEmail(
  to: string,
  name: string,
  budget: { categoryName: string; used: number; total: number; percentage: number }
): Promise<EmailResult> {
  const isOver = budget.percentage >= 100;
  const color = isOver ? "#ef4444" : "#f59e0b";

  const html = baseTemplate(`
    <h2 style="color:#f4f4f5;font-size:20px;font-weight:700;margin:0 0 8px;">
      ${isOver ? "🚨 Budget Exceeded" : "⚠️ Budget Alert"}
    </h2>
    <p style="color:#a1a1aa;font-size:15px;margin:0 0 24px;">
      Hi ${name}, your <strong style="color:#f4f4f5;">${budget.categoryName}</strong> budget has 
      ${isOver ? "been exceeded" : `reached ${budget.percentage}%`}.
    </p>
    <div style="background:rgba(255,255,255,0.04);border-radius:12px;padding:20px;border:1px solid rgba(255,255,255,0.08);">
      <div style="display:flex;justify-content:space-between;margin-bottom:10px;">
        <span style="color:#a1a1aa;font-size:14px;">Spent</span>
        <span style="color:${color};font-weight:700;">$${budget.used.toFixed(2)}</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:16px;">
        <span style="color:#a1a1aa;font-size:14px;">Budget</span>
        <span style="color:#f4f4f5;font-weight:700;">$${budget.total.toFixed(2)}</span>
      </div>
      <div style="background:rgba(255,255,255,0.08);border-radius:999px;height:8px;">
        <div style="background:${color};border-radius:999px;height:8px;width:${Math.min(budget.percentage, 100)}%;"></div>
      </div>
    </div>
  `);

  return sendEmail(
    to,
    `${isOver ? "🚨 Budget Exceeded" : "⚠️ Budget Alert"}: ${budget.categoryName}`,
    html
  );
}

/**
 * Send a welcome email after registration
 */
export async function sendWelcomeEmail(
  to: string,
  name: string
): Promise<EmailResult> {
  const html = baseTemplate(`
    <h2 style="color:#f4f4f5;font-size:22px;font-weight:700;margin:0 0 8px;">Welcome to FINCY! 🎉</h2>
    <p style="color:#a1a1aa;font-size:15px;margin:0 0 20px;">Hi ${name}, your account is ready. Start tracking your finances smarter.</p>
    <div style="margin-bottom:24px;">
      <div style="display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.08);">
        <span style="font-size:18px;">💳</span>
        <div>
          <p style="color:#f4f4f5;font-size:14px;font-weight:600;margin:0;">Add your accounts</p>
          <p style="color:#71717a;font-size:13px;margin:0;">Connect your bank, cash, and card accounts</p>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.08);">
        <span style="font-size:18px;">📊</span>
        <div>
          <p style="color:#f4f4f5;font-size:14px;font-weight:600;margin:0;">Track transactions</p>
          <p style="color:#71717a;font-size:13px;margin:0;">Log income and expenses with categories</p>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:12px;padding:12px 0;">
        <span style="font-size:18px;">🎯</span>
        <div>
          <p style="color:#f4f4f5;font-size:14px;font-weight:600;margin:0;">Set goals & budgets</p>
          <p style="color:#71717a;font-size:13px;margin:0;">Stay on track with smart budgets and savings goals</p>
        </div>
      </div>
    </div>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
       style="display:inline-block;background:linear-gradient(135deg,#a855f7,#ec4899);color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:600;font-size:15px;">
      Open FINCY
    </a>
  `);

  return sendEmail(to, "Welcome to FINCY 🎉", html);
}
