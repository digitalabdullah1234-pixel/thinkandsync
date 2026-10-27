"use client";

import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useIsPresent,
  type AnimationPlaybackControls,
} from "framer-motion";
import { Check, Fingerprint, X } from "lucide-react";
import { EASE } from "@/lib/motion";
import { hhmmss, useBootTime } from "./clock";
import { useScreenLive } from "./play";
import styles from "./Screens.module.css";

const DOORS = [
  "Main entrance",
  "Server room",
  "Finance office",
  "Warehouse gate",
  "Parking barrier",
  "Meeting room 2",
];

interface Entry {
  key: number;
  door: string;
  ok: boolean;
  /** When it happened; the first rows are instead `minutesAgo` before page load. */
  at: number | null;
  minutesAgo: number;
}

const START_LOG: Entry[] = [
  { key: 0, door: "Server room", ok: true, at: null, minutesAgo: 3 },
  { key: 1, door: "Main entrance", ok: true, at: null, minutesAgo: 7 },
  { key: 2, door: "Warehouse gate", ok: false, at: null, minutesAgo: 12 },
  { key: 3, door: "Finance office", ok: true, at: null, minutesAgo: 18 },
];
/** The log never shows more than this many rows. */
const MAX_ROWS = 5;

const GRANTED = "#22c55e";
const DENIED = "#fb7185";
const IDLE = "#64748b";
const RING_IDLE = "rgb(251 113 133 / 0.35)";

const sleep = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

function LogLine({ entry, time }: { entry: Entry; time: string }) {
  const present = useIsPresent();
  return (
    <motion.div
      layout
      data-row=""
      data-leaving={present ? undefined : ""}
      className={styles.logRow}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45, ease: EASE }}
    >
      <i className={entry.ok ? styles.lampOk : styles.lampNo} />
      <span className={styles.logText}>
        {entry.door}
        <span className={styles.verdict}> · {entry.ok ? "Granted" : "Denied"}</span>
      </span>
      <small>{time}</small>
    </motion.div>
  );
}

/**
 * A fingerprint reader and its door log. Each turn the scan bar sweeps the
 * pad (1.5s); twice the finger is let through (green), the third time it is
 * refused (coral) and the reader shakes. Every result tops the log, which
 * keeps at most five rows.
 *
 * First paint is the reader at rest with four earlier entries. The turns run
 * only while the screen is live.
 */
export function AccessScreen() {
  const rootRef = useRef<HTMLDivElement>(null);
  const padRef = useRef<HTMLDivElement>(null);
  const scanRef = useRef<HTMLSpanElement>(null);
  const turn = useRef(0);
  const nextKey = useRef(START_LOG.length);
  const boot = useBootTime();
  const [log, setLog] = useState(START_LOG);
  const [result, setResult] = useState({ ok: true, shown: false });
  const live = useScreenLive(rootRef);

  useEffect(() => {
    const pad = padRef.current;
    const scan = scanRef.current;
    if (!live || !pad || !scan) return;

    let cancelled = false;
    let running: AnimationPlaybackControls[] = [];
    const track = (c: AnimationPlaybackControls) => {
      running.push(c);
      return c;
    };

    (async () => {
      // The first scan comes almost at once, so the card answers as it starts playing.
      let lap = 0;
      while (!cancelled) {
        await sleep(lap++ ? 900 : 250);
        if (cancelled) return;
        setResult((r) => ({ ...r, shown: false }));
        const n = turn.current++;
        const ok = n % 3 !== 2;
        const door = DOORS[n % DOORS.length];

        await track(
          animate(
            scan,
            { y: ["-100%", "667%", "-100%"], opacity: [0, 1, 1, 0] },
            { duration: 1.5, ease: "easeInOut", opacity: { duration: 1.5, times: [0, 0.08, 0.92, 1] } },
          ),
        );
        if (cancelled) return;

        setResult({ ok, shown: true });
        if (!ok) track(animate(pad, { x: [0, -6, 6, -4, 4, 0] }, { duration: 0.45 }));
        const key = nextKey.current++;
        const at = Date.now();
        setLog((rows) => [{ key, door, ok, at, minutesAgo: 0 }, ...rows].slice(0, MAX_ROWS));

        await sleep(1500);
        if (cancelled) return;
        setResult((r) => ({ ...r, shown: false }));
        running = [];
      }
    })();

    return () => {
      cancelled = true;
      running.forEach((c) => c.stop());
      scan.style.opacity = "0";
    };
  }, [live]);

  const tone = result.shown ? (result.ok ? GRANTED : DENIED) : IDLE;
  const timeOf = (entry: Entry) => {
    if (entry.at !== null) return hhmmss(new Date(entry.at));
    return boot === null ? "" : hhmmss(new Date(boot - entry.minutesAgo * 60_000));
  };

  return (
    <div ref={rootRef} data-screen="access" className={`${styles.root} ${styles.access}`}>
      <div className={styles.reader}>
        <div ref={padRef} className={styles.pad}>
          <motion.span
            className={styles.ring}
            animate={{ borderColor: result.shown ? tone : RING_IDLE }}
            transition={{ duration: 0.25 }}
          />
          <motion.span className={styles.fingerprint} animate={{ color: tone }} transition={{ duration: 0.25 }}>
            <Fingerprint size={92} strokeWidth={1.75} absoluteStrokeWidth />
          </motion.span>
          {/* Above the ridges, so the light passes over them. */}
          <span className={styles.scanClip}>
            <span ref={scanRef} className={styles.scan} />
          </span>
        </div>
        <motion.span
          className={`${styles.badge} ${result.ok ? styles.badgeOk : styles.badgeNo}`}
          initial={false}
          animate={result.shown ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.7 }}
          transition={result.shown ? { type: "spring", stiffness: 420, damping: 18 } : { duration: 0.3 }}
        >
          {result.ok ? <Check size={12} strokeWidth={3} /> : <X size={12} strokeWidth={3} />}
          {result.ok ? "Access granted" : "Access denied"}
        </motion.span>
      </div>

      <div className={styles.log}>
        <span className={styles.logHead}>Access log</span>
        <div className={styles.logRows}>
          <AnimatePresence mode="popLayout" initial={false}>
            {log.map((entry) => (
              <LogLine key={entry.key} entry={entry} time={timeOf(entry)} />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
