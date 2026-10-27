/**
 * Sends the site's emails: today, each contact-form request to the team.
 *
 * Provider: Resend (resend.com), over its REST API, so no extra package. To
 * connect it, set these in the server's environment (.env.local here):
 *   RESEND_API_KEY  the key from resend.com → API Keys
 *   MAIL_FROM       a sender on a domain verified in Resend,
 *                   e.g. ThinkSync website <website@thinksync.sa>
 *   MAIL_TO         where requests arrive (default info@thinksync.sa;
 *                   several addresses separated by commas)
 *
 * Another provider: replace the body of `sendMail` (and `mailConfigured`).
 * The contact route only calls these two.
 *
 * Until it is set up nothing is sent, and requests still reach the admin's
 * Requests tab.
 */
export interface Mail {
  subject: string;
  text: string;
  html: string;
}

export const mailConfigured = () => Boolean(process.env.RESEND_API_KEY && process.env.MAIL_FROM);

export async function sendMail(mail: Mail): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM;
  if (!key || !from) throw new Error("Email is not set up: RESEND_API_KEY and MAIL_FROM are missing.");
  const to = (process.env.MAIL_TO || "info@thinksync.sa")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, subject: mail.subject.replace(/[\r\n]+/g, " "), text: mail.text, html: mail.html }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) throw new Error(`Resend answered ${res.status}: ${(await res.text()).slice(0, 300)}`);
}
