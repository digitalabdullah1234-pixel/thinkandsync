import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./admin.css";

export const metadata: Metadata = {
  title: "ThinkSync admin",
  robots: { index: false, follow: false },
};

/** The admin has its own page shell: none of the site's intro, cursor or page transitions. */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="a-body">{children}</body>
    </html>
  );
}
