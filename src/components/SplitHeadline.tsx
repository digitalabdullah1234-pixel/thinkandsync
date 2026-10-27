"use client";

import { useMemo, useRef } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { useIntroDone } from "@/lib/intro";
import { EASE, SETTLE_GRACE_MS, VIEWPORT, useSettleChildren } from "@/lib/motion";

interface SplitHeadlineProps {
  prefix: string;
  /** Optional highlighted run, drawn with an underline once the words land. */
  accent?: string;
  suffix?: string;
  dir: "ltr" | "rtl";
  as?: "h1" | "h2";
  /**
   * `load` plays as soon as the intro hands over — for the hero, which is on
   * screen from the start. `view` waits for the heading to scroll into view.
   */
  trigger?: "load" | "view";
  className?: string;
  accentClassName?: string;
  underlineClassName?: string;
  /** Seconds before the first word sets off. */
  delay?: number;
}

const WORD_STAGGER = 0.06;
const WORD_DURATION = 0.8;
const UNDERLINE_DURATION = 0.7;

const word: Variants = {
  hidden: { opacity: 0, y: "0.45em", filter: "blur(10px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
};

const underline: Variants = {
  hidden: { scaleX: 0 },
  visible: { scaleX: 1 },
};

/** Splits on whitespace but keeps it, so the line wraps exactly as before. */
const tokens = (text: string) => text.split(/(\s+)/).filter(Boolean);

/**
 * A headline revealed a word at a time: each rises out of a soft blur, then a
 * green rule draws itself under the accent (if there is one) once the line has
 * landed.
 *
 * Words, not letters — Arabic is a connected script, and splitting it any finer
 * would break the joins. The rule draws along the reading direction, so it
 * starts from the right in Arabic.
 *
 * Screen readers get the sentence whole from `aria-label`; the split spans
 * underneath are presentational.
 */
export function SplitHeadline({
  prefix,
  accent = "",
  suffix = "",
  dir,
  as = "h1",
  trigger = "load",
  className,
  accentClassName,
  underlineClassName,
  delay = 0,
}: SplitHeadlineProps) {
  const ref = useRef<HTMLHeadingElement>(null);
  const reduced = useReducedMotion() ?? false;
  const introDone = useIntroDone();
  const armed = introDone && !reduced;

  const parts = useMemo(
    () => ({ prefix: tokens(prefix), accent: tokens(accent), suffix: tokens(suffix) }),
    [prefix, accent, suffix],
  );
  const wordCount = [...parts.prefix, ...parts.accent, ...parts.suffix].filter(
    (t) => t.trim(),
  ).length;
  const underlineDelay = delay + wordCount * WORD_STAGGER + WORD_DURATION * 0.6;

  const container = useMemo<Variants>(
    () => ({
      hidden: {},
      visible: {
        transition: {
          delayChildren: (index: number) =>
            reduced ? 0 : delay + index * WORD_STAGGER,
        },
      },
    }),
    [delay, reduced],
  );

  // The site's rule: a reveal always ends fully visible.
  useSettleChildren(
    ref,
    "[data-word]",
    armed,
    (underlineDelay + UNDERLINE_DURATION) * 1000 + SETTLE_GRACE_MS,
  );

  const transition = reduced
    ? { duration: 0 }
    : { duration: WORD_DURATION, ease: EASE };

  const renderWords = (list: string[], keyPrefix: string) =>
    list.map((token, i) =>
      token.trim() ? (
        <motion.span
          key={`${keyPrefix}${i}`}
          data-word=""
          data-reveal=""
          variants={word}
          transition={transition}
          style={{ display: "inline-block", willChange: "transform, filter" }}
        >
          {token}
        </motion.span>
      ) : (
        token
      ),
    );

  // Reduced motion shows the finished line at once. Otherwise the line waits
  // for the intro, then either plays straight away or on scroll into view.
  const play = reduced || (trigger === "load" && introDone);
  const Tag = as === "h2" ? motion.h2 : motion.h1;

  return (
    <Tag
      ref={ref}
      className={className}
      aria-label={`${prefix}${accent}${suffix}`}
      variants={container}
      initial="hidden"
      animate={play ? "visible" : undefined}
      whileInView={trigger === "view" && armed ? "visible" : undefined}
      viewport={VIEWPORT}
    >
      <span aria-hidden>
        {renderWords(parts.prefix, "p")}
        {accent ? (
          <span className={accentClassName}>
            {renderWords(parts.accent, "a")}
            <motion.span
              className={underlineClassName}
              style={{ originX: dir === "rtl" ? 1 : 0 }}
              // Its own trigger rather than the parent's variants, so the
              // per-word stagger is never added on top of its delay.
              variants={underline}
              initial="hidden"
              animate={play ? "visible" : "hidden"}
              whileInView={trigger === "view" && armed ? "visible" : undefined}
              viewport={VIEWPORT}
              transition={
                reduced
                  ? { duration: 0 }
                  : { duration: UNDERLINE_DURATION, delay: underlineDelay, ease: EASE }
              }
            />
          </span>
        ) : null}
        {renderWords(parts.suffix, "s")}
      </span>
    </Tag>
  );
}
