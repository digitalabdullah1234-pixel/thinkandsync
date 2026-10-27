import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { mailConfigured, sendMail, type Mail } from "@/lib/mailer";
import { allow, clientIp } from "@/lib/rate-limit";
import { updateInquiries, type Inquiry } from "@/lib/store";

interface ContactPayload {
  name?: unknown;
  company?: unknown;
  phone?: unknown;
  service?: unknown;
  options?: unknown;
  notes?: unknown;
  /** Older form fields, still accepted. */
  contact?: unknown;
  message?: unknown;
}

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** The form's request is a few hundred bytes; anything past this is not the form. */
const MAX_BYTES = 16 * 1024;

const refuse = (status: number, error: string) => NextResponse.json({ success: false, error }, { status });

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** The email the team gets for a request. Everything the visitor typed is escaped. */
function requestMail(q: Inquiry): Mail {
  const rows = (
    [
      ["Name", q.name],
      ["Company", q.company],
      ["Phone", q.phone],
      ["Service", q.service],
      ["Needs", q.options.join(", ")],
      ["Notes", q.notes],
    ] as const
  ).filter(([, value]) => value);
  const when = new Date(q.at).toLocaleString("en-GB", { timeZone: "Asia/Riyadh", dateStyle: "medium", timeStyle: "short" });
  const phone = q.phone.replace(/[^\d+]/g, "");
  const cell = (label: string, value: string) =>
    `<tr><td style="padding:8px 16px 8px 0;color:#5b655f;vertical-align:top;white-space:nowrap">${label}</td><td style="padding:8px 0;color:#16211c">${
      label === "Phone" ? `<a href="tel:${esc(phone)}" style="color:#0b7c43">${esc(value)}</a>` : esc(value).replace(/\n/g, "<br>")
    }</td></tr>`;
  return {
    subject: `New project request: ${q.name}${q.service ? ` (${q.service})` : ""}`,
    text: `New project request from the website\n\n${rows.map(([label, value]) => `${label}: ${value}`).join("\n")}\n\nReceived ${when} (Riyadh time)`,
    html: `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.5"><h2 style="margin:0 0 12px;color:#0b7c43">New project request</h2><table style="border-collapse:collapse">${rows
      .map(([label, value]) => cell(label, value))
      .join("")}</table><p style="margin-top:16px;color:#5b655f;font-size:13px">Received ${esc(when)} (Riyadh time), from the website's &ldquo;Start a project&rdquo; form. It is also in the admin's Requests tab.</p></div>`,
  };
}

/** True when the request comes from a page on this same site (browsers always send Origin with a POST). */
function sameSite(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host.split(",")[0].trim();
  } catch {
    return false;
  }
}

/**
 * The "Start a project" form. Each request is kept for the admin panel
 * (Requests tab), newest first.
 */
export async function POST(request: Request) {
  // Only this site's own form: another site's page can't post here (CSRF), and
  // a plain HTML form can't send JSON.
  if (!sameSite(request)) return refuse(403, "Forbidden.");
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return refuse(415, "Send JSON.");
  if (Number(request.headers.get("content-length") ?? 0) > MAX_BYTES) return refuse(413, "Request too large.");
  // Five requests per address per ten minutes, and 300 an hour in all, so nobody can flood the Requests tab.
  if (!allow(`contact:${clientIp(request.headers)}`, 5, 10 * 60 * 1000) || !allow("contact:all", 300, 60 * 60 * 1000)) {
    return refuse(429, "Too many requests. Please try again later.");
  }

  let body: ContactPayload;
  try {
    const text = await request.text();
    if (text.length > MAX_BYTES) return refuse(413, "Request too large.");
    body = JSON.parse(text);
  } catch {
    return refuse(400, "Invalid request body.");
  }
  if (!body || typeof body !== "object") return refuse(400, "Invalid request body.");

  const name = str(body.name, 120);
  const phone = str(body.phone, 40) || str(body.contact, 120);

  if (!name || !phone) {
    return NextResponse.json({ success: false, error: "Missing required fields." }, { status: 400 });
  }

  const inquiry: Inquiry = {
    id: randomUUID(),
    at: new Date().toISOString(),
    name,
    company: str(body.company, 160),
    phone,
    service: str(body.service, 120),
    options: Array.isArray(body.options) ? body.options.map((o) => str(o, 120)).filter(Boolean).slice(0, 20) : [],
    notes: str(body.notes, 3000) || str(body.message, 3000),
  };

  // Emailed to the team (once the mailer is set up, see src/lib/mailer.ts) and
  // kept in the admin's Requests tab (the newest 5,000). Either one is enough.
  const mail = mailConfigured() ? sendMail(requestMail(inquiry)) : null;
  const [saved, mailed] = await Promise.allSettled([updateInquiries((list) => [inquiry, ...list].slice(0, 5000)), mail]);
  if (saved.status === "rejected") console.error("[ThinkSync] Could not save the inquiry:", saved.reason);
  if (mail && mailed.status === "rejected") console.error("[ThinkSync] Could not email the inquiry:", mailed.reason);
  if (saved.status === "rejected" && !(mail && mailed.status === "fulfilled")) {
    return NextResponse.json({ success: false, error: "Could not save the request." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
