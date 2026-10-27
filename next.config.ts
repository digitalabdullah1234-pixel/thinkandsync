import type { NextConfig } from "next";

const dev = process.env.NODE_ENV === "development";

/**
 * What the browser may load and do. Everything the site uses comes from its
 * own address; blob: is the admin's preview of a picked file. Next's inline
 * scripts need 'unsafe-inline' without nonces (and dev needs eval and the
 * hot-reload socket).
 */
const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data:",
  "media-src 'self' blob:",
  "font-src 'self'",
  `connect-src 'self'${dev ? " ws: wss:" : ""}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(dev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: CSP },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  // HTTPS only from here on, for the site and the admin subdomain (live site only).
  ...(dev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }]),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
  // Development only: lets a phone or tablet on the office network open the
  // dev server (http://192.168.1.2:3000) and run the page fully. No effect on
  // production builds.
  allowedDevOrigins: ["192.168.1.2"],
  experimental: {
    // The admin uploads photos (up to 10 MB) and project films (up to 60 MB)
    // through Server Actions, whose default limit is 1 MB.
    serverActions: { bodySizeLimit: "75mb" },
    // The site and the admin have separate root layouts, so unmatched
    // addresses get app/global-not-found.tsx.
    globalNotFound: true,
  },
};

export default nextConfig;
