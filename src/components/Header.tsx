"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useIntroDone } from "@/lib/intro";
import { EASE, lift, nudge, press } from "@/lib/motion";
import { Logo } from "./Logo";
import { HeaderEdgeLight } from "./HeaderEdgeLight";
import styles from "./Header.module.css";

const NAV_ITEMS: {
  key: "services" | "projects" | "contact";
  href: string;
}[] = [
  { key: "services", href: "#services" },
  { key: "projects", href: "#projects" },
  { key: "contact", href: "#contact" },
];

/* ------------------------------------------------------------- load-in -- */

/*
 * The bar assembles itself once, when the intro overlay hands over.
 *
 * It is a real sequence rather than three things fading at once: the logo
 * lands first, the CTA arrives from the right edge a beat later, and only then
 * do the links drop in one at a time. Every value below is a delay in seconds,
 * kept together so the timeline can be read top to bottom.
 *
 *   0.00  logo, opacity only
 *   0.18  right cluster slides in from off the right edge
 *   0.42  first link drops
 *   0.72  last link drops, everything settled by ~1.05s
 *
 * Nothing here animates anything but `transform` and `opacity`, so the whole
 * sequence is handed to the compositor and never touches layout.
 */

const ACTIONS_DELAY = 0.18;
const NAV_DELAY = 0.42;
/** Slow enough to read as one-after-another, quick enough not to drag. */
const NAV_STAGGER = 0.1;

/**
 * The links drop from above and bounce.
 *
 * Damping ratio here is about 0.5 (damping / 2*sqrt(stiffness*mass)), which
 * lands roughly a 17% overshoot — on 18px of travel that is a ~3px dip past
 * the line and back. Enough to read unmistakably as a bounce; far short of the
 * wobble that makes a nav bar look like a toy. Settles in about a third of a
 * second.
 */
const NAV_SPRING = {
  type: "spring",
  stiffness: 420,
  damping: 17,
  mass: 0.7,
} as const;

/**
 * The right cluster. Same idea, tuned much tighter — a damping ratio near 0.73
 * gives a single soft overshoot of a few pixels at the end of a 72px slide,
 * which reads as weight settling rather than as a bounce.
 */
const ACTIONS_SPRING = {
  type: "spring",
  stiffness: 300,
  damping: 24,
  mass: 0.9,
} as const;

/** Far enough to clear the viewport edge and read as arriving from off-screen.
    The bar is `position: fixed`, so a child overhanging the right edge adds
    nothing to the document's scrollable area and cannot cause a scrollbar. */
const ACTIONS_TRAVEL = 72;
/** The drop height. Small: these are 14px links, not posters. */
const NAV_TRAVEL = 18;

/*
 * The logo fades, and does not slide, and that is not a stylistic choice.
 *
 * The intro's dot wordmark flies to this exact box and dissolves over it in
 * HANDOFF_MS (240ms, see Preloader) — the logo's "slide in" is already
 * performed, by the intro, before this ever runs. Giving it a second one would
 * put the real logo somewhere the dots are not and show the same wordmark
 * twice, in two places, for the whole crossfade. The 200ms fade is matched to
 * that dissolve so the two cross cleanly.
 */
const LOGO_TRANSITION = { duration: 0.2, ease: "easeOut" } as const;

/** Opacity is deliberately a short tween rather than part of the spring: the
    element should be fully visible while it is still travelling, so what you
    see is a solid link dropping in, not a shape fading as it moves. */
const FADE_IN = { duration: 0.18, ease: "easeOut" } as const;

const NAV_HIDDEN = { opacity: 0, y: -NAV_TRAVEL } as const;
const NAV_SHOWN = { opacity: 1, y: 0 } as const;

const ACTIONS_HIDDEN = { opacity: 0, x: ACTIONS_TRAVEL } as const;
const ACTIONS_SHOWN = { opacity: 1, x: 0 } as const;

/** Everything lands instantly, with no motion, for anyone who asked for that. */
const STILL = { duration: 0 } as const;

export function Header() {
  const { t, lang, dir, toggleLang } = useLanguage();
  // Off the home page the section links lead back to it.
  const home = usePathname() === "/";
  const at = (hash: string) => (home ? hash : `/${hash}`);
  const introDone = useIntroDone();
  const reduced = useReducedMotion() ?? false;
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const barRef = useRef<HTMLElement>(null);

  /**
   * The header is white-on-transparent while it sits over the dark hero film,
   * and flips to its solid light treatment once the hero is behind it.
   *
   * It observes the HERO ITSELF, not a marker at its bottom edge. A zero-height
   * sentinel is never intersecting on either side of a large jump — an anchor
   * link, restored scroll, End key — so the observer sees no change and never
   * fires, which left a white-on-transparent header stranded over a white
   * section. A full-height element is unambiguously intersecting on one side
   * and not on the other, so every jump reports.
   *
   * The root is inset from the top by the header's own height, so the flip
   * lands exactly as the hero's bottom edge slides under the bar.
   *
   * The initial `false` is what the server renders and what is correct at the
   * top of the page, so hydration matches and there is no flash.
   */
  useEffect(() => {
    const hero = document.querySelector("#top");
    const bar = barRef.current;
    if (!hero || !bar) return;

    const observer = new IntersectionObserver(
      ([entry]) => setScrolled(!entry.isIntersecting),
      {
        rootMargin: `-${Math.round(bar.offsetHeight)}px 0px 0px 0px`,
        threshold: 0,
      },
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  /*
   * The two treatments are driven by one flag, not two. They used to disagree:
   * the surface went solid on `scrolled || menuOpen`, but the text only went
   * dark on `scrolled` — so opening the menu at the top of the page put white
   * links on a white bar. One source of truth for both.
   */
  const solid = scrolled || menuOpen;
  /** The entrance target. `introDone` latches true and never goes back, so
      this plays exactly once per page load. */
  const entered = introDone;

  const quote = (
    <>
      <span>{t.nav.quote}</span>
      <ArrowUpRight className={styles.arrow} size={16} strokeWidth={2} />
    </>
  );

  return (
    <header
      ref={barRef}
      className={solid ? styles.bar : `${styles.bar} ${styles.overHero}`}
    >
      <div className={styles.row}>
        {/* The notched HUD silhouette. Painted in both states — only its two
            colours change, via CSS. */}
        <div className={styles.surface} aria-hidden />
        {/* Over the hero, where the surface is off: its edge and a travelling star. */}
        <HeaderEdgeLight visible={!solid} />

        <div className={`shell ${styles.inner}`}>
          <Link href={home ? "#top" : "/"} className={styles.brand} aria-label="ThinkSync">
            {/*
             * Opacity only, and deliberately so. The intro's wordmark flies to
             * this exact box and crossfades into it, so a transform here would
             * put the real logo somewhere the dots are not and show the same
             * logo twice, in two places, for the length of the handoff.
             */}
            <motion.span
              data-header-logo=""
              data-nav-in=""
              className="inline-flex"
              initial={{ opacity: 0 }}
              animate={{ opacity: entered ? 1 : 0 }}
              transition={reduced ? STILL : LOGO_TRANSITION}
            >
              <Logo
                variant={solid ? "dark" : "white"}
                className="h-[clamp(1.75rem,2.2vw,2.25rem)] w-auto"
              />
            </motion.span>
          </Link>

          <nav className={styles.nav}>
            {NAV_ITEMS.map((item, index) => (
              <motion.a
                key={item.key}
                href={at(item.href)}
                data-nav-in=""
                className={styles.link}
                style={
                  {
                    "--origin": dir === "rtl" ? "right" : "left",
                  } as React.CSSProperties
                }
                initial={NAV_HIDDEN}
                animate={entered ? NAV_SHOWN : undefined}
                transition={
                  reduced
                    ? STILL
                    : {
                        // Per-property, so the drop bounces while the fade
                        // stays a clean short ramp. Sharing one spring would
                        // make opacity overshoot too and flicker at the top.
                        y: {
                          ...NAV_SPRING,
                          delay: NAV_DELAY + index * NAV_STAGGER,
                        },
                        opacity: {
                          ...FADE_IN,
                          delay: NAV_DELAY + index * NAV_STAGGER,
                        },
                      }
                }
              >
                {t.nav[item.key]}
              </motion.a>
            ))}
          </nav>

          <motion.div
            className={styles.actions}
            data-nav-in=""
            initial={ACTIONS_HIDDEN}
            animate={entered ? ACTIONS_SHOWN : undefined}
            transition={
              reduced
                ? STILL
                : {
                    x: { ...ACTIONS_SPRING, delay: ACTIONS_DELAY },
                    opacity: { ...FADE_IN, delay: ACTIONS_DELAY },
                  }
            }
          >
            <motion.button
              type="button"
              onClick={toggleLang}
              className={styles.lang}
              aria-label="Toggle language"
              {...lift}
            >
              <span lang="en" className={lang === "en" ? styles.on : undefined}>EN</span>
              <span lang="ar" className={lang === "ar" ? styles.on : undefined}>العربية</span>
            </motion.button>

            <motion.a href={at("#contact")} className={styles.quote} {...lift}>
              {quote}
            </motion.a>
          </motion.div>

          <motion.button
            type="button"
            className={styles.burger}
            data-nav-in=""
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            initial={ACTIONS_HIDDEN}
            /* The entrance carries its own timing inside the target, so the
               hover/press transition that `press` supplies is left intact. */
            animate={
              entered
                ? {
                    ...ACTIONS_SHOWN,
                    transition: reduced
                      ? STILL
                      : {
                          x: { ...ACTIONS_SPRING, delay: ACTIONS_DELAY },
                          opacity: { ...FADE_IN, delay: ACTIONS_DELAY },
                        },
                  }
                : undefined
            }
            {...press}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className={styles.panel}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={reduced ? STILL : { duration: 0.28, ease: EASE }}
          >
            <div className={`shell ${styles.panelInner}`}>
              {NAV_ITEMS.map((item) => (
                <motion.a
                  key={item.key}
                  href={at(item.href)}
                  onClick={() => setMenuOpen(false)}
                  className={styles.panelLink}
                  {...nudge(dir, 6)}
                >
                  {t.nav[item.key]}
                </motion.a>
              ))}

              <div className={styles.panelFoot}>
                <motion.button
                  type="button"
                  onClick={toggleLang}
                  className={styles.lang}
                  {...lift}
                >
                  <span lang="en" className={lang === "en" ? styles.on : undefined}>EN</span>
                  <span lang="ar" className={lang === "ar" ? styles.on : undefined}>
                    العربية
                  </span>
                </motion.button>

                <motion.a
                  href={at("#contact")}
                  onClick={() => setMenuOpen(false)}
                  className={styles.quote}
                  {...lift}
                >
                  {quote}
                </motion.a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
