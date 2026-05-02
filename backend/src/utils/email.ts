import nodemailer, { Transporter } from 'nodemailer';

let cachedTransporter: Transporter | null = null;
let warned = false;

function getTransporter(): Transporter | null {
  if (cachedTransporter) return cachedTransporter;
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) {
    if (!warned) {
      console.warn(
        '[email] SMTP_HOST/SMTP_USER/SMTP_PASS missing — outgoing emails will be skipped (logged only).'
      );
      warned = true;
    }
    return null;
  }
  cachedTransporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT || 587) === 465,
    auth: { user, pass },
  });
  return cachedTransporter;
}

function fromHeader() {
  const name = process.env.MAIL_FROM_NAME || 'JC Smartbag';
  const addr = process.env.MAIL_FROM || process.env.SMTP_USER || 'no-reply@jcsmartbag.com';
  return `"${name}" <${addr}>`;
}

async function send(to: string, subject: string, html: string, text?: string) {
  const transporter = getTransporter();
  if (!transporter) {
    console.log(`[email:skipped] To: ${to} | Subject: ${subject}`);
    return { skipped: true };
  }
  try {
    const info = await transporter.sendMail({
      from: fromHeader(),
      to,
      subject,
      html,
      text: text || stripHtml(html),
    });
    return { messageId: info.messageId };
  } catch (err: any) {
    console.error(`[email:error] ${subject} -> ${to}:`, err?.message || err);
    return { error: err?.message || 'send failed' };
  }
}

function stripHtml(s: string) {
  return s
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function shell(content: string) {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f6f8fb;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f6f8fb;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:14px;border:1px solid #e5e7eb;overflow:hidden;">
        <tr><td style="padding:24px 32px;border-bottom:1px solid #e5e7eb;">
          <div style="font-size:20px;font-weight:800;color:#0b1f3a;">JC Smartbag</div>
          <div style="font-size:12px;color:#6b7280;letter-spacing:.08em;text-transform:uppercase;">Track your bag</div>
        </td></tr>
        <tr><td style="padding:24px 32px;color:#1f2937;font-size:15px;line-height:1.55;">${content}</td></tr>
        <tr><td style="padding:16px 32px;background:#f9fafb;color:#9ca3af;font-size:12px;border-top:1px solid #e5e7eb;">
          You're receiving this because you have a JC Smartbag account.
        </td></tr>
      </table>
    </td></tr>
  </table></body></html>`;
}

const APP_URL = () => process.env.APP_URL || 'http://localhost:5173';

export function sendOtpEmail(to: string, fullName: string, otp: string) {
  const html = shell(`
    <p>Hi ${escapeHtml(fullName)},</p>
    <p>Use the following one-time code to verify your email address. It expires in <strong>15 minutes</strong>.</p>
    <p style="margin:24px 0;text-align:center;">
      <span style="display:inline-block;font-size:32px;font-weight:800;letter-spacing:.4em;color:#0b1f3a;background:#eef6ff;padding:12px 24px;border-radius:10px;">${escapeHtml(otp)}</span>
    </p>
    <p>If you didn't sign up, you can safely ignore this email.</p>
  `);
  return send(to, 'Verify your email — JC Smartbag', html);
}

export function sendWelcomeEmail(to: string, fullName: string) {
  const html = shell(`
    <p>Welcome aboard, ${escapeHtml(fullName)}!</p>
    <p>Your JC Smartbag account is verified and ready to go. Buy a tracking device to unlock 1 free month of premium and start tracking your bags.</p>
    <p style="margin:24px 0;text-align:center;">
      <a href="${APP_URL()}/devices" style="display:inline-block;background:#1a73e8;color:#ffffff;padding:12px 22px;border-radius:10px;text-decoration:none;font-weight:700;">Browse devices</a>
    </p>
    <p>Need help? Just reply to this email.</p>
  `);
  return send(to, 'Welcome to JC Smartbag', html);
}

export function sendSubscriptionExpiringSoonEmail(to: string, fullName: string, expiresAt: Date) {
  const html = shell(`
    <p>Hi ${escapeHtml(fullName)},</p>
    <p>Your JC Smartbag premium subscription will expire on <strong>${expiresAt.toDateString()}</strong> (about 7 days from now).</p>
    <p>Renew now to avoid losing access to trip, baggage, and live tracking features.</p>
    <p style="margin:24px 0;text-align:center;">
      <a href="${APP_URL()}/subscription" style="display:inline-block;background:#1a73e8;color:#ffffff;padding:12px 22px;border-radius:10px;text-decoration:none;font-weight:700;">Renew subscription</a>
    </p>
  `);
  return send(to, 'Your subscription expires in 7 days', html);
}

export function sendSubscriptionExpiredEmail(to: string, fullName: string) {
  const html = shell(`
    <p>Hi ${escapeHtml(fullName)},</p>
    <p>Your JC Smartbag premium subscription has expired today. Add Trip, Add Bag, and live tracking are now disabled.</p>
    <p>Resubscribe to restore access — or buy a new tracking device for another free month.</p>
    <p style="margin:24px 0;text-align:center;">
      <a href="${APP_URL()}/subscription" style="display:inline-block;background:#1a73e8;color:#ffffff;padding:12px 22px;border-radius:10px;text-decoration:none;font-weight:700;">Subscribe</a>
      &nbsp;
      <a href="${APP_URL()}/devices" style="display:inline-block;background:#0b1f3a;color:#ffffff;padding:12px 22px;border-radius:10px;text-decoration:none;font-weight:700;">Buy device</a>
    </p>
  `);
  return send(to, 'Your subscription has expired', html);
}

export function sendTripCreatedEmail(to: string, fullName: string, trip: { flightNumber: string; departureAirport: string; destinationAirport: string; departureDateTime: Date; }) {
  const html = shell(`
    <p>Hi ${escapeHtml(fullName)},</p>
    <p>Your trip has been registered.</p>
    <table cellpadding="0" cellspacing="0" style="margin:16px 0;width:100%;background:#f9fafb;border-radius:10px;">
      <tr><td style="padding:14px 18px;font-size:14px;">
        <div><strong>Flight:</strong> ${escapeHtml(trip.flightNumber)}</div>
        <div><strong>Route:</strong> ${escapeHtml(trip.departureAirport)} → ${escapeHtml(trip.destinationAirport)}</div>
        <div><strong>Departure:</strong> ${trip.departureDateTime.toUTCString()}</div>
      </td></tr>
    </table>
    <p>You'll receive notifications as your bags move through their journey.</p>
  `);
  return send(to, `Trip ${trip.flightNumber} registered`, html);
}

export function sendTrackingUpdateEmail(to: string, fullName: string, args: { tagNumber: string; status: string; airportLocation?: string | null; remarks?: string | null; }) {
  const html = shell(`
    <p>Hi ${escapeHtml(fullName)},</p>
    <p>Your bag <strong>${escapeHtml(args.tagNumber)}</strong> just got a status update.</p>
    <table cellpadding="0" cellspacing="0" style="margin:16px 0;width:100%;background:#f9fafb;border-radius:10px;">
      <tr><td style="padding:14px 18px;font-size:14px;">
        <div><strong>Status:</strong> ${escapeHtml(args.status)}</div>
        ${args.airportLocation ? `<div><strong>Location:</strong> ${escapeHtml(args.airportLocation)}</div>` : ''}
        ${args.remarks ? `<div><strong>Remarks:</strong> ${escapeHtml(args.remarks)}</div>` : ''}
      </td></tr>
    </table>
    <p style="margin:24px 0;text-align:center;">
      <a href="${APP_URL()}/tracking" style="display:inline-block;background:#1a73e8;color:#ffffff;padding:12px 22px;border-radius:10px;text-decoration:none;font-weight:700;">Open tracking</a>
    </p>
  `);
  return send(to, `Tracking update — ${args.tagNumber}`, html);
}

export function sendDeviceOrderConfirmationEmail(
  to: string,
  fullName: string,
  order: {
    invoiceNumber: string;
    productName: string;
    quantity: number;
    totalAmount: number;   // USD cents
    currency: string;
    deviceIds: string[];
    invoiceUrl: string;
  }
) {
  const total = `$${(order.totalAmount / 100).toFixed(2)}`;
  const devList = order.deviceIds
    .map(id => `<li style="font-family:monospace;font-size:13px;margin:2px 0;">${escapeHtml(id)}</li>`)
    .join('');
  const html = shell(`
    <p>Hi ${escapeHtml(fullName)},</p>
    <p>Thank you for your purchase! Your order has been confirmed and your tracking device(s) are being prepared for shipment.</p>
    <table cellpadding="0" cellspacing="0" style="margin:16px 0;width:100%;background:#f9fafb;border-radius:10px;">
      <tr><td style="padding:14px 18px;font-size:14px;">
        <div><strong>Invoice:</strong> ${escapeHtml(order.invoiceNumber)}</div>
        <div><strong>Product:</strong> ${escapeHtml(order.productName)} × ${order.quantity}</div>
        <div><strong>Total:</strong> ${escapeHtml(total)}</div>
      </td></tr>
    </table>
    <p><strong>Your device ID${order.deviceIds.length > 1 ? 's' : ''}:</strong></p>
    <ul style="margin:8px 0 16px;padding-left:20px;">${devList}</ul>
    <p>Each device includes <strong>1 month of free premium</strong> — already activated on your account.</p>
    <p style="margin:24px 0;text-align:center;">
      <a href="${escapeHtml(order.invoiceUrl)}" style="display:inline-block;background:#1a73e8;color:#ffffff;padding:12px 22px;border-radius:10px;text-decoration:none;font-weight:700;">View Invoice</a>
    </p>
    <p>Need help? Reply to this email and we'll get back to you.</p>
  `);
  return send(to, `Order confirmed — ${order.invoiceNumber}`, html);
}

export function sendDeviceSubConfirmationEmail(
  to: string,
  fullName: string,
  subs: Array<{ deviceId: string; plan: string; expiresAt: Date }>
) {
  const planLabel = (p: string) => {
    if (p === 'MONTHLY_200')   return 'Monthly ($200)';
    if (p === 'QUARTERLY_400') return 'Quarterly ($400)';
    if (p === 'YEARLY_600')    return 'Yearly ($600)';
    return p;
  };
  const rows = subs
    .map(s => `
      <tr>
        <td style="padding:8px 18px;font-family:monospace;font-size:13px;">${escapeHtml(s.deviceId)}</td>
        <td style="padding:8px 18px;font-size:13px;">${escapeHtml(planLabel(s.plan))}</td>
        <td style="padding:8px 18px;font-size:13px;">${s.expiresAt.toDateString()}</td>
      </tr>`)
    .join('');
  const html = shell(`
    <p>Hi ${escapeHtml(fullName)},</p>
    <p>Your device subscription${subs.length > 1 ? 's are' : ' is'} now active. Here's a summary:</p>
    <table cellpadding="0" cellspacing="0" style="margin:16px 0;width:100%;background:#f9fafb;border-radius:10px;border-collapse:collapse;">
      <thead>
        <tr style="border-bottom:1px solid #e5e7eb;">
          <th style="padding:10px 18px;text-align:left;font-size:12px;text-transform:uppercase;color:#6b7280;">Device</th>
          <th style="padding:10px 18px;text-align:left;font-size:12px;text-transform:uppercase;color:#6b7280;">Plan</th>
          <th style="padding:10px 18px;text-align:left;font-size:12px;text-transform:uppercase;color:#6b7280;">Expires</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="margin:24px 0;text-align:center;">
      <a href="${APP_URL()}/subscription" style="display:inline-block;background:#1a73e8;color:#ffffff;padding:12px 22px;border-radius:10px;text-decoration:none;font-weight:700;">Manage Subscriptions</a>
    </p>
    <p>Need help? Reply to this email and we'll get back to you.</p>
  `);
  return send(to, `Subscription confirmed — ${subs.length} device${subs.length > 1 ? 's' : ''}`, html);
}

export async function sendTestEmail(to: string) {
  const html = shell(`
    <p><strong>SMTP test from JC Smartbag</strong></p>
    <p>If you can read this, your SMTP credentials are working correctly.</p>
    <p style="color:#6b7280;font-size:13px;">Sent at ${new Date().toUTCString()}.</p>
  `);
  return send(to, 'JC Smartbag — SMTP test', html);
}

function escapeHtml(s: string) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
