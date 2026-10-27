"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useIsPresent,
  type AnimationPlaybackControls,
} from "framer-motion";
import { Check } from "lucide-react";
import { EASE } from "@/lib/motion";
import { smoothPath } from "@/lib/svg";
import { useScreenLive } from "./play";
import styles from "./Screens.module.css";

/** The chart's drawing box. It is stretched to fit, so the dot uses percentages. */
const W = 400;
const H = 130;

/** Three 12-point datasets the chart morphs between, in percent of its height. */
const SETS = [
  [30, 38, 34, 46, 44, 58, 52, 64, 61, 72, 70, 84],
  [26, 34, 42, 40, 50, 48, 60, 58, 68, 66, 78, 90],
  [34, 30, 44, 50, 47, 56, 66, 62, 70, 77, 75, 86],
] as const;

/** Last month, drawn dashed behind this month. */
const PREVIOUS = [22, 28, 26, 34, 33, 40, 38, 46, 45, 52, 50, 58] as const;

type Point = readonly [number, number];
const toPoints = (set: readonly number[]): Point[] =>
  set.map((v, i) => [8 + i * ((W - 24) / (set.length - 1)), H - 8 - (v / 100) * (H - 22)] as const);
const areaOf = (line: string) => `${line} L${W - 16} ${H} L8 ${H} Z`;

const FIRST = toPoints(SETS[0]);
const FIRST_LINE = smoothPath(FIRST);
const FIRST_END = FIRST[FIRST.length - 1];
const PREVIOUS_LINE = smoothPath(toPoints(PREVIOUS));

/** Where a chart point sits in the chart box (the SVG starts 12px down). */
const leftOf = (p: Point) => `${(p[0] / W) * 100}%`;
const topOf = (p: Point) => `calc(12px + (100% - 12px) * ${(p[1] / H).toFixed(4)})`;

const count = new Intl.NumberFormat("en-US");
const FIRST_REQUESTS = 12480;

const JOBS = [
  { name: "Riyadh branch portal", status: "Live", ok: true, color: "#8b5cf6" },
  { name: "Inventory API", status: "Live", ok: true, color: "#3b82f6" },
  { name: "HR self-service", status: "Deploying", ok: false, color: "#22d3ee" },
  { name: "Customer app 2.8", status: "Live", ok: true, color: "#f59e0b" },
  { name: "Access control sync", status: "Live", ok: true, color: "#f43f5e" },
  { name: "Reports service", status: "Queued", ok: false, color: "#10b981" },
] as const;
type Job = (typeof JOBS)[number];

/** The table always shows exactly this many rows. */
const ROWS = 4;
const START_ROWS = JOBS.slice(0, ROWS).map((job, key) => ({ key, job }));
const AGES_AT_REST = ["2m ago", "9m ago", "24m ago", "1h ago"];
const AGES_LIVE = ["just now", "1m ago", "4m ago", "12m ago"];

const sleep = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

/**
 * One deployment row. While it is leaving it carries `data-leaving`, so a
 * check can count the rows that are really on the table.
 */
function JobRow({ job, age }: { job: Job; age: string }) {
  const present = useIsPresent();
  return (
    <motion.div
      layout
      data-row=""
      data-leaving={present ? undefined : ""}
      className={styles.row}
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.5, ease: EASE }}
    >
      <i className={styles.avatar} style={{ background: `linear-gradient(135deg, ${job.color}, #111827)` }} />
      <span className={styles.rowName}>{job.name}</span>
      <em className={job.ok ? styles.statusOk : styles.statusWait}>{job.status}</em>
      <small className={styles.rowAge}>{age}</small>
    </motion.div>
  );
}

/**
 * A client's operations dashboard: the chart morphs to new data every 2.8s,
 * a new deployment slides onto the top of the table every 3.6s (the bottom
 * one leaves, so it always shows four), and a pointer presses "Deploy" and
 * raises a toast about every 6s.
 *
 * First paint is the first dataset and four rows, nothing in flight. Every
 * loop runs only while the screen is live.
 */
export function SoftwareScreen() {
  const gradientId = `${useId().replace(/[^a-zA-Z0-9_-]/g, "")}-area`;
  const rootRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<SVGPathElement>(null);
  const areaRef = useRef<SVGPathElement>(null);
  const dotRef = useRef<HTMLSpanElement>(null);
  const tipRef = useRef<HTMLSpanElement>(null);
  const requestsRef = useRef<HTMLElement>(null);
  const latencyRef = useRef<HTMLElement>(null);
  const deployRef = useRef<HTMLSpanElement>(null);
  const rippleRef = useRef<HTMLSpanElement>(null);
  const cursorRef = useRef<SVGSVGElement>(null);
  const toastRef = useRef<HTMLDivElement>(null);
  // Where the chart and counter were when the loop last stopped.
  const chart = useRef({ points: FIRST, set: 0, requests: FIRST_REQUESTS });
  const nextKey = useRef(ROWS);
  const [rows, setRows] = useState(START_ROWS);
  const [ticked, setTicked] = useState(false);
  const live = useScreenLive(rootRef);

  // The chart and the counters: new data every 2.8s, eased in over 1.2s.
  useEffect(() => {
    const line = lineRef.current;
    const area = areaRef.current;
    const dot = dotRef.current;
    const tip = tipRef.current;
    const requests = requestsRef.current;
    const latency = latencyRef.current;
    if (!live || !line || !area || !dot || !tip || !requests || !latency) return;

    const state = chart.current;
    const running: AnimationPlaybackControls[] = [];

    const draw = (points: Point[]) => {
      const d = smoothPath(points);
      line.setAttribute("d", d);
      area.setAttribute("d", areaOf(d));
      const end = points[points.length - 1];
      for (const el of [dot, tip]) {
        el.style.left = leftOf(end);
        el.style.top = topOf(end);
      }
    };

    const tick = () => {
      running.splice(0).forEach((c) => c.stop());
      state.set = (state.set + 1) % SETS.length;
      const from = state.points;
      const to = toPoints(SETS[state.set]);
      running.push(
        animate(0, 1, {
          duration: 1.2,
          ease: EASE,
          onUpdate: (t) => {
            state.points = from.map((p, i) => [p[0], p[1] + (to[i][1] - p[1]) * t] as const);
            draw(state.points);
          },
        }),
      );
      const target = state.requests + 40 + Math.round(Math.random() * 220);
      running.push(
        animate(state.requests, target, {
          duration: 1,
          ease: "easeOut",
          onUpdate: (v) => {
            state.requests = Math.round(v);
            const text = count.format(state.requests);
            requests.textContent = text;
            tip.textContent = text;
          },
        }),
      );
      latency.textContent = `${168 + Math.round(Math.random() * 28)} ms`;
    };
    // The first change comes almost at once, so the card answers as it starts playing.
    const first = window.setTimeout(tick, 200);
    const id = window.setInterval(tick, 2800);

    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
      running.forEach((c) => c.stop());
    };
  }, [live]);

  // The table: a new row on top every 3.6s; the bottom one leaves.
  useEffect(() => {
    if (!live) return;
    const id = window.setInterval(() => {
      const key = nextKey.current++;
      setRows((current) => [{ key, job: JOBS[key % JOBS.length] }, ...current].slice(0, ROWS));
      setTicked(true);
    }, 3600);
    return () => window.clearInterval(id);
  }, [live]);

  // The pointer: to "Deploy", press, toast, away; about every 6s.
  useEffect(() => {
    const root = rootRef.current;
    const deploy = deployRef.current;
    const ripple = rippleRef.current;
    const cursor = cursorRef.current;
    const toast = toastRef.current;
    if (!live || !root || !deploy || !ripple || !cursor || !toast) return;

    let cancelled = false;
    let running: AnimationPlaybackControls[] = [];
    const track = (c: AnimationPlaybackControls) => {
      running.push(c);
      return c;
    };

    (async () => {
      // The first lap starts sooner, while the card has just started playing.
      let lap = 0;
      while (!cancelled) {
        await sleep(lap++ ? 2400 : 900);
        if (cancelled) return;
        // Measured each lap: the card can change size between them.
        const r = root.getBoundingClientRect();
        const b = deploy.getBoundingClientRect();
        const bx = b.left - r.left + b.width * 0.55;
        const by = b.top - r.top + b.height * 0.6;
        const sx = r.width * 0.8;
        const sy = r.height * 0.95;

        await track(animate(cursor, { x: [sx, bx], y: [sy, by], opacity: [0, 1] }, { duration: 1, ease: EASE }));
        if (cancelled) return;
        track(animate(cursor, { scale: [1, 0.8, 1] }, { duration: 0.26 }));
        track(animate(deploy, { scale: [1, 0.94, 1] }, { duration: 0.26 }));
        track(animate(ripple, { scale: [0, 10], opacity: [0.6, 0] }, { duration: 0.6, ease: "easeOut" }));
        await sleep(240);
        if (cancelled) return;
        track(animate(toast, { opacity: [0, 1], y: [16, 0] }, { type: "spring", stiffness: 320, damping: 24 }));
        await sleep(1800);
        if (cancelled) return;
        track(animate(toast, { opacity: 0, y: 10 }, { duration: 0.35 }));
        await track(animate(cursor, { x: sx, y: sy, opacity: 0 }, { duration: 0.8, ease: EASE }));
        running = [];
      }
    })();

    return () => {
      cancelled = true;
      running.forEach((c) => c.stop());
      cursor.style.opacity = "0";
      toast.style.opacity = "0";
      ripple.style.opacity = "0";
    };
  }, [live]);

  const ages = ticked ? AGES_LIVE : AGES_AT_REST;

  return (
    <div ref={rootRef} data-screen="software" className={`${styles.root} ${styles.soft}`}>
      <div className={styles.chrome}>
        <i />
        <i />
        <i />
        <span className={styles.url}>app.client.sa/operations</span>
      </div>
      <div className={styles.softBody}>
        <div className={styles.side}>
          <b className={styles.logo} />
          <i className={`${styles.nav} ${styles.navOn}`} />
          <i className={styles.nav} />
          <i className={styles.nav} />
          <i className={styles.nav} />
          <i className={styles.nav} />
        </div>
        <div className={styles.main}>
          <div className={styles.top}>
            <div>
              <small>Overview</small>
              <strong>Operations</strong>
            </div>
            <div className={styles.actions}>
              <span className={styles.pill}>Last 30 days</span>
              <span ref={deployRef} className={styles.deploy}>
                Deploy
                <span ref={rippleRef} className={styles.ripple} />
              </span>
            </div>
          </div>

          <div className={styles.kpis}>
            <div className={styles.kpi}>
              <small>Requests</small>
              <b ref={requestsRef}>{count.format(FIRST_REQUESTS)}</b>
              <em>+12.4%</em>
            </div>
            <div className={styles.kpi}>
              <small>Active users</small>
              <b>3,214</b>
              <em>+8.1%</em>
            </div>
            <div className={styles.kpi}>
              <small>Avg. response</small>
              <b ref={latencyRef}>182 ms</b>
              <em>−14%</em>
            </div>
          </div>

          <div className={styles.chart}>
            <div className={styles.legend}>
              <span>
                <i style={{ background: "#a78bfa" }} />
                This month
              </span>
              <span>
                <i style={{ background: "#60a5fa", opacity: 0.7 }} />
                Last month
              </span>
            </div>
            <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="rgb(139 92 246 / 0.42)" />
                  <stop offset="1" stopColor="rgb(139 92 246 / 0)" />
                </linearGradient>
              </defs>
              <path
                d={`M0 32 H${W} M0 64 H${W} M0 96 H${W}`}
                stroke="rgb(255 255 255 / 0.05)"
                vectorEffect="non-scaling-stroke"
              />
              <path ref={areaRef} d={areaOf(FIRST_LINE)} fill={`url(#${gradientId})`} />
              <path
                d={PREVIOUS_LINE}
                fill="none"
                stroke="#60a5fa"
                strokeWidth={1.6}
                strokeDasharray="4 5"
                opacity={0.6}
                vectorEffect="non-scaling-stroke"
              />
              <path
                ref={lineRef}
                d={FIRST_LINE}
                fill="none"
                stroke="#a78bfa"
                strokeWidth={2.6}
                vectorEffect="non-scaling-stroke"
              />
            </svg>
            <span ref={dotRef} className={styles.chartDot} style={{ left: leftOf(FIRST_END), top: topOf(FIRST_END) }} />
            <span ref={tipRef} className={styles.chartTip} style={{ left: leftOf(FIRST_END), top: topOf(FIRST_END) }}>
              {count.format(FIRST_REQUESTS)}
            </span>
          </div>

          <div className={styles.table}>
            <AnimatePresence mode="popLayout" initial={false}>
              {rows.map((row, i) => (
                <JobRow key={row.key} job={row.job} age={ages[i]} />
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <svg ref={cursorRef} className={styles.cursor} viewBox="0 0 24 24">
        <path d="M4 2l16 9-7 2-3 7z" fill="#fff" stroke="#0b1016" strokeWidth={1.2} />
      </svg>
      <div ref={toastRef} className={styles.toast}>
        <b>
          <Check size={11} strokeWidth={3} />
        </b>
        Deployed to production · v2.8
      </div>
    </div>
  );
}
