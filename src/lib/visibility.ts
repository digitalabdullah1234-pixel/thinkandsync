"use client";

import { useEffect, useState, useSyncExternalStore, type RefObject } from "react";

/* ------------------------------------------------------- viewport presence */

/**
 * One IntersectionObserver for the whole page.
 *
 * Every caller used to bring its own — or, worse, its own `scroll` listener
 * calling `getBoundingClientRect()`. With ~30 reveals on the page that was
 * ~30 forced layouts per scroll tick, on the main thread, synchronously. A
 * single observer does the same job off the main thread and reports only when
 * the answer actually changes.
 */
type Watcher = (visible: boolean) => void;

const watchers = new WeakMap<Element, Set<Watcher>>();
let shared: IntersectionObserver | null = null;

function sharedObserver(): IntersectionObserver {
  if (!shared) {
    shared = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          watchers.get(entry.target)?.forEach((w) => w(entry.isIntersecting));
        }
      },
      { threshold: 0 },
    );
  }
  return shared;
}

/**
 * Watch one element. Returns the unsubscribe.
 *
 * Several callers may watch the same element (a drawing's pulse and its settle
 * fallback, say), so each element keeps a set of watchers, and the element is
 * only unobserved once the last one leaves.
 */
export function observeVisibility(el: Element, onChange: Watcher): () => void {
  const observer = sharedObserver();
  let set = watchers.get(el);
  if (!set) {
    set = new Set();
    watchers.set(el, set);
    observer.observe(el);
  } else {
    // A late joiner still needs the current answer, and the observer only
    // reports on change: re-observing makes it deliver a fresh entry.
    observer.unobserve(el);
    observer.observe(el);
  }
  set.add(onChange);
  return () => {
    const current = watchers.get(el);
    if (!current) return;
    current.delete(onChange);
    if (current.size === 0) {
      observer.unobserve(el);
      watchers.delete(el);
    }
  };
}

/**
 * True while the referenced element has any part inside the viewport.
 *
 * Starts `false` on the server and at mount; the observer fires immediately
 * with the real answer, so nothing is stranded.
 */
export function useInView(ref: RefObject<Element | null>): boolean {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    return observeVisibility(el, setInView);
  }, [ref]);

  return inView;
}

/* ----------------------------------------------------------- tab presence */

/**
 * Shared `document.hidden`. One listener for the whole app rather than one
 * per component that cares — and, being an external store, it costs a render
 * only when the answer flips.
 */
const pageListeners = new Set<() => void>();
let pageVisible = true;

function subscribePage(listener: () => void) {
  if (pageListeners.size === 0) {
    pageVisible = !document.hidden;
    document.addEventListener("visibilitychange", onVisibilityChange);
  }
  pageListeners.add(listener);
  return () => {
    pageListeners.delete(listener);
    if (pageListeners.size === 0) {
      document.removeEventListener("visibilitychange", onVisibilityChange);
    }
  };
}

function onVisibilityChange() {
  const next = !document.hidden;
  if (next === pageVisible) return;
  pageVisible = next;
  for (const listener of pageListeners) listener();
}

/** True while this tab is the foreground tab. */
export function usePageVisible(): boolean {
  return useSyncExternalStore(
    subscribePage,
    () => pageVisible,
    () => true,
  );
}
