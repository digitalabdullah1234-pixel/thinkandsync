"use client";

import { useRef, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useInView, usePageVisible } from "@/lib/visibility";

export interface GlowSpec {
  /** CSS position of the glow's centre inside the section. */
  x: string;
  y: string;
  /** CSS diameter. */
  size: string;
  color: "emerald" | "teal" | "cool";
  /** Drift amplitude in px. */
  drift?: number;
}

/**
 * The aurora's palette, at alphas that keep white body text above 4.5:1 once
 * the scrim is on top (the same budget the hero's canvas works to).
 */
const COLORS: Record<GlowSpec["color"], string> = {
  emerald: "rgba(16, 152, 90, 0.42)",
  teal: "rgba(20, 200, 166, 0.22)",
  cool: "rgba(47, 111, 237, 0.2)",
};

/** Seconds per drift loop, mismatched so no two glows ever sync up. */
const PERIODS = [23, 29, 19];

interface DarkSectionProps {
  id: string;
  glows: GlowSpec[];
  children: ReactNode;
  className?: string;
}

/**
 * A section set on the hero's night: the same ground, soft aurora glows that
 * drift on long loops, a scrim that sets the contrast floor, and film grain.
 *
 * The glows only move while the section is on screen in a visible tab, and
 * never under reduced motion — continuous motion is paid for only when seen.
 */
export function DarkSection({ id, glows, children, className }: DarkSectionProps) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion() ?? false;
  const onScreen = useInView(ref);
  const pageVisible = usePageVisible();
  const active = onScreen && pageVisible && !reduced;

  // `overflow-clip`, not `overflow-hidden`: a hidden overflow is still a
  // scroll container, so focusing a control inside (or scrollIntoView) can
  // scroll the section's own contents and slide the glow layer off its edge.
  return (
    <section
      ref={ref}
      id={id}
      className={`relative isolate overflow-clip bg-abyss text-white ${className ?? ""}`}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        {glows.map((g, i) => {
          const d = g.drift ?? 40;
          return (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                left: g.x,
                top: g.y,
                width: g.size,
                height: g.size,
                marginLeft: `calc(${g.size} / -2)`,
                marginTop: `calc(${g.size} / -2)`,
                background: `radial-gradient(circle, ${COLORS[g.color]} 0%, transparent 68%)`,
              }}
              animate={
                active
                  ? { x: [0, d, -d * 0.6, 0], y: [0, -d * 0.7, d, 0], scale: [1, 1.08, 0.96, 1] }
                  : { x: 0, y: 0, scale: 1 }
              }
              transition={
                active
                  ? { duration: PERIODS[i % PERIODS.length], repeat: Infinity, ease: "easeInOut" }
                  : { duration: reduced ? 0 : 1.2 }
              }
            />
          );
        })}
        {/* The contrast floor, and the texture that hides gradient banding. */}
        <div className="absolute inset-0 bg-abyss/30" />
        <div className="grain" />
      </div>
      {children}
    </section>
  );
}
