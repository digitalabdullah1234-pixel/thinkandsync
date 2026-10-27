import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, validToken } from "@/lib/admin-token";

/**
 * The admin on its own domain. With ADMIN_HOST set (e.g. admin.thinksync.sa),
 * that domain serves only the panel (its address opens /admin), and the
 * site's domain answers /admin with "not found". Both domains point at this
 * one app, so a save in the panel reaches the site at once: same data folder,
 * same page cache. Unset (local development), both work on one address.
 */
const ADMIN_HOST = process.env.ADMIN_HOST?.trim().toLowerCase();

const isAdminPath = (path: string) => path === "/admin" || path.startsWith("/admin/");

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  /*
   * Posts. The site's pages take none (the contact form posts to /api/contact),
   * and in the panel only the sign-in form may post without a signed-in admin.
   * The actions check the session again; this turns strangers away before
   * Next reads a body that may be up to 75 MB.
   */
  if (request.method === "POST" && !pathname.startsWith("/api/")) {
    if (!isAdminPath(pathname)) return new NextResponse("Method not allowed", { status: 405 });
    if (pathname !== "/admin/login" && !validToken(request.cookies.get(ADMIN_COOKIE)?.value)) {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  if (!ADMIN_HOST) return NextResponse.next();
  // The domain the visitor typed, as the server in front of the app passed it on.
  const host = (request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "").split(",")[0].trim();
  if (host.split(":")[0].toLowerCase() === ADMIN_HOST) {
    // The panel and the uploaded pictures it previews; anything else opens the panel.
    if (isAdminPath(pathname) || pathname.startsWith("/media/")) return NextResponse.next();
    // A relative address, so it stays right behind Cloudflare/Traefik whether they speak http or https.
    return new NextResponse(null, { status: 307, headers: { Location: "/admin" } });
  }
  // An address that matches no page, so the site's own "not found" page answers.
  if (isAdminPath(pathname)) return NextResponse.rewrite(new URL("/__admin-elsewhere", request.url));
  return NextResponse.next();
}

export const config = {
  // Pages and actions only: Next's own files and anything with a file extension pass straight through.
  matcher: ["/((?!_next/|.*\\.[a-zA-Z0-9]+$).*)"],
};
