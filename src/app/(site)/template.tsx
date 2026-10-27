import type { ReactNode } from "react";
import { PageTransition } from "@/components/PageTransition";

// A template rather than the layout: Next gives it a new key per route, which
// is what makes the transition replay on navigation.
export default function Template({ children }: { children: ReactNode }) {
  return <PageTransition>{children}</PageTransition>;
}
