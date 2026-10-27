"use client";

import { useLanguage } from "@/context/LanguageContext";
import { Reveal } from "./Reveal";
import { SplitHeadline } from "./SplitHeadline";
import styles from "./SectionHeading.module.css";

interface SectionHeadingProps {
  /** The small label above the headline. Missing: no label. */
  eyebrow?: string;
  title: string;
  /** Substring of `title` to draw in green. Missing or unmatched: no accent. */
  accent?: string;
  intro?: string;
  /** "green": on the brand-green ground of the services section. */
  tone: "dark" | "light" | "green";
  className?: string;
}

/**
 * Eyebrow, headline and intro for a section, set at the hero's scale.
 *
 * The headline is split around `accent` and handed to SplitHeadline, so it
 * reveals word by word on scroll-in and draws its rule under the accent.
 */
export function SectionHeading({
  eyebrow,
  title,
  accent,
  intro,
  tone,
  className,
}: SectionHeadingProps) {
  const { dir } = useLanguage();
  const at = accent ? title.indexOf(accent) : -1;
  const [prefix, hit, suffix] =
    at < 0 || !accent
      ? [title, "", ""]
      : [title.slice(0, at), accent, title.slice(at + accent.length)];

  return (
    <div className={`${styles[tone]} ${className ?? ""}`}>
      {eyebrow ? (
        <Reveal>
          <span className={styles.eyebrow}>{eyebrow}</span>
        </Reveal>
      ) : null}
      <SplitHeadline
        // Re-keyed per title, so a language switch mounts a fresh reveal
        // instead of leaving the old words' animation state in place.
        key={title}
        as="h2"
        trigger="view"
        prefix={prefix}
        accent={hit}
        suffix={suffix}
        dir={dir}
        delay={0.08}
        className={styles.title}
        accentClassName={styles.accent}
        underlineClassName={styles.underline}
      />
      {intro ? (
        <Reveal delay={0.3}>
          <p className={styles.intro}>{intro}</p>
        </Reveal>
      ) : null}
    </div>
  );
}
