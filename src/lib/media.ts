"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Subscribes to a media query.
 *
 * `useSyncExternalStore` rather than `useState` + `useEffect` on purpose: the
 * query is external state, so React reads it during render on the client and
 * re-reads it when it changes — no cascading render on mount, and a mouse
 * plugged into a tablet mid-session is picked up like any other change.
 *
 * The server snapshot is always `false`, so anything gated on a query is
 * absent from the HTML and appears on hydration instead of flashing.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** True only where a real pointer can hover — mouse or trackpad, not a finger. */
export function useFinePointer(): boolean {
  return useMediaQuery("(pointer: fine)");
}
