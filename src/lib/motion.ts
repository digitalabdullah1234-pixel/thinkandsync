"use client";

import { useEffect, type RefObject } from "react";
import { observeVisibility } from "./visibility";
import type { Transition, Variants } from "framer-motion";

/** One easing curve for the whole site — quick to leave, slow to arrive. */
export const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Shared viewport settings for every scroll reveal: play once, as soon as 15%
 * of the element has entered the viewport.
 */
export const VIEWPORT = { once: true, amount: 0.15 } as const;

export const REVEAL_DURATION = 0.8;
export const ITEM_DURATION = 0.7;
export const PAGE_DURATION = 0.45;

/** Grace period on top of an animation's duration before the fallback fires. */
export const SETTLE_GRACE_MS = 500;

/** Fade and slide up from `y`px. The end state is a plain, fully visible box. */
export const fadeUp = (y: number): Variants => ({
  hidden: { opacity: 0, y },
  visible: { opacity: 1, y: 0 },
});

/**
 * Parent of a staggered group. It carries no visual state of its own — it only
 * hands `hidden`/`visible` down to its children and spaces them out.
 *
 * `staggerChildren` is deprecated in Motion 13; `delayChildren` now takes the
 * per-child function `(index, total) => delay` instead.
 */
export const staggerContainer = (stagger: number): Variants => ({
  hidden: {},
  visible: {
    transition: { delayChildren: (index: number) => index * stagger },
  },
});

/** Hover and press feel, shared by every interactive element. */
export const HOVER_TRANSITION: Transition = { duration: 0.25, ease: EASE };

/** Buttons and pill CTAs: a small lift, and a press that gives way. */
export const lift = {
  whileHover: { y: -2 },
  whileTap: { y: 0, scale: 0.98 },
  transition: HOVER_TRANSITION,
} as const;

/** Cards: the same idea with a little more travel. */
export const liftCard = {
  whileHover: { y: -6 },
  transition: HOVER_TRANSITION,
} as const;

/** Icon buttons: no room to travel, so they grow instead. */
export const press = {
  whileHover: { scale: 1.05 },
  whileTap: { scale: 0.94 },
  transition: HOVER_TRANSITION,
} as const;

/**
 * Text links and list rows: slide along the reading direction, so the site
 * behaves the same way in Arabic as it does in English.
 */
export const nudge = (dir: "ltr" | "rtl", distance = 4) => ({
  whileHover: { x: dir === "rtl" ? -distance : distance },
  transition: HOVER_TRANSITION,
});

/**
 * Guarantees a reveal ends fully visible.
 *
 * `whileInView` needs an IntersectionObserver, a healthy motion tree and
 * requestAnimationFrame to all behave. If any of them doesn't, the element
 * would sit at its `initial` opacity forever. So once the element is inside
 * the viewport we give the animation its expected window and then — only if
 * it is *still* fully transparent — write the finished state ourselves.
 *
 * A no-op whenever the animation actually ran.
 */
export function useVisibilityFallback(
  ref: RefObject<HTMLElement | null>,
  armed: boolean,
  settleMs: number,
) {
  useEffect(() => {
    if (!armed) return;
    const el = ref.current;
    if (!el) return;

    let timer = 0;
    let stopObserving: (() => void) | null = null;

    const stop = () => {
      window.clearTimeout(timer);
      stopObserving?.();
      stopObserving = null;
    };

    const settle = () => {
      stop();
      // The one layout read in here happens at most once per element, long
      // after the animation window, and never on the scroll path.
      if (window.getComputedStyle(el).opacity !== "0") return;
      el.style.opacity = "1";
      el.style.transform = "none";
    };

    // The old version answered "is this on screen?" with a `scroll` listener
    // and `getBoundingClientRect()` — one forced layout per element per scroll
    // tick, and this hook is mounted on roughly thirty elements. The shared
    // observer answers the same question off the main thread and only speaks
    // up when the answer changes.
    stopObserving = observeVisibility(el, (visible) => {
      if (!visible || timer) return;
      timer = window.setTimeout(settle, settleMs);
    });

    return stop;
  }, [ref, armed, settleMs]);
}

/**
 * The group version of `useVisibilityFallback`: for containers whose children
 * animate individually (split words, staggered tags), where the container
 * itself never goes transparent and so can't be the thing that is checked.
 * Also covers SVG strokes drawn with `pathLength`.
 *
 * Once the container is on screen, wait out the animation window, then write
 * the finished state onto any matching child still sitting at opacity 0.
 */
export function useSettleChildren(
  ref: RefObject<Element | null>,
  selector: string,
  armed: boolean,
  settleMs: number,
) {
  useEffect(() => {
    if (!armed) return;
    const el = ref.current;
    if (!el) return;
    let timer = 0;

    const stopObserving = observeVisibility(el, (visible) => {
      if (!visible || timer) return;
      timer = window.setTimeout(() => {
        el.querySelectorAll<HTMLElement | SVGElement>(selector).forEach((child) => {
          if (window.getComputedStyle(child).opacity !== "0") return;
          child.style.opacity = "1";
          child.style.transform = "none";
          child.style.filter = "none";
          // SVG strokes drawn with pathLength sit behind a dash pattern.
          child.style.strokeDasharray = "none";
          child.style.strokeDashoffset = "0";
        });
      }, settleMs);
    });

    return () => {
      window.clearTimeout(timer);
      stopObserving();
    };
  }, [ref, selector, armed, settleMs]);
}
