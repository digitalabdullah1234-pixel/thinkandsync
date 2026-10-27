import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * The admin's session token: an expiry time and its HMAC, signed with
 * ADMIN_SECRET and the password together, so changing either signs everyone
 * out. Plain Node crypto, so the admin pages and the proxy check it alike.
 */
export const ADMIN_COOKIE = "ts_admin";

export const adminConfigured = () => Boolean(process.env.ADMIN_PASSWORD && (process.env.ADMIN_SECRET?.length ?? 0) >= 16);

function key() {
  const secret = process.env.ADMIN_SECRET;
  const password = process.env.ADMIN_PASSWORD;
  if (!secret || secret.length < 16 || !password) throw new Error("Set ADMIN_PASSWORD and ADMIN_SECRET (16+ characters) in the environment.");
  return `${secret}:${password}`;
}

const sign = (value: string) => createHmac("sha256", key()).update(value).digest("base64url");

/** A token that holds until `expires` (ms since the epoch). */
export function makeToken(expires: number) {
  const value = String(expires);
  return `${value}.${sign(value)}`;
}

/** True for a token this server signed that has not yet expired. */
export function validToken(raw: string | undefined) {
  if (!raw || !adminConfigured()) return false;
  const [value, signature] = raw.split(".");
  if (!value || !signature) return false;
  const given = Buffer.from(signature);
  const wanted = Buffer.from(sign(value));
  return given.length === wanted.length && timingSafeEqual(given, wanted) && Number(value) > Date.now();
}
