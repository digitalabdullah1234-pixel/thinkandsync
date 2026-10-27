"use client";

import { useSyncExternalStore } from "react";
import { useMediaQuery } from "./media";
import { HONOUR_REDUCED_MOTION } from "./motion-preference";

/**
 * True when the site should hold its motion back: only if it honours the
 * setting (see motion-preference.ts) and the visitor asked for less motion.
 * False on the server and through hydration either way.
 */
export function useReduceMotion(): boolean {
  const asked = useMediaQuery("(prefers-reduced-motion: reduce)");
  return HONOUR_REDUCED_MOTION && asked;
}

const subscribe = () => () => {};

/**
 * False on the server and through hydration, true after: for behaviour that
 * must not change the server markup (such as switching on drag).
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
