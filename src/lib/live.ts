"use client";

import type { RefObject } from "react";
import { useReducedMotion } from "framer-motion";
import { useInView, usePageVisible } from "./visibility";

/**
 * The one gate for continuous motion: true only while the element has any
 * part on screen, the tab is in front, and the visitor hasn't asked for less
 * motion. Loops (typing, charts, tickers, packets) run while this is true and
 * stop the moment it isn't, so nothing animates where nobody can see it.
 */
export function useLive(ref: RefObject<Element | null>): boolean {
  const inView = useInView(ref);
  const pageVisible = usePageVisible();
  const reduced = useReducedMotion() ?? false;
  return inView && pageVisible && !reduced;
}
