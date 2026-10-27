import { createHash, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, adminConfigured, makeToken, validToken } from "./admin-token";
import { clientIp } from "./rate-limit";

export { adminConfigured };

/**
 * The admin's sign-in: one password (ADMIN_PASSWORD) and a signed cookie
 * (see admin-token.ts).
 */
const WEEK = 7 * 24 * 60 * 60;

const digest = (value: string) => createHash("sha256").update(value).digest();

/**
 * Failed sign-ins: ten wrong passwords lock that address out for fifteen
 * minutes, and a hundred from all addresses together lock sign-in for
 * everyone for fifteen minutes, so changing addresses doesn't help a guesser.
 */
const failures = new Map<string, { count: number; until: number }>();
const LIMIT = 10;
const ALL_LIMIT = 100;
const LOCK_MS = 15 * 60 * 1000;

/** Checks the password and, if right, signs in. Returns an error message, or null on success. */
export async function signIn(password: string): Promise<string | null> {
  if (!adminConfigured()) return "The admin password is not set on the server.";
  const who = clientIp(await headers());
  const now = Date.now();
  const f = failures.get(who);
  const all = failures.get("*");
  if ((f && f.count >= LIMIT && f.until > now) || (all && all.count >= ALL_LIMIT && all.until > now)) return "Too many wrong passwords. Try again in 15 minutes.";
  if (!timingSafeEqual(digest(password), digest(process.env.ADMIN_PASSWORD!))) {
    for (const [k, prev] of [[who, f], ["*", all]] as const) {
      failures.set(k, { count: prev && prev.until > now ? prev.count + 1 : 1, until: now + LOCK_MS });
    }
    return "Wrong password.";
  }
  failures.delete(who);
  (await cookies()).set(ADMIN_COOKIE, makeToken(now + WEEK * 1000), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: WEEK,
  });
  return null;
}

export async function signOut() {
  (await cookies()).delete(ADMIN_COOKIE);
}

export async function isAdmin() {
  return validToken((await cookies()).get(ADMIN_COOKIE)?.value);
}

/** For every admin page and action: sends anyone not signed in to the sign-in page. */
export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}
