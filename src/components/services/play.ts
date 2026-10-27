"use client";

import { createContext, useContext, type RefObject } from "react";
import { useLive } from "@/lib/live";

/** Whether the screens inside may play. Outside a provider they always may. */
export const PlayContext = createContext(true);

/**
 * `useLive` for a service screen: it moves only while it is on screen in a
 * visible tab (an IntersectionObserver), and while its PlayContext allows.
 * The services section mounts one screen at a time, so only that one runs.
 */
export function useScreenLive(ref: RefObject<Element | null>): boolean {
  const live = useLive(ref);
  const play = useContext(PlayContext);
  return live && play;
}
