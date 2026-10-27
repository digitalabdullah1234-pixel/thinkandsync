import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Page not found · ThinkSync",
};

/** Any address that matches no page (the site and the admin have separate root layouts, so this one stands alone). */
export default function GlobalNotFound() {
  return (
    <html lang="en">
      <body style={{ minHeight: "100vh", display: "grid", placeItems: "center", margin: 0, background: "#060d0a", color: "#edebe3", fontFamily: "system-ui, sans-serif", textAlign: "center", padding: "1.5rem" }}>
        <main style={{ display: "grid", gap: "1rem", justifyItems: "center" }}>
          <p style={{ margin: 0, color: "#2fd08a", font: "600 .8rem/1 ui-monospace, Consolas, monospace", letterSpacing: ".16em" }}>404</p>
          <h1 style={{ margin: 0, fontSize: "clamp(1.8rem, 5vw, 3rem)" }}>This page does not exist.</h1>
          {/* A plain link on purpose: this page stands outside both root layouts, so going home is a full page load. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/" style={{ color: "#04100b", background: "#2fd08a", padding: ".8rem 1.4rem", borderRadius: 999, textDecoration: "none", fontWeight: 600 }}>
            Back to ThinkSync
          </a>
        </main>
      </body>
    </html>
  );
}
