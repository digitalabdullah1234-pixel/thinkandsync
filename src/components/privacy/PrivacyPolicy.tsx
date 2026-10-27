"use client";

import { Fragment, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { POLICY, PRIVACY } from "@/content/privacy";
import { EASE } from "@/lib/motion";
import { DarkSection, type GlowSpec } from "../DarkSection";
import styles from "./Privacy.module.css";

const GLOWS: GlowSpec[] = [
  { x: "85%", y: "15%", size: "42rem", color: "emerald" },
  { x: "8%", y: "95%", size: "34rem", color: "teal" },
];

const nn = (i: number) => String(i + 1).padStart(2, "0");

/** A paragraph with the email address in it made a link. */
function Para({ text, email }: { text: string; email: string }) {
  return (
    <p className={styles.p}>
      {text.split(email).map((part, i) => (
        <Fragment key={i}>
          {i > 0 && (
            <a href={`mailto:${email}`} dir="ltr" className={styles.mail}>
              {email}
            </a>
          )}
          {part}
        </Fragment>
      ))}
    </p>
  );
}

/**
 * The privacy policy: the title on the night ground under the header, then
 * the parts numbered down the page, with a contents list held beside them on
 * wide screens that marks the part being read.
 */
export function PrivacyPolicy() {
  const { t, lang } = useLanguage();
  const email = t.contact.info.email;
  const [on, setOn] = useState(POLICY[0].id);

  // The part being read: the last one whose top has passed 40% down the screen (the first one above that).
  useEffect(() => {
    const parts = POLICY.map((p) => document.getElementById(p.id)).filter((el): el is HTMLElement => !!el);
    const pick = () => {
      const line = window.innerHeight * 0.4;
      let current = parts[0]?.id;
      for (const el of parts) if (el.getBoundingClientRect().top <= line) current = el.id;
      if (current) setOn(current);
    };
    pick();
    window.addEventListener("scroll", pick, { passive: true });
    return () => window.removeEventListener("scroll", pick);
  }, []);

  const rise = (delay: number) => ({ initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.9, delay, ease: EASE } });

  return (
    <>
      <DarkSection id="top" glows={GLOWS}>
        <div className={`shell ${styles.hero}`}>
          <motion.h1 className={styles.title} {...rise(0.05)}>
            {PRIVACY.title[lang]}
          </motion.h1>
          <motion.p className={styles.updated} {...rise(0.18)}>
            <span>{PRIVACY.updatedLabel[lang]}</span>
            <i aria-hidden />
            <time dateTime="2026-10-27">{PRIVACY.updated[lang]}</time>
          </motion.p>
          <motion.p className={styles.intro} {...rise(0.28)}>
            {PRIVACY.intro[lang]}
          </motion.p>
        </div>
      </DarkSection>

      <section className={styles.body}>
        <div className={`shell ${styles.grid}`}>
          <nav className={styles.toc} aria-label={PRIVACY.contents[lang]}>
            <span className={styles.tocHead}>{PRIVACY.contents[lang]}</span>
            <ol>
              {POLICY.map((part, i) => (
                <li key={part.id}>
                  <a href={`#${part.id}`} className={styles.tocLink} aria-current={on === part.id ? "location" : undefined}>
                    <span dir="ltr" className={styles.tocN}>
                      {nn(i)}
                    </span>
                    {part.title[lang]}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className={styles.article}>
            {POLICY.map((part, i) => (
              <motion.section key={part.id} id={part.id} className={styles.part} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ duration: 0.7, ease: EASE }}>
                <span dir="ltr" className={styles.n}>
                  {nn(i)}
                </span>
                <div>
                  <h2 className={styles.h2}>{part.title[lang]}</h2>
                  {part.body[lang].map((text) => (
                    <Para key={text} text={text} email={email} />
                  ))}
                </div>
              </motion.section>
            ))}

            <a href={`mailto:${email}`} className={styles.ask}>
              <span className={styles.askTitle}>{PRIVACY.ask.title[lang]}</span>
              <span className={styles.askText}>{PRIVACY.ask.text[lang]}</span>
              <span dir="ltr" className={styles.askMail}>
                {email}
                <ArrowUpRight size={18} strokeWidth={2} aria-hidden />
              </span>
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
