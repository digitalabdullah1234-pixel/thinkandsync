"use client";

import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  animate,
  motion,
  useIsPresent,
  useMotionValue,
  type AnimationPlaybackControls,
} from "framer-motion";
import { Check } from "lucide-react";
import { EASE } from "@/lib/motion";
import { useScreenLive } from "./play";
import styles from "./Screens.module.css";

const STAGES = ["Commit", "Build", "Test", "Scan", "Deploy"] as const;

type Kind = "cmd" | "plain" | "ok" | "hl";
const KIND_CLASS: Record<Kind, string | undefined> = {
  cmd: styles.termCmd,
  plain: undefined,
  ok: styles.termOk,
  hl: styles.termHl,
};

interface Line {
  key: number;
  kind: Kind;
  text: string;
}

/** The last run, finished: what the terminal shows before anything moves. */
const FIRST_LINES: Line[] = [
  { key: 0, kind: "cmd", text: "$ git push origin main  (4f2a91c)" },
  { key: 1, kind: "plain", text: "▸ Building container image… 39s" },
  { key: 2, kind: "ok", text: "✓ 212 tests passed" },
  { key: 3, kind: "ok", text: "✓ Security scan: 0 critical issues" },
  { key: 4, kind: "hl", text: "✓ Deployed v2.8.0 · zero downtime" },
];
/** The terminal never holds more lines than this. */
const MAX_LINES = 6;

/** What each stage of a run prints when it finishes. */
const runLog = (version: string, sha: string): readonly (readonly [Kind, string])[] => [
  ["cmd", `$ git push origin main  (${sha})`],
  ["plain", "▸ Building container image… 41s"],
  ["ok", "✓ 214 tests passed"],
  ["ok", "✓ Security scan: 0 critical issues"],
  ["hl", `✓ Deployed ${version} · zero downtime`],
];

const sleep = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

/** One line of output; carries `data-leaving` while it scrolls away. */
function TermLine({ line }: { line: Line }) {
  const present = useIsPresent();
  return (
    <motion.div
      layout
      data-log-line=""
      data-leaving={present ? undefined : ""}
      className={KIND_CLASS[line.kind]}
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: EASE }}
    >
      {line.text}
    </motion.div>
  );
}

/**
 * A delivery pipeline: Commit, Build, Test, Scan, Deploy. Each run clears
 * the stages, fills the line from one to the next, ticks each stage off with
 * a spring and prints its result; the release number goes up each time. The
 * terminal keeps the last six lines.
 *
 * First paint is the last run (v2.8.0), done. Runs happen only while the
 * screen is live.
 */
export function CloudScreen() {
  const rootRef = useRef<HTMLDivElement>(null);
  const release = useRef(1);
  const nextKey = useRef(FIRST_LINES.length);
  const fill = useMotionValue(1);
  const [done, setDone] = useState<number>(STAGES.length);
  const [running, setRunning] = useState(-1);
  const [lines, setLines] = useState(FIRST_LINES);
  const live = useScreenLive(rootRef);

  useEffect(() => {
    if (!live) return;
    let cancelled = false;
    const active: AnimationPlaybackControls[] = [];
    const track = (c: AnimationPlaybackControls) => {
      active.push(c);
      return c;
    };

    (async () => {
      // A short beat, then the first run: the card answers as it starts playing.
      await sleep(200);
      while (!cancelled) {
        await sleep(600);
        if (cancelled) return;
        setDone(0);
        setRunning(-1);
        track(animate(fill, 0, { duration: 0.3 }));
        const version = `v2.8.${release.current++}`;
        const sha = Math.random().toString(16).slice(2, 9).padEnd(7, "0");
        const log = runLog(version, sha);

        for (let i = 0; i < STAGES.length; i++) {
          setRunning(i);
          await track(animate(fill, i / (STAGES.length - 1), { duration: i ? 0.8 : 0.2, ease: EASE }));
          if (cancelled) return;
          await sleep(i === 1 ? 700 : 350);
          if (cancelled) return;
          setRunning(-1);
          setDone(i + 1);
          const key = nextKey.current++;
          const [kind, text] = log[i];
          setLines((current) => [...current, { key, kind, text }].slice(-MAX_LINES));
        }
        active.length = 0;
        await sleep(2200);
      }
    })();

    return () => {
      cancelled = true;
      active.forEach((c) => c.stop());
    };
  }, [live, fill]);

  return (
    <div ref={rootRef} data-screen="cloud" className={`${styles.root} ${styles.cloud}`}>
      <div className={styles.pipe}>
        <span className={styles.pipeLine}>
          <motion.i style={{ scaleX: fill }} />
        </span>
        {STAGES.map((stage, i) => {
          const isDone = i < done;
          return (
            <div key={stage} className={isDone ? `${styles.node} ${styles.nodeDone}` : styles.node}>
              <span className={styles.nodeDot}>
                <motion.span
                  className={styles.nodeRing}
                  initial={false}
                  animate={{ opacity: running === i ? 1 : 0 }}
                  transition={{ duration: 0.25 }}
                />
                <motion.span
                  className={styles.nodeFill}
                  initial={false}
                  animate={{ opacity: isDone ? 1 : 0 }}
                  transition={{ duration: 0.3 }}
                />
                <motion.span
                  className={styles.nodeTick}
                  initial={false}
                  animate={isDone ? { scale: 1, opacity: 1 } : { scale: 0.6, opacity: 0 }}
                  transition={isDone ? { type: "spring", stiffness: 420, damping: 14 } : { duration: 0.2 }}
                >
                  <Check size={15} strokeWidth={3} />
                </motion.span>
              </span>
              {stage}
            </div>
          );
        })}
      </div>

      <div className={styles.term}>
        <AnimatePresence mode="popLayout" initial={false}>
          {lines.map((line) => (
            <TermLine key={line.key} line={line} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
