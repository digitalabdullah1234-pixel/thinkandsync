"use client";

import type { ReactNode } from "react";
import { MotionConfig } from "framer-motion";
import "@/lib/motion-override";
import { HONOUR_REDUCED_MOTION } from "@/lib/motion-preference";

/**
 * When the site honours reduced motion (see motion-preference.ts),
 * `reducedMotion="user"` makes every motion component skip transform
 * animations for anyone who asked, while still letting opacity settle. By the
 * owner's choice it currently doesn't: "never" plays everything for everyone.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion={HONOUR_REDUCED_MOTION ? "user" : "never"}>{children}</MotionConfig>;
}
