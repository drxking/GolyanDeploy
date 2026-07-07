const nodemailer = require('nodemailer');

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function textToHtml(value) {
  return escapeHtml(value).replace(/\r?\n/g, '<br>');
}

function verifyEmailConfig() {
  const missing = ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASS', 'EMAIL_FROM'].filter((key) => !process.env[key]);

  if (missing.length) {
    throw new Error(`Missing email configuration: ${missing.join(', ')}`);
  }
}

function createTransporter() {
  const port = Number(process.env.EMAIL_PORT || 587);

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

async function sendBulkEmail({ to, subject, message, unsubscribeUrl, businessName = 'Business Name' }) {
  verifyEmailConfig();

  const footerText = [
    '',
    '--',
    businessName,
    'You are receiving this email because you subscribed for course updates.',
    `Unsubscribe: ${unsubscribeUrl}`,
  ].join('\n');

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
      <div>${textToHtml(message)}</div>
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
      <p style="font-size: 13px; color: #4b5563; margin: 0 0 6px;">${escapeHtml(businessName)}</p>
      <p style="font-size: 12px; color: #6b7280; margin: 0 0 8px;">
        You are receiving this email because you subscribed for course updates.
      </p>
      <p style="font-size: 12px; margin: 0;">
        <a href="${escapeHtml(unsubscribeUrl)}" style="color: #2563eb;">Unsubscribe</a>
      </p>
    </div>
  `;

  return createTransporter().sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    text: `${message}${footerText}`,
    html,
  });
}

module.exports = { sendBulkEmail, verifyEmailConfig };
