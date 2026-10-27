"use client";

import { useEffect, useId, useRef } from "react";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { useScreenLive } from "./play";
import styles from "./Screens.module.css";

const MONO = 'ui-monospace, "SFMono-Regular", "Cascadia Mono", Consolas, monospace';

type Pt = readonly [number, number];

const APS: readonly { at: Pt; name: string }[] = [
  { at: [96, 64], name: "AP-1" },
  { at: [212, 150], name: "AP-2" },
  { at: [322, 62], name: "AP-3" },
];

/** The device's walk round the floor: ten points, back to the start. */
const PATH: readonly Pt[] = [
  [40, 176],
  [120, 164],
  [186, 128],
  [250, 96],
  [340, 118],
  [356, 176],
  [250, 186],
  [150, 184],
  [70, 124],
  [40, 176],
];
const LAP_SECONDS = 14;
/** Where the device stands in the first paint, as a fraction of the lap. */
const START = 0.18;
/** The label updates four times a second, so the reading is legible. */
const LABEL_STEPS = LAP_SECONDS * 4;
/** The tag sits right of the phone, or left of it near the east wall. */
const TAG_WIDTH = 88;
const tagOffset = (x: number) => (x > 290 ? -TAG_WIDTH - 10 : 10);

const SEGMENTS = PATH.slice(1).map((p, i) => Math.hypot(p[0] - PATH[i][0], p[1] - PATH[i][1]));
const TOTAL = SEGMENTS.reduce((a, b) => a + b, 0);

/** The point a fraction `t` of the way round the path. */
function pointAt(t: number): Pt {
  let d = (((t % 1) + 1) % 1) * TOTAL;
  for (let i = 0; i < SEGMENTS.length; i++) {
    if (d <= SEGMENTS[i]) {
      const u = d / SEGMENTS[i];
      return [PATH[i][0] + (PATH[i + 1][0] - PATH[i][0]) * u, PATH[i][1] + (PATH[i + 1][1] - PATH[i][1]) * u];
    }
    d -= SEGMENTS[i];
  }
  return PATH[0];
}

/** The access point nearest a point, and how far away it is. */
function nearest(p: Pt) {
  let best = APS[0];
  let distance = Infinity;
  for (const ap of APS) {
    const d = Math.hypot(ap.at[0] - p[0], ap.at[1] - p[1]);
    if (d < distance) {
      distance = d;
      best = ap;
    }
  }
  return { ap: best, distance };
}

const labelAt = (t: number) => {
  const { ap, distance } = nearest(pointAt(Math.floor(t * LABEL_STEPS) / LABEL_STEPS));
  return `${ap.name} · −${Math.round(34 + distance / 4)} dBm`;
};

const linkAt = (t: number) => {
  const p = pointAt(t);
  const { ap } = nearest(p);
  return `M${p[0].toFixed(1)} ${p[1].toFixed(1)} L${ap.at[0]} ${ap.at[1]}`;
};

/**
 * A floor plan with three access points. A phone walks the floor on a 14s
 * lap; a dashed line always runs to the nearest access point, and its tag
 * reads that AP and the signal (−34 dBm, less a quarter of the distance).
 * The coverage pools breathe.
 *
 * First paint has the phone a little way into its lap. Nothing moves unless
 * the screen is live; the lap resumes where it stopped.
 */
export function WifiScreen() {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const rootRef = useRef<HTMLDivElement>(null);
  const progress = useMotionValue(START);
  const x = useTransform(progress, (t) => pointAt(t)[0]);
  const y = useTransform(progress, (t) => pointAt(t)[1]);
  const link = useTransform(progress, linkAt);
  const label = useTransform(progress, labelAt);
  const tagX = useTransform(x, tagOffset);
  const live = useScreenLive(rootRef);

  useEffect(() => {
    if (!live) return;
    const from = progress.get() % 1;
    const lap = animate(progress, [0, 1], { duration: LAP_SECONDS, ease: "linear", repeat: Infinity });
    lap.time = from * LAP_SECONDS;
    return () => lap.stop();
  }, [live, progress]);

  return (
    <div ref={rootRef} data-screen="wifi" className={`${styles.root} ${styles.wifi}`}>
      <svg viewBox="0 0 400 216">
        <defs>
          <radialGradient id={`${uid}-cov`} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="rgb(59 130 246 / 0.55)" />
            <stop offset="0.55" stopColor="rgb(59 130 246 / 0.2)" />
            <stop offset="1" stopColor="rgb(59 130 246 / 0)" />
          </radialGradient>
        </defs>

        {APS.map(({ at: [cx, cy] }, i) => (
          <motion.circle
            key={cx}
            cx={cx}
            cy={cy}
            r={96}
            fill={`url(#${uid}-cov)`}
            initial={false}
            animate={live ? { scale: [0.9, 1.06, 0.9], opacity: [0.85, 1, 0.85] } : { scale: 1, opacity: 1 }}
            transition={
              live
                ? { duration: 3.6, delay: i * 0.8, repeat: Infinity, ease: "easeInOut" }
                : { duration: 0.4 }
            }
          />
        ))}

        {/* The outer wall, then the inner walls with their door gaps. */}
        <g fill="none" stroke="rgb(203 213 225 / 0.38)" strokeWidth={2} strokeLinecap="square">
          <rect x="20" y="16" width="360" height="184" rx="4" />
          <path d="M20 106 H132 M168 106 H262 M300 106 H380 M150 16 V58 M150 86 V200 M262 16 V70 M262 128 V200" />
        </g>
        <g fill="rgb(203 213 225 / 0.08)">
          <rect x="30" y="118" width="40" height="18" rx="3" />
          <rect x="170" y="26" width="30" height="40" rx="3" />
          <rect x="290" y="150" width="60" height="22" rx="3" />
        </g>

        <motion.path d={link} stroke="#93c5fd" strokeWidth={1.4} strokeDasharray="3 4" fill="none" />

        {APS.map(({ at: [cx, cy], name }) => (
          <g key={name} transform={`translate(${cx} ${cy})`}>
            <circle r={9} fill="#f8fafc" />
            <circle r={4} fill="none" stroke="#3b82f6" strokeWidth={2} />
            <text x={12} y={-8} fontFamily={MONO} fontSize={8} fontWeight={700} fill="#bfdbfe">
              {name}
            </text>
          </g>
        ))}

        <motion.g style={{ x, y }}>
          <circle r={11} fill="rgb(96 165 250 / 0.2)" />
          <circle r={5} fill="#fff" stroke="#3b82f6" strokeWidth={2.4} />
          <motion.g style={{ x: tagX, y: -30 }}>
            <rect width={TAG_WIDTH} height={20} rx={6} fill="rgb(15 23 42 / 0.92)" stroke="rgb(96 165 250 / 0.6)" />
            <motion.text x={8} y={13.5} fontFamily={MONO} fontSize={8.5} fontWeight={700} fill="#dbeafe">
              {label}
            </motion.text>
          </motion.g>
        </motion.g>
      </svg>
    </div>
  );
}
