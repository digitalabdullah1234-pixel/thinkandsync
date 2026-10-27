"use client";

import { useEffect, useId, useRef, useState } from "react";
import { animate, motion, useMotionValue } from "framer-motion";
import { EASE } from "@/lib/motion";
import { hhmmss, useBootTime } from "./clock";
import { useScreenLive } from "./play";
import styles from "./Screens.module.css";

type Priority = "High" | "Medium";

interface Ticket {
  /** How many tickets have come in since first paint (0 = the resolved one). */
  n: number;
  id: number;
  title: string;
  priority: Priority;
  /** When it was opened; `null` for the first, which opened 55min before page load. */
  openedAt: number | null;
}

const FIRST_TICKET: Ticket = { n: 0, id: 2380, title: "Access point down · Reception", priority: "High", openedAt: null };
const FIRST_OPENED_MINUTES_AGO = 55;

/** The tickets the desk works through, in turn. */
const QUEUE: readonly { title: string; priority: Priority }[] = [
  { title: "CAM-07 offline · Warehouse", priority: "High" },
  { title: "Wi-Fi slow · 2nd floor", priority: "Medium" },
  { title: "Door reader fault · Main entrance", priority: "High" },
  { title: "Disk warning · Rack A2", priority: "Medium" },
];

const STEPS = ["Ticket opened", "Engineer assigned", "On site", "Resolved"];
/** Minutes after opening that each step is reached. */
const OFFSETS = [0, 2, 38, 49];

const RADIUS = 46;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const sleep = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

/**
 * The support desk: one ticket at a time, from "opened" to "resolved", on a
 * timeline with its times and a ring that closes as it goes. "24/7 on call"
 * sits in the ring. The desk cycles through four tickets.
 *
 * First paint is ticket #2380, resolved, ring full. Tickets move only while
 * the screen is live.
 */
export function SupportScreen() {
  const ringId = `${useId().replace(/[^a-zA-Z0-9_-]/g, "")}-ring`;
  const rootRef = useRef<HTMLDivElement>(null);
  const turn = useRef(0);
  const spin = useMotionValue(0);
  const boot = useBootTime();
  const [ticket, setTicket] = useState(FIRST_TICKET);
  const [reached, setReached] = useState(STEPS.length);
  const live = useScreenLive(rootRef);

  useEffect(() => {
    if (!live) return;
    let cancelled = false;

    (async () => {
      await sleep(600);
      while (!cancelled) {
        await sleep(500);
        if (cancelled) return;
        const n = turn.current++;
        const next = QUEUE[n % QUEUE.length];
        setTicket({ n: n + 1, id: 2381 + n, title: next.title, priority: next.priority, openedAt: Date.now() });
        setReached(0);
        for (let i = 0; i < STEPS.length; i++) {
          await sleep(i ? 900 : 300);
          if (cancelled) return;
          setReached(i + 1);
        }
        await sleep(2200);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [live]);

  // The on-call light circles the ring; it picks up where it stopped.
  useEffect(() => {
    if (!live) return;
    const from = spin.get() % 360;
    const run = animate(spin, [from, from + 360], { duration: 6, ease: "linear", repeat: Infinity });
    return () => run.stop();
  }, [live, spin]);

  const opened =
    ticket.openedAt ?? (boot === null ? null : boot - FIRST_OPENED_MINUTES_AGO * 60_000);
  const timeOf = (i: number) => (opened === null ? "" : hhmmss(new Date(opened + OFFSETS[i] * 60_000)).slice(0, 5));

  return (
    <div ref={rootRef} data-screen="support" className={`${styles.root} ${styles.support}`}>
      <div className={styles.ticket}>
        <motion.div
          key={ticket.id}
          className={styles.ticketHead}
          initial={ticket.n === 0 ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE }}
        >
          <span className={styles.ticketId}>#{ticket.id}</span>
          <b className={styles.ticketTitle}>{ticket.title}</b>
          <em className={`${styles.priority} ${ticket.priority === "High" ? styles.priorityHigh : styles.priorityMedium}`}>
            {ticket.priority}
          </em>
        </motion.div>

        <div className={styles.steps}>
          <motion.span
            className={styles.stepsFill}
            initial={false}
            animate={{ scaleY: Math.max(0, reached - 1) / (STEPS.length - 1) }}
            transition={{ duration: 0.6, ease: EASE }}
          />
          {STEPS.map((label, i) => {
            const isDone = i < reached;
            const last = i === STEPS.length - 1;
            return (
              <div key={label} data-step="" className={isDone ? `${styles.step} is-done` : styles.step}>
                <motion.i
                  className={last ? `${styles.stepLit} ${styles.stepLitFinal}` : styles.stepLit}
                  initial={false}
                  animate={isDone ? { scale: 1, opacity: 1 } : { scale: 0.4, opacity: 0 }}
                  transition={isDone ? { type: "spring", stiffness: 420, damping: 16 } : { duration: 0.2 }}
                />
                <span>{label}</span>
                <small>{isDone ? timeOf(i) : ""}</small>
              </div>
            );
          })}
        </div>
      </div>

      <div className={styles.dial}>
        <svg viewBox="0 0 112 112">
          <defs>
            <linearGradient id={ringId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#fb923c" />
              <stop offset="1" stopColor="#22c55e" />
            </linearGradient>
          </defs>
          <circle cx="56" cy="56" r={RADIUS} fill="none" stroke="rgb(255 255 255 / 0.07)" strokeWidth={7} />
          <g transform="rotate(-90 56 56)">
            <motion.circle
              cx="56"
              cy="56"
              r={RADIUS}
              fill="none"
              stroke={`url(#${ringId})`}
              strokeWidth={7}
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE.toFixed(1)}
              initial={false}
              animate={{ strokeDashoffset: CIRCUMFERENCE * (1 - reached / STEPS.length) }}
              transition={{ duration: 0.7, ease: EASE }}
            />
          </g>
          {/* The invisible circle gives the group the ring's box, so it turns about the centre. */}
          <motion.g style={{ rotate: spin }}>
            <circle cx="56" cy="56" r={RADIUS} fill="none" />
            <circle cx="56" cy="10" r="3.2" fill="#fdba74" />
          </motion.g>
        </svg>
        <span className={styles.dialText}>
          <b>24/7</b>
          <small>on call</small>
        </span>
      </div>
    </div>
  );
}
