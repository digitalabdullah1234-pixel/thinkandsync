/**
 * The visitor's address, for rate limits. Only what the server in front of
 * the app writes itself is trusted: X-Real-IP, else the last X-Forwarded-For
 * entry (earlier entries are whatever the client sent). On the server, nginx
 * needs `proxy_set_header X-Real-IP $remote_addr;`.
 */
export function clientIp(h: Headers) {
  return h.get("x-real-ip")?.trim() || h.get("x-forwarded-for")?.split(",").pop()?.trim() || "local";
}

/** Calls per key in the current window. One server process, so memory is enough. */
const hits = new Map<string, { count: number; reset: number }>();

/** Counts a call for `key`; false once it has made more than `limit` calls within `windowMs`. */
export function allow(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const hit = hits.get(key);
  if (!hit || hit.reset <= now) {
    if (hits.size > 10_000) for (const [k, v] of hits) if (v.reset <= now) hits.delete(k);
    hits.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  hit.count += 1;
  return hit.count <= limit;
}
