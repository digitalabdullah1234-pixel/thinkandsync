"use client";

import { motion, type Variants } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import type { WhyHeading, WhyIcon, WhyPoint } from "@/content/why";
import { EASE } from "@/lib/motion";
import { SectionHeading } from "./SectionHeading";
import styles from "./why/WhyUs.module.css";

// Line icons (24 × 24, Lucide's shapes): paths and circles [cx, cy, r].
const ICONS: Record<WhyIcon, { d: string[]; c?: [number, number, number][] }> = {
  team: { d: ["M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", "M22 21v-2a4 4 0 0 0-3-3.87", "M16 3.13a4 4 0 0 1 0 7.75"], c: [[9, 7, 4]] },
  link: { d: ["M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71", "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"] },
  shield: { d: ["M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z", "m9 12 2 2 4-4"] },
  support: { d: ["m4.93 4.93 4.24 4.24", "m14.83 9.17 4.24-4.24", "m14.83 14.83 4.24 4.24", "m9.17 14.83-4.24 4.24"], c: [[12, 12, 10], [12, 12, 4]] },
  language: { d: ["m5 8 6 6", "m4 14 6-6 2-3", "M2 5h12", "M7 2h1", "m22 22-5-10-5 10", "M14 18h6"] },
  ai: { d: ["M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2Z", "M19 3v4", "M21 5h-4"] },
  group: { d: ["M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z", "M10 6h4", "M10 10h4", "M10 14h4", "M10 18h4"] },
};

// Each point rises in after the one before it, and its icon draws itself.
const point: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.75, delay: i * 0.12, ease: EASE } }),
};
const line: Variants = {
  hidden: { pathLength: 0 },
  show: (i: number) => ({ pathLength: 1, transition: { duration: 0.9, delay: 0.3 + i * 0.12, ease: EASE } }),
};

/** Why us: the admin's reasons (four fill the grid best). Hidden when there are none. */
export function WhyUs({ heading, points }: { heading: WhyHeading; points: WhyPoint[] }) {
  const { lang } = useLanguage();
  if (!points.length) return null;
  return (
    <section id="why" className={styles.section}>
      <div className="shell">
        <SectionHeading title={heading.title[lang]} accent={heading.accent[lang] || undefined} tone="light" />
        <motion.ol className={styles.grid} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }}>
          {points.map((p, i) => {
            const icon = ICONS[p.icon];
            return (
              <motion.li key={p.id} className={styles.point} variants={point} custom={i}>
                <div className={styles.top}>
                  <span className={styles.badge}>
                    <svg viewBox="0 0 24 24" aria-hidden>
                      {icon.d.map((d) => (
                        <motion.path key={d} d={d} variants={line} custom={i} />
                      ))}
                      {icon.c?.map(([cx, cy, r]) => (
                        <motion.circle key={`${cx}-${cy}-${r}`} cx={cx} cy={cy} r={r} variants={line} custom={i} />
                      ))}
                    </svg>
                  </span>
                  <span className={styles.n} dir="ltr">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className={styles.title}>{p.title[lang]}</h3>
                <p className={styles.text}>{p.text[lang]}</p>
              </motion.li>
            );
          })}
        </motion.ol>
      </div>
    </section>
  );
}
