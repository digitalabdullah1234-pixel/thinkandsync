"use client";

import { useSyncExternalStore } from "react";

/**
 * Hard ceiling on the intro overlay. Nothing in the app may keep the site
 * hidden past this point — the Preloader uses it as a kill switch, and the
 * module-level timer below unlocks scroll reveals even if the Preloader
 * never mounts or throws while setting up its canvas.
 */
export const INTRO_HARD_TIMEOUT_MS = 5000;

let done = false;
const listeners = new Set<() => void>();

export function markIntroDone() {
  if (done) return;
  done = true;
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

const getSnapshot = () => done;
// Matches the client's state at hydration time, so reveals don't mismatch.
const getServerSnapshot = () => false;

export function useIntroDone() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

if (typeof window !== "undefined") {
  window.setTimeout(markIntroDone, INTRO_HARD_TIMEOUT_MS);
}
