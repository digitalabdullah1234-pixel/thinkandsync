"use client";

import { useRef, type FocusEvent, type ReactNode } from "react";
import { motion, useAnimationFrame, useInView, useMotionValue } from "framer-motion";

const wrap = (min: number, max: number, v: number) => {
  const r = max - min;
  return ((((v - min) % r) + r) % r) + min;
};

interface MarqueeProps<T> {
  items: T[];
  /** Draws one item. `copy` is true for the repeats, which stay out of the tab order and away from screen readers. */
  render: (item: T, copy: boolean) => ReactNode;
  dir: "ltr" | "rtl";
  /** Pixels per second. */
  speed?: number;
  /** The share of the speed it keeps under the mouse. */
  slow?: number;
  gap: string;
  className?: string;
}

/**
 * A row that slides without end, against the reading direction (left in
 * English, right in Arabic). It eases almost to a stop under the mouse, stops
 * while one of its links has the keyboard, and only runs while on screen.
 */
export function Marquee<T>({ items, render, dir, speed = 45, slow = 0.15, gap, className }: MarqueeProps<T>) {
  const box = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const inView = useInView(box, { margin: "120px" });
  const x = useMotionValue(0);
  const rate = useRef(1);
  const hover = useRef(false);
  const focus = useRef(false);

  // Enough repeats that one copy is wider than any screen, however short the list.
  const rep = Math.max(2, Math.ceil(12 / Math.max(1, items.length)));

  useAnimationFrame((_, delta) => {
    const el = track.current;
    if (!inView || !el) return;
    const half = el.scrollWidth / 2;
    if (!half) return;
    const target = focus.current ? 0 : hover.current ? slow : 1;
    rate.current += (target - rate.current) * Math.min(1, delta / 160);
    const sign = dir === "rtl" ? 1 : -1;
    x.set(wrap(-half, 0, x.get() + sign * speed * rate.current * (Math.min(delta, 64) / 1000)));
  });

  // A link that takes the keyboard is brought into view (only the first copy has links in the tab order).
  const onFocus = (e: FocusEvent) => {
    focus.current = true;
    rate.current = 0;
    const b = box.current?.getBoundingClientRect();
    const t = track.current?.getBoundingClientRect();
    const r = (e.target as HTMLElement).getBoundingClientRect();
    if (!b || !t || !track.current) return;
    if (r.left >= b.left && r.right <= b.right) return;
    const half = track.current.scrollWidth / 2;
    x.set(Math.max(-half, Math.min(0, -(r.left - t.left) + 24)));
  };

  const group = (first: boolean) => (
    <div style={{ display: "flex", flexDirection: dir === "rtl" ? "row-reverse" : "row", alignItems: "center", gap, paddingInlineEnd: gap, flexShrink: 0 }}>
      {Array.from({ length: rep }, (_, r) =>
        items.map((item, i) => {
          const copy = !(first && r === 0);
          return (
            <span key={`${r}-${i}`} aria-hidden={copy || undefined} style={{ display: "contents", direction: dir }}>
              {render(item, copy)}
            </span>
          );
        }),
      )}
    </div>
  );

  return (
    <div
      ref={box}
      className={className}
      style={{ overflow: "clip", direction: "ltr" }}
      onPointerEnter={(e) => {
        if (e.pointerType === "mouse") hover.current = true;
      }}
      onPointerLeave={() => {
        hover.current = false;
      }}
      onFocus={onFocus}
      onBlur={() => {
        focus.current = false;
      }}
    >
      {/* The row and its track always run left to right (an Arabic row would hang the track off its right edge); in Arabic each copy lays its items out from the right instead, and each item keeps the page's direction. */}
      <motion.div ref={track} style={{ x, display: "flex", width: "max-content", direction: "ltr" }}>
        {group(true)}
        {group(false)}
      </motion.div>
    </div>
  );
}
