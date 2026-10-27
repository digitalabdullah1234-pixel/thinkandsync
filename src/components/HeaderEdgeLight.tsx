"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { EASE } from "@/lib/motion";
import { usePageVisible } from "@/lib/visibility";

interface HeaderEdgeLightProps {
  /** True while the header sits over the hero (its transparent state). */
  visible: boolean;
}

/** Off-screen lead-in and run-out, so the star enters and leaves the viewport. */
const RUN_OFF = 90;

/** Length of the travelling light, in px. Short: a glint, not a stripe. */
const LIGHT_PX = 60;

/** One pass along the edge, then a rest before the next. */
const PASS_SECONDS = 3.2;
const REST_SECONDS = 2.5;

/**
 * The header's bottom edge, traced from the left of the screen to the right:
 * the left bevel, the raised notch under the nav, the right bevel. The same
 * measurements the HUD silhouette clips to (`--cut`, `--notch-half`,
 * `--notch-depth` on the header row), so the line sits exactly on its edge.
 */
function edgePath(w: number, h: number, cut: number, half: number, depth: number) {
  const y = h - 0.5; // on the pixel, so the 1px line stays crisp
  const mid = w / 2;
  return [
    `M ${-RUN_OFF} ${y - cut}`,
    `L 0 ${y - cut}`,
    `L ${cut} ${y}`,
    `L ${mid - half - depth} ${y}`,
    `L ${mid - half} ${y - depth}`,
    `L ${mid + half} ${y - depth}`,
    `L ${mid + half + depth} ${y}`,
    `L ${w - cut} ${y}`,
    `L ${w} ${y - cut}`,
    `L ${w + RUN_OFF} ${y - cut}`,
  ].join(" ");
}

const px = (el: Element, name: string) =>
  parseFloat(getComputedStyle(el).getPropertyValue(name)) || 0;

/**
 * Over the hero, the header has no surface — just type on the aurora. This
 * gives it an edge: a faint line along the notched silhouette, and a short
 * white light that runs along it from left to right, rests, and runs again.
 *
 * Continuous motion, so it only runs while the header is over the hero in a
 * visible tab; reduced motion keeps the line and drops the light. Decorative
 * throughout: hidden from assistive tech and never in the way of a click.
 */
export function HeaderEdgeLight({ visible }: HeaderEdgeLightProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion() ?? false;
  const pageVisible = usePageVisible();
  const [d, setD] = useState<string | null>(null);
  // The light's length as a fraction of the whole path, so it stays ~60px
  // whatever the screen width.
  const [dash, setDash] = useState(0.04);

  // Rebuild the path whenever the bar changes size — the notch is centred and
  // its measurements change at the phone breakpoint.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const { width, height } = el.getBoundingClientRect();
      if (!width || !height) return;
      setDash(LIGHT_PX / (width + RUN_OFF * 2));
      setD(
        edgePath(
          width,
          height,
          px(el, "--cut"),
          px(el, "--notch-half"),
          px(el, "--notch-depth"),
        ),
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const running = visible && pageVisible && !reduced && d !== null;

  return (
    <motion.div
      ref={ref}
      data-edge-light=""
      aria-hidden
      className="pointer-events-none absolute inset-0"
      initial={false}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: reduced ? 0 : 0.35, ease: EASE }}
    >
      {d ? (
        <svg className="absolute inset-0 h-full w-full overflow-visible" fill="none">
          {/* The layer: the silhouette's edge, just visible on the dark hero. */}
          <path d={d} stroke="rgb(255 255 255 / 0.16)" strokeWidth={1} />

          {/* The light: a short white segment of that same line, slid along
              it. Being part of the stroke, it bends cleanly with the edge
              instead of a rigid streak swinging out at every corner. It starts
              and ends in the off-screen run-out, so it enters on the left and
              leaves on the right. */}
          {running ? (
            <motion.path
              key={d}
              data-edge-light-line=""
              d={d}
              stroke="#ffffff"
              strokeWidth={1.5}
              strokeLinecap="round"
              style={{ filter: "drop-shadow(0 0 3px rgb(255 255 255 / 0.7))" }}
              initial={{ pathLength: dash, pathOffset: 0 }}
              animate={{ pathLength: dash, pathOffset: 1 - dash }}
              transition={{
                duration: PASS_SECONDS,
                ease: "easeInOut",
                repeat: Infinity,
                repeatDelay: REST_SECONDS,
              }}
            />
          ) : null}
        </svg>
      ) : null}
    </motion.div>
  );
}
