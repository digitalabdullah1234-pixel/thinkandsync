"use client";

import { useRef, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { EASE, PAGE_DURATION, SETTLE_GRACE_MS, useVisibilityFallback } from "@/lib/motion";

/**
 * Wraps everything Next renders for a route. `template.tsx` hands it a fresh
 * key on every navigation, so the incoming page fades in each time.
 *
 * Opacity only, on purpose: a transform here would create a containing block
 * around the sticky header. The flex classes keep the body's column layout
 * intact now that this sits between <body> and the page.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion() ?? false;

  useVisibilityFallback(ref, true, PAGE_DURATION * 1000 + SETTLE_GRACE_MS);

  return (
    <motion.div
      ref={ref}
      data-page=""
      className="flex flex-1 flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={
        reduced ? { duration: 0 } : { duration: PAGE_DURATION, ease: EASE }
      }
    >
      {children}
    </motion.div>
  );
}
