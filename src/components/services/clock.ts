"use client";

import { useSyncExternalStore } from "react";

const pad = (n: number) => String(n).padStart(2, "0");

/** 14:03:09 */
export const hhmmss = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

/** 2026-10-04 14:03:09, the way a camera burns it into the picture. */
export const camStamp = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${hhmmss(d)}`;

let bootTime: number | null = null;
const subscribe = () => () => {};
const getSnapshot = () => (bootTime ??= Date.now());
const getServerSnapshot = () => null;

/**
 * When the page booted, in the browser only.
 *
 * The server render and the hydration pass both get `null`, so the markup
 * matches; React then re-renders once with the real time. That is what lets
 * a screen show real clock times without a hydration mismatch.
 */
export function useBootTime(): number | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
