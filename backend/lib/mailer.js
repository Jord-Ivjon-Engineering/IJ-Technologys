'use strict';

/**
 * Transactional email via Resend (https://resend.com).
 *
 * Used to notify the studio inbox whenever a new contact submission arrives.
 * Uses Node's built-in fetch (Node 18+), so there's no extra dependency.
 *
 * Env vars (see .env.example):
 *   RESEND_API_KEY    — required to actually send; if unset, sending is skipped
 *   CONTACT_NOTIFY_TO — where lead notifications go (your inbox)
 *   CONTACT_FROM      — the "from" address. Defaults to Resend's shared sender,
 *                       which can only deliver to your own account email. Set a
 *                       verified-domain sender here once you have one.
 */

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

const {
  RESEND_API_KEY,
  CONTACT_NOTIFY_TO,
  CONTACT_FROM = 'IJ Technology <onboarding@resend.dev>',
} = process.env;

let warnedMissingConfig = false;

/** Escape user-provided text before dropping it into the HTML email body. */
function esc(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Email a new contact submission to the studio inbox.
 * Best-effort: resolves to false (and logs) instead of throwing, so a mail
 * failure never blocks the API response or loses the already-saved lead.
 *
 * @param {{name:string,email:string,message:string,receivedAt?:string,ip?:string,userAgent?:string}} sub
 * @returns {Promise<boolean>} whether the email was accepted for delivery
 */
async function sendLeadNotification(sub) {
  if (!RESEND_API_KEY || !CONTACT_NOTIFY_TO) {
    if (!warnedMissingConfig) {
      console.warn(
        '[mailer] RESEND_API_KEY and/or CONTACT_NOTIFY_TO not set — ' +
          'contact submissions are saved but no email is sent.'
      );
      warnedMissingConfig = true;
    }
    return false;
  }

  const received = sub.receivedAt || new Date().toISOString();
  const subject = `New contact submission — ${sub.name}`;
  const html = `
    <h2 style="margin:0 0 12px">New contact submission</h2>
    <table style="border-collapse:collapse;font:14px/1.5 system-ui,sans-serif">
      <tr><td style="padding:4px 12px 4px 0;color:#666">Name</td><td>${esc(sub.name)}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#666">Email</td><td>${esc(sub.email)}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#666;vertical-align:top">Message</td><td style="white-space:pre-wrap">${esc(sub.message)}</td></tr>
      <tr><td style="padding:4px 12px 4px 0;color:#666">Received</td><td>${esc(received)}</td></tr>
      ${sub.ip ? `<tr><td style="padding:4px 12px 4px 0;color:#666">IP</td><td>${esc(sub.ip)}</td></tr>` : ''}
    </table>
  `;

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: CONTACT_FROM,
        to: [CONTACT_NOTIFY_TO],
        // Lets you hit "reply" in your inbox and answer the lead directly.
        reply_to: sub.email,
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      console.error(`[mailer] Resend responded ${res.status}: ${detail}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[mailer] Failed to send lead notification:', err.message);
    return false;
  }
}

module.exports = { sendLeadNotification };
