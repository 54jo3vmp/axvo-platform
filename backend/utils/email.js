// AXVO Backend — Email sending via Resend
// Uses Resend's default onboarding@resend.dev sender until a custom
// domain is verified in the Resend dashboard (fine for testing).

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_ADDRESS = process.env.EMAIL_FROM || 'AXVO <onboarding@resend.dev>';

async function sendEmail({ to, subject, html }) {
  if (!RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY is not set — skipping email send.');
    return { skipped: true };
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ from: FROM_ADDRESS, to, subject, html })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('[email] Resend API error:', response.status, errorBody);
    throw new Error(`Failed to send email (status ${response.status})`);
  }

  return response.json();
}

module.exports = { sendEmail };
