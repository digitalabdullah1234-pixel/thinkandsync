"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import "@/lib/motion-override";
import { useFinePointer } from "@/lib/media";
import styles from "./CustomCursor.module.css";

/** Anything that should make the glow swell. */
const INTERACTIVE =
  'a, button, [role="button"], input, textarea, select, label, summary, [data-cursor-hot]';

/*
 * There is deliberately no easing constant here any more.
 *
 * The glow used to chase the pointer with exponential smoothing at 0.6 per
 * frame, which by construction leaves it two thirds of a frame of travel
 * behind — a visible green smear trailing the cursor on any quick flick. The
 * loop below writes the pointer's exact coordinate instead, so the bloom is
 * under the pointer on the same frame the browser delivered the event.
 */

/**
 * A soft green bloom that follows the pointer.
 *
 * This deliberately does NOT replace the system cursor.
 *
 * It used to: a black dot was drawn at the pointer and the native cursor was
 * hidden. That shipped a bug that made the site unclickable — the dot carried
 * its position in `transform` and its hover state in the standalone CSS `scale`
 * property, and per CSS Transforms Level 2 the individual transform properties
 * compose as translate -> rotate -> scale -> transform. `scale` therefore
 * multiplies the translation inside `transform`, so the instant the pointer
 * approached a link (scale 2.1) the drawn dot leapt to 2.1x its real
 * coordinates while the true pointer stayed put.
 *
 * The system cursor is pixel-accurate by construction, so it stays visible and
 * this is purely decorative. The lesson is kept structurally rather than as a
 * comment: the follower's position and its scale live on two different
 * elements, so they can never multiply again.
 *
 * Every layer is pointer-events: none, and nothing here is ever a hit target.
 */
export function CustomCursor() {
  const reduced = useReducedMotion() ?? false;
  const fine = useFinePointer();
  /** Positioned by the rAF loop. Carries translation and nothing else. */
  const followRef = useRef<HTMLDivElement>(null);
  /** Scaled by CSS state. Carries scale and nothing else. */
  const glowRef = useRef<HTMLDivElement>(null);

  const active = fine && !reduced;

  useEffect(() => {
    if (!active) return;
    const follow = followRef.current;
    const glow = glowRef.current;
    if (!follow || !glow) return;

    /*
     * Everything the loop touches lives in these closures rather than in
     * React state: a pointer moves far more often than 60 times a second, and
     * a re-render per move would be the most expensive way imaginable to
     * write one transform.
     */
    let x = -200;
    let y = -200;
    /** Set by the pointer, cleared by the loop. The loop's only wake-up. */
    let dirty = false;
    let visible = false;
    let frame = 0;
    let running = false;

    /*
     * The single rAF loop. It reads nothing from the DOM — no
     * getBoundingClientRect, no getComputedStyle, no offsetWidth — so it can
     * never force a layout, and it writes one composited property on one
     * already-promoted layer.
     *
     * Pointer events are dispatched before rAF callbacks within a frame, so
     * the coordinate written here is the newest one the browser has, and the
     * bloom lands under the pointer rather than behind it.
     */
    const tick = () => {
      if (!dirty) {
        // Caught up. Stop burning frames until the pointer moves again.
        running = false;
        return;
      }
      dirty = false;
      follow.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      frame = requestAnimationFrame(tick);
    };

    const wake = () => {
      if (running) return;
      running = true;
      frame = requestAnimationFrame(tick);
    };

    const show = (on: boolean) => {
      if (visible === on) return;
      visible = on;
      follow.style.opacity = on ? "1" : "0";
    };

    const move = (event: PointerEvent) => {
      // A move from a finger or pen means the mouse is no longer the input
      // device; stand down rather than glowing where nobody is pointing.
      if (event.pointerType !== "mouse") return;
      x = event.clientX;
      y = event.clientY;
      dirty = true;
      show(true);
      wake();
    };

    /*
     * Hover state. `pointerover` fires on every element boundary crossed, so
     * a single sweep across a paragraph can fire it dozens of times; running
     * `closest()` and a class write each time is pure waste. Both the last
     * element asked about and the last answer given are remembered, so the
     * DOM is only touched when the answer actually changes.
     */
    let lastTarget: Element | null = null;
    let hot = false;

    const over = (event: Event) => {
      const el = event.target;
      const target = el instanceof Element ? el : null;
      if (target === lastTarget) return;
      lastTarget = target;

      const next = !!target?.closest(INTERACTIVE);
      if (next === hot) return;
      hot = next;
      glow.classList.toggle(styles.hot, next);
    };

    const down = () => glow.classList.add(styles.down);
    const up = () => glow.classList.remove(styles.down);
    const hide = () => show(false);

    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerover", over, { passive: true });
    document.addEventListener("pointerleave", hide);
    window.addEventListener("blur", hide);
    window.addEventListener("pointerdown", down, { passive: true });
    window.addEventListener("pointerup", up, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerover", over);
      document.removeEventListener("pointerleave", hide);
      window.removeEventListener("blur", hide);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
    };
  }, [active]);

  if (!active) return null;

  return (
    <div ref={followRef} className={styles.follow} aria-hidden>
      <div ref={glowRef} className={styles.glow} />
    </div>
  );
}
