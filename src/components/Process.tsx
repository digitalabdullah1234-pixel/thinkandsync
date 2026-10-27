"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { processHeading, processPhases } from "@/content/process";
import { DarkSection, type GlowSpec } from "./DarkSection";
import { SectionHeading } from "./SectionHeading";
import styles from "./process/Process.module.css";

const GLOWS: GlowSpec[] = [
  { x: "12%", y: "18%", size: "52rem", color: "emerald" },
  { x: "88%", y: "72%", size: "46rem", color: "teal" },
];

const TRACKS = ["software", "hardware"] as const;

/**
 * Our process: the six phases as a column of words, the open one set large
 * with its software step and its hardware step written out.
 *
 * Scrolling drives it. The stage holds still under the header while you
 * scroll through a tall track, and each sixth of the track opens the next
 * phase (scrolling back opens the earlier ones). A word jumps to its phase.
 */
export function Process() {
  const { lang } = useLanguage();
  const track = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: track, offset: ["start start", "end end"] });
  const [on, setOn] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const n = Math.min(processPhases.length - 1, Math.max(0, Math.floor(v * processPhases.length)));
    setOn((x) => (x === n ? x : n));
  });
  const phase = processPhases[on];

  /** Scroll to the middle of a phase's stretch of the track. */
  const go = (i: number) => {
    const el = track.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const share = (i + 0.5) / processPhases.length;
    window.scrollTo({ top: top + (el.offsetHeight - window.innerHeight) * share, behavior: "smooth" });
  };

  return (
    <DarkSection id="process" glows={GLOWS}>
      <div className={`shell ${styles.shell}`}>
        <SectionHeading
          eyebrow={processHeading.eyebrow[lang]}
          title={processHeading.title[lang]}
          accent={processHeading.accent[lang]}
          intro={processHeading.intro[lang]}
          tone="dark"
        />
        <div ref={track} className={styles.track}>
          <div className={styles.stage}>
            <div className={styles.grid}>
              <div className={styles.tabs}>
                {processPhases.map((p, i) => (
                  <button key={p.name.en} type="button" className={styles.tab} aria-current={i === on ? "step" : undefined} onClick={() => go(i)}>
                    {p.name[lang]}
                  </button>
                ))}
              </div>
              <AnimatePresence mode="wait">
                <motion.div key={on} className={styles.open} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
                  <span className={styles.word}>{phase.name[lang]}</span>
                  <div className={styles.steps}>
                    {TRACKS.map((side) => (
                      <div key={side} className={styles.step} data-track={side}>
                        <b className={styles.stepTitle}>{phase[side].title[lang]}</b>
                        <span className={styles.stepText}>{phase[side].text[lang]}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </DarkSection>
  );
}
