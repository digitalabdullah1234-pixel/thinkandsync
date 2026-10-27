"use client";

import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useIsPresent,
  type AnimationPlaybackControls,
} from "framer-motion";
import { PhoneCall, PhoneIncoming } from "lucide-react";
import { EASE } from "@/lib/motion";
import { useScreenLive } from "./play";
import styles from "./Screens.module.css";

const OPTIONS = ["Sales", "Support", "Accounts"] as const;
type Dept = (typeof OPTIONS)[number];

/** The desks the IVR hands each department's calls to, in turn. */
const DESKS: Record<Dept, readonly [string, string]> = {
  Sales: ["Ext. 204", "Ext. 207"],
  Support: ["Ext. 311", "Ext. 315"],
  Accounts: ["Ext. 118", "Ext. 121"],
};

/** Callers, masked the way the board shows them. */
const NUMBERS = ["+966 11 4•• ••27", "+966 12 6•• ••83", "+966 13 8•• ••15", "+966 11 2•• ••90", "+966 14 5•• ••62"];

type Stage = "ringing" | "menu" | "routing" | "connected";

interface Route {
  number: string;
  dept: Dept;
  ext: string;
  stage: Stage;
}

interface Call {
  key: number;
  ext: string;
  dept: Dept;
  /** Second of the board's clock the call was answered at. */
  start: number;
}

const FIRST_ROUTE: Route = { number: NUMBERS[0], dept: "Sales", ext: "Ext. 204", stage: "connected" };
const START_CALLS: Call[] = [
  { key: 0, ext: "Ext. 204", dept: "Sales", start: -12 },
  { key: 1, ext: "Ext. 311", dept: "Support", start: -167 },
  { key: 2, ext: "Ext. 118", dept: "Accounts", start: -252 },
];
/** The board never shows more calls than this. */
const MAX_CALLS = 4;

const BARS = 24;
/** The waveform at rest: a spoken phrase, loudest in the middle. */
const REST = Array.from(
  { length: BARS },
  (_, i) => Math.round((0.25 + 0.6 * Math.abs(Math.sin(i * 0.9)) * Math.sin((i / (BARS - 1)) * Math.PI)) * 1000) / 1000,
);

const OPTION_OFF = {
  backgroundColor: "rgba(255, 255, 255, 0.03)",
  borderColor: "rgba(255, 255, 255, 0.08)",
  color: "#94a3b8",
  boxShadow: "0 0 14px -2px rgba(132, 204, 22, 0)",
};
const OPTION_ON = {
  backgroundColor: "rgba(132, 204, 22, 0.18)",
  borderColor: "rgba(190, 242, 100, 0.6)",
  color: "#ecfccb",
  boxShadow: "0 0 14px -2px rgba(132, 204, 22, 0.5)",
};

const sleep = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));
const mmss = (seconds: number) => {
  const s = Math.max(0, seconds);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};

/** One call on the board; carries `data-leaving` while it ends. */
function CallLine({ call, clock }: { call: Call; clock: number }) {
  const present = useIsPresent();
  return (
    <motion.div
      layout
      data-call=""
      data-leaving={present ? undefined : ""}
      className={styles.call}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45, ease: EASE }}
    >
      <PhoneCall size={12} strokeWidth={2} />
      <span className={styles.callName}>
        {call.ext} · {call.dept}
      </span>
      <span className={styles.callTime}>{mmss(clock - call.start)}</span>
    </motion.div>
  );
}

/**
 * An IP PBX at work: a call comes in, the IVR offers Sales, Support and
 * Accounts, the caller's choice lights up, the call rings an extension and
 * joins the board of active calls, each with its own ticking timer. A new
 * call arrives every 5s; the board keeps four, so the oldest ends. The voice
 * waveform moves while there is someone to hear.
 *
 * First paint is the last call connected and three calls on the board.
 * Nothing moves unless the screen is live.
 */
export function PbxScreen() {
  const rootRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLSpanElement>(null);
  const barRefs = useRef<(HTMLElement | null)[]>([]);
  const clockRef = useRef(0);
  const turn = useRef(1);
  const nextKey = useRef(START_CALLS.length);
  const [route, setRoute] = useState(FIRST_ROUTE);
  const [calls, setCalls] = useState(START_CALLS);
  const [clock, setClock] = useState(0);
  const live = useScreenLive(rootRef);

  // The board's clock: every timer ticks off it.
  useEffect(() => {
    if (!live) return;
    const id = window.setInterval(() => {
      clockRef.current += 1;
      setClock(clockRef.current);
    }, 1000);
    return () => window.clearInterval(id);
  }, [live]);

  // A new call every 5s: ring, menu, extension, connected.
  useEffect(() => {
    const ring = ringRef.current;
    if (!live || !ring) return;
    let cancelled = false;
    const running: AnimationPlaybackControls[] = [];

    (async () => {
      while (!cancelled) {
        await sleep(2400);
        if (cancelled) return;
        const n = turn.current++;
        const dept = OPTIONS[n % OPTIONS.length];
        const ext = DESKS[dept][Math.floor(n / OPTIONS.length) % 2];
        setRoute({ number: NUMBERS[n % NUMBERS.length], dept, ext, stage: "ringing" });
        running.push(animate(ring, { rotate: [0, -14, 14, -10, 10, 0] }, { duration: 0.6 }));
        await sleep(900);
        if (cancelled) return;
        setRoute((r) => ({ ...r, stage: "menu" }));
        await sleep(800);
        if (cancelled) return;
        setRoute((r) => ({ ...r, stage: "routing" }));
        await sleep(900);
        if (cancelled) return;
        setRoute((r) => ({ ...r, stage: "connected" }));
        const key = nextKey.current++;
        const start = clockRef.current;
        setCalls((current) => [{ key, ext, dept, start }, ...current].slice(0, MAX_CALLS));
      }
    })();

    return () => {
      cancelled = true;
      running.forEach((c) => c.stop());
    };
  }, [live]);

  // The voice: every bar springs to a new height every 120ms.
  useEffect(() => {
    if (!live) return;
    const bars = barRefs.current.filter((el): el is HTMLElement => !!el);
    const id = window.setInterval(() => {
      bars.forEach((bar) => {
        animate(bar, { scaleY: 0.15 + Math.random() * 0.85 }, { type: "spring", stiffness: 520, damping: 22 });
      });
    }, 120);
    return () => window.clearInterval(id);
  }, [live]);

  const chosen = route.stage === "ringing" ? null : route.dept;
  const reached = route.stage === "routing" || route.stage === "connected";

  return (
    <div ref={rootRef} data-screen="pbx" className={`${styles.root} ${styles.pbx}`}>
      <div className={styles.flow}>
        <div className={styles.incoming}>
          <span ref={ringRef} className={styles.ringIcon}>
            <PhoneIncoming size={14} strokeWidth={2} />
          </span>
          <span>
            <span className={styles.number}>{route.number}</span>
            <span className={styles.sub}>
              {route.stage === "connected" ? "Answered · Main line" : "Incoming call · Main line"}
            </span>
          </span>
        </div>

        <div className={styles.ivr}>
          <span className={styles.ivrLabel}>IVR</span>
          {OPTIONS.map((option, i) => (
            <motion.span
              key={option}
              className={styles.option}
              initial={false}
              animate={chosen === option ? OPTION_ON : OPTION_OFF}
              transition={{ duration: 0.3 }}
            >
              <b>{i + 1}</b>
              {option}
            </motion.span>
          ))}
        </div>

        <div className={styles.ext}>
          {reached ? (
            <>
              <span>
                {route.ext} · {route.dept}
              </span>
              <span className={styles.extStatus}>{route.stage === "connected" ? "Connected" : "Ringing…"}</span>
            </>
          ) : (
            <span className={styles.extWait}>Routing…</span>
          )}
        </div>

        <div className={styles.wave}>
          {REST.map((h, i) => (
            <i
              key={i}
              ref={(el) => {
                barRefs.current[i] = el;
              }}
              style={{ transform: `scaleY(${h})` }}
            />
          ))}
        </div>
      </div>

      <div className={styles.calls}>
        <div className={styles.callsHead}>
          <span>Active calls</span>
          <span>{calls.length}</span>
        </div>
        <div className={styles.callList}>
          <AnimatePresence mode="popLayout" initial={false}>
            {calls.map((call) => (
              <CallLine key={call.key} call={call} clock={clock} />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
