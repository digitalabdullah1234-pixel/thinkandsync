"use client";

import { useEffect, useRef, type RefObject } from "react";
import { motion } from "framer-motion";
import { EASE } from "@/lib/motion";
import styles from "./CloudSky.module.css";

/** The cloud's outline: four overlapping rounds on a flat base (viewBox 24 4 168 102). */
const CLOUD = "M52 100 A22 22 0 1 1 54.3 56.1 A30 30 0 0 1 99.8 26.5 A36 36 0 0 1 165.4 52.3 A24 24 0 0 1 162 100 Z";

/** The three signs the clouds carry: the web, a database, code. (24 × 24 line icons.) */
const ICON = {
  web: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18",
  data: "M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zM4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3",
  code: "M8 8l-4 4 4 4M16 8l4 4-4 4M13.5 6l-3 12",
} as const;

/**
 * The row: where each cloud's centre sits across the strip (%), how far down
 * it hangs (% of the strip), and its sign. Code in the middle, highest; data
 * and the web either side, so the row reads the same in both directions.
 */
const ROW: { x: number; y: number; icon: keyof typeof ICON }[] = [
  { x: 6, y: 6, icon: "web" },
  { x: 27, y: 30, icon: "data" },
  { x: 50, y: 2, icon: "code" },
  { x: 73, y: 28, icon: "data" },
  { x: 94, y: 6, icon: "web" },
];

interface CloudSkyProps {
  /** The copy block: the clouds keep to the strip above it. */
  copyRef: RefObject<HTMLElement | null>;
  /** The intro has handed over: the clouds rise into place. */
  show: boolean;
  /** On screen in a visible tab: they may drift. */
  live: boolean;
  /** The site holds its motion back: they stay put. */
  still: boolean;
}

/**
 * The hero's sky: five small clouds drawn in a single line, each carrying the
 * sign of what we build in it (the web, data, code), floating across the top
 * between the header and the words. Under them the city and its fibres carry
 * the rest. Nothing here joins the fibres.
 *
 * The clouds rise in one after another when the intro hands over, then each
 * drifts on its own slow loop, a little up and down and a little side to side,
 * only while the hero is on screen.
 */
export function CloudSky({ copyRef, show, live, still }: CloudSkyProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const run = live && !still;

  // The strip runs from under the header to the top of the copy; measure the
  // copy so the clouds are sized to the room there is. A passive effect: the
  // copy renders after this layer, so its ref is set by then.
  useEffect(() => {
    const root = rootRef.current;
    const copy = copyRef.current;
    if (!root || !copy) return;
    const fit = () => {
      const room = Math.max(0, copy.offsetTop);
      root.style.setProperty("--room", `${room}px`);
      if (room - 4.7 * 16 < 38) root.setAttribute("data-tight", "");
      else root.removeAttribute("data-tight");
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(copy);
    observer.observe(root);
    return () => observer.disconnect();
  }, [copyRef]);

  return (
    <div ref={rootRef} className={styles.sky} aria-hidden>
      <div className={styles.strip}>
        {ROW.map(({ x, y, icon }, i) => (
          <motion.div
            key={i}
            className={styles.cloud}
            style={{ left: `${x}%`, top: `${y}%` }}
            initial={{ opacity: 0, y: 18 }}
            animate={show ? { opacity: 1, y: 0 } : undefined}
            transition={still ? { duration: 0 } : { duration: 1.1, delay: 0.3 + i * 0.09, ease: EASE }}
          >
            {/* up and down, each on its own slow cycle */}
            <motion.div
              style={{ width: "100%", height: "100%" }}
              initial={false}
              animate={run ? { y: [0, -(2 + (i % 3)), 0, (2 + (i % 3)) / 2, 0] } : { y: 0 }}
              transition={run ? { duration: 7 + i * 0.3, repeat: Infinity, ease: "easeInOut", delay: i * 0.18 } : { duration: 0.6 }}
            >
              {/* and side to side, slower still */}
              <motion.svg
                viewBox="24 4 168 102"
                initial={false}
                animate={run ? { x: ["-3%", "3%"] } : { x: "0%" }}
                transition={run ? { duration: 12 + ((i * 5) % 9), repeat: Infinity, repeatType: "mirror", ease: "easeInOut" } : { duration: 0.6 }}
              >
                <path className={styles.outline} d={CLOUD} vectorEffect="non-scaling-stroke" />
                <path className={styles.icon} d={ICON[icon]} transform="translate(84 44) scale(2)" vectorEffect="non-scaling-stroke" />
              </motion.svg>
            </motion.div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
