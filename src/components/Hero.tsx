"use client";

import { useRef, useState, type ComponentType, type RefObject } from "react";
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { BRANDS } from "@/content/brands";
import { useIntroDone } from "@/lib/intro";
import { useLive } from "@/lib/live";
import { useInView, usePageVisible } from "@/lib/visibility";
import { EASE } from "@/lib/motion";
import { BrandBand } from "./BrandBand";
import { Reveal } from "./Reveal";
import { SplitHeadline } from "./SplitHeadline";
import { CityDefs, CityLayer, Stars, useCityLife } from "./hero/RiyadhCity";
import { RiyadhFibres } from "./hero/RiyadhFibres";
import { CloudSky } from "./hero/CloudSky";
import styles from "./Hero.module.css";

/**
 * The accent word always gets a line of its own (the headline keeps line
 * breaks), so the line under it sits centred with nothing beside it, in
 * either language. In Arabic the accent word otherwise shared its line with
 * the end of the phrase, leaving one end of the line in the middle of the
 * text and the light running under the words.
 */
const ownLine = (prefix: string) => prefix.replace(/\s+$/, "") + "\n";

/** What a sky layer is given: the copy (to keep clear of it) and the hero's motion state. */
export interface SkyProps {
  copyRef: RefObject<HTMLDivElement | null>;
  /** The intro has handed over: rise into place. */
  show: boolean;
  /** On screen in a visible tab: loops may run. */
  live: boolean;
  /** Motion held back: everything still. */
  still: boolean;
}

/**
 * The hero: Riyadh at night, and the word "technology" joined to the city by
 * light. Al Faisaliah, Kingdom Centre and the PIF Tower stand along the foot;
 * fibres rise out of the towers on both sides and run through the line under
 * the accent word, which they draw themselves. Above, across the top of the
 * sky, five small clouds carry the signs of the software (the web, data,
 * code), so the city's hardware and the software over it share the one view.
 * Now and then a point of light crosses from one side to the other, through
 * the word.
 *
 * Green, white and black only, as the rest of the site. The brand band no
 * longer sits in the hero: it waits underneath and rises in on scroll.
 *
 * On a portrait screen (phone, tablet) the city is recomposed so the three
 * towers stay in frame at a size that reads, and the fibres climb in narrow
 * lanes beside the text instead of crossing it.
 */
export function Hero({ sky: Sky = CloudSky }: { sky?: ComponentType<SkyProps> } = {}) {
  const { t, dir } = useLanguage();
  const { hero } = t;
  const reduced = useReducedMotion() ?? false;
  const introDone = useIntroDone();
  const sectionRef = useRef<HTMLElement>(null);
  const nearRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const live = useLive(sectionRef);
  useCityLife(sectionRef, live);

  // --- scroll cue ---------------------------------------------------------
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  // Every range runs to 1: Motion hands these to the browser as scroll-driven
  // animations, and a range that stops short (say at 0.12) leaves the last
  // keyframe implicit, so the value climbs back to 1 further down the page.
  const cueOpacity = useTransform(scrollYProgress, [0, 0.12, 1], reduced ? [1, 1, 1] : [1, 0, 0]);
  // The copy and its light fade out as the hero scrolls away, before they can
  // pass under the header's links.
  const fade = useTransform(scrollYProgress, [0, 0.32, 1], reduced ? [1, 1, 1] : [1, 0, 0]);

  // Once faded out, the cue leaves the tab order and stops taking clicks: an
  // invisible link that still takes focus shows no ring at all.
  const [cueGone, setCueGone] = useState(false);
  useMotionValueEvent(cueOpacity, "change", (v) => {
    const gone = v < 0.05;
    setCueGone((prev) => (prev === gone ? prev : gone));
  });
  const cueHidden = cueGone && !reduced;

  // The dot's loop is continuous motion, so it runs only while the hero is on
  // screen in a visible tab.
  const heroOnScreen = useInView(sectionRef);
  const pageVisible = usePageVisible();
  const cueLive = heroOnScreen && pageVisible && !reduced && !cueGone;

  // The city rises into place once the intro has handed over.
  const cityIn = {
    initial: { opacity: 0, y: 36 },
    animate: introDone || reduced ? { opacity: 1, y: 0 } : undefined,
    transition: reduced ? { duration: 0 } : { duration: 1.4, delay: 0.15, ease: EASE },
  };

  return (
    <>
      <section ref={sectionRef} id="top" className={styles.hero} data-live={live || undefined}>
        <CityDefs />
        <Stars className={styles.stars} groupClassName={styles.starGroup} />
        <div className={styles.haze} aria-hidden />

        <motion.div className={`${styles.city} ${styles.cityFar}`} data-reveal="" aria-hidden {...cityIn}>
          <CityLayer layer="far" classNames={{ wide: styles.wide, tall: styles.tall }} />
        </motion.div>

        <motion.div className={styles.fxLayer} style={{ opacity: fade }} aria-hidden>
          <RiyadhFibres
            hostRef={sectionRef}
            nearRef={nearRef}
            copyRef={copyRef}
            subRef={subRef}
            accentSelector={`.${styles.accent}`}
            underlineSelector={`.${styles.underline}`}
            dir={dir}
            play={introDone}
            className={styles.fx}
          />
        </motion.div>

        {/* Software in the sky: a row of small clouds carrying the web, data and code. */}
        <motion.div className={styles.softLayer} style={{ opacity: fade }}>
          <Sky copyRef={copyRef} show={introDone || reduced} live={live} still={reduced} />
        </motion.div>

        <motion.div ref={nearRef} className={`${styles.city} ${styles.cityNear}`} data-reveal="" aria-hidden {...cityIn}>
          <CityLayer layer="near" classNames={{ wide: styles.wide, tall: styles.tall }} />
        </motion.div>

        <motion.div ref={copyRef} className={`shell ${styles.inner}`} style={{ opacity: fade }}>
          <Reveal delay={0.05}>
            <p className={styles.eyebrow}>{hero.eyebrow}</p>
          </Reveal>

          <SplitHeadline
            prefix={ownLine(hero.headlinePrefix)}
            accent={hero.headlineAccent}
            suffix={hero.headlineSuffix}
            dir={dir}
            delay={0.15}
            className={styles.headline}
            accentClassName={styles.accent}
            underlineClassName={styles.underline}
          />

          <Reveal delay={0.45}>
            <p ref={subRef} className={styles.sub} data-hero-sub="">
              {hero.subheading}
            </p>
          </Reveal>
        </motion.div>

        <motion.a
          href="#services"
          className={styles.cue}
          aria-label={hero.scrollCue}
          aria-hidden={cueHidden || undefined}
          tabIndex={cueHidden ? -1 : undefined}
          style={{ opacity: cueOpacity, pointerEvents: cueHidden ? "none" : undefined }}
        >
          <motion.span
            className={styles.cueFrame}
            initial={{ opacity: 0, y: 8 }}
            animate={introDone || reduced ? { opacity: 1, y: 0 } : undefined}
            transition={reduced ? { duration: 0 } : { duration: 0.8, delay: 1.2, ease: EASE }}
          >
            <motion.span
              className={styles.cueDot}
              animate={cueLive ? { y: [0, 12, 0], opacity: [1, 0.2, 1] } : { y: 0, opacity: 1 }}
              transition={
                cueLive
                  ? { duration: 1.8, repeat: Infinity, ease: "easeInOut" }
                  : { duration: reduced ? 0 : 0.3 }
              }
            />
          </motion.span>
        </motion.a>
      </section>

      {/* The brand band: under the hero now, rising in as it scrolls into view. */}
      <Reveal className={styles.bandSlot} y={28}>
        <BrandBand brands={BRANDS} label={hero.brandsLabel} />
      </Reveal>
    </>
  );
}
