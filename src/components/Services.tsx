"use client";

import { useCallback, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import Image from "next/image";
import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import type { Lang } from "@/lib/translations";
import { serviceCategories, type Service } from "@/content/services";
import { EASE } from "@/lib/motion";
import { Reveal } from "./Reveal";
import { SectionHeading } from "./SectionHeading";
import { ServiceScreen } from "./services/screens";
import styles from "./services/Coverflow.module.css";

/** Cards further than this from the centre fade out. */
const VISIBLE = 4;
/** Cards and their dimming move together, on the site's one curve. */
const MOVE = { duration: 0.7, ease: EASE } as const;
/** A pan this long (px) or this fast (px/s) steps one card. */
const SWIPE_DISTANCE = 40;
const SWIPE_SPEED = 300;
/** Matches the card width in Coverflow.module.css: clamp(17rem, 36vw, 32rem). */
const SIZES = "(width < 47.2rem) 17rem, (width < 88.9rem) 36vw, 32rem";

/** "A, B and C" in English, "أ وب وج" in Arabic. */
function listOf(names: string[], lang: Lang) {
  if (lang === "ar") return names.join(" و");
  return names.length < 2 ? names.join("") : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

/**
 * Where a card stands, `d` places from the one facing you (negative: to the
 * left). Side cards step out by a share of their own width, sink back and turn
 * towards the middle; the further out, the darker.
 */
function place(d: number) {
  if (d === 0) return { x: "0%", z: 60, rotateY: 0, opacity: 1, dim: 0 };
  const side = Math.sign(d);
  const far = Math.abs(d);
  return {
    x: `${side * (62 + (far - 1) * 32)}%`,
    z: -far * 60,
    rotateY: -side * 58,
    opacity: far > VISIBLE ? 0 : 1,
    dim: 1 - Math.max(0.35, 0.8 - far * 0.12),
  };
}

interface CardProps {
  service: Service;
  index: number;
  /** Places from the centre card, already mirrored for Arabic. */
  d: number;
  lang: Lang;
  tabId: string;
  panelId: string;
  onSelect: (index: number) => void;
}

/**
 * One service as a photo standing in the row. Its shadow and its reflection
 * on the floor are part of the card itself, so they travel with it through
 * every move instead of dropping out while it turns.
 */
function Card({ service, index, d, lang, tabId, panelId, onSelect }: CardProps) {
  const p = place(d);
  const far = Math.abs(d);
  const selected = d === 0;
  const photo = service.media?.kind === "image" ? service.media : null;
  const loading = far <= 2 ? "eager" : "lazy";

  return (
    <motion.button
      type="button"
      role="tab"
      id={tabId}
      aria-selected={selected}
      aria-controls={panelId}
      aria-label={service.title[lang]}
      tabIndex={selected ? 0 : -1}
      className={styles.card}
      style={{ zIndex: 20 - far, pointerEvents: far > VISIBLE ? "none" : undefined }}
      initial={false}
      animate={{ x: p.x, z: p.z, rotateY: p.rotateY, opacity: p.opacity }}
      whileHover={selected ? undefined : { y: -6, transition: { duration: 0.25, ease: EASE } }}
      transition={MOVE}
      onClick={() => onSelect(index)}
    >
      <span className={styles.frame}>
        {photo ? (
          <Image src={photo.src} alt="" fill sizes={SIZES} loading={loading} className={styles.photo} draggable={false} />
        ) : (
          <ServiceScreen media={service.media} icon={service.icon} />
        )}
        <motion.span className={styles.dim} initial={false} animate={{ opacity: p.dim }} transition={MOVE} />
      </span>
      {photo ? (
        <span className={styles.reflection} aria-hidden>
          <Image src={photo.src} alt="" fill sizes={SIZES} loading={loading} className={styles.photo} draggable={false} />
          <motion.span className={styles.dim} initial={false} animate={{ opacity: p.dim }} transition={MOVE} />
        </span>
      ) : null}
    </motion.button>
  );
}

/**
 * What we do: the services as photos standing in a row in 3D, the chosen
 * one facing you and the rest turned away on either side, each with a soft
 * reflection on the floor. Pressing a side card, swiping, or the arrow keys
 * bring a card to the front; its name, line and points sit just beneath.
 * Reads the services list the admin keeps, grouped by category.
 */
export function Services({ list: all }: { list: Service[] }) {
  const { t, lang, dir } = useLanguage();
  const { services } = t;
  const rtl = dir === "rtl";
  const list = useMemo(() => serviceCategories(all).flatMap((c) => c.services), [all]);
  const [cur, setCur] = useState(() => Math.floor((list.length - 1) / 2));
  const panned = useRef(false);
  const uid = useId();
  const tabId = (id: string) => `${uid}-tab-${id}`;
  const panelId = `${uid}-panel`;
  const active = list[Math.min(cur, list.length - 1)];

  const go = useCallback((i: number) => setCur(Math.max(0, Math.min(list.length - 1, i))), [list.length]);

  // A swipe that ends over a side card must not also count as pressing it.
  const select = (i: number) => {
    if (panned.current) return;
    go(i);
  };

  const onPanEnd = (_: PointerEvent, info: PanInfo) => {
    window.setTimeout(() => (panned.current = false), 0);
    const { x: dx } = info.offset;
    if (Math.abs(dx) < SWIPE_DISTANCE && Math.abs(info.velocity.x) < SWIPE_SPEED) return;
    // Swiping towards the start of the line brings the next card in.
    const forward = dx < 0 !== rtl;
    go(cur + (forward ? 1 : -1));
  };

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const next = rtl ? "ArrowLeft" : "ArrowRight";
    const prev = rtl ? "ArrowRight" : "ArrowLeft";
    let to: number;
    if (e.key === next) to = cur + 1;
    else if (e.key === prev) to = cur - 1;
    else if (e.key === "Home") to = 0;
    else if (e.key === "End") to = list.length - 1;
    else return;
    e.preventDefault();
    const i = Math.max(0, Math.min(list.length - 1, to));
    go(i);
    document.getElementById(tabId(list[i].id))?.focus({ preventScroll: true });
  };

  if (!active) return null;

  return (
    <section id="services" className={styles.section}>
      <div className={styles.backdrop} aria-hidden>
        <div className="grain" />
      </div>
      <div className="shell">
        <SectionHeading
          tone="dark"
          eyebrow={services.eyebrow}
          title={services.title}
          accent={services.titleAccent}
          intro={`${services.introLead} ${listOf(list.map((s) => s.title[lang]), lang)}.`}
          className="max-w-3xl"
        />

        <Reveal className={styles.body} delay={0.1}>
          <motion.div
            role="tablist"
            aria-label={services.eyebrow}
            className={styles.stage}
            dir="ltr"
            onKeyDown={onKey}
            onPanStart={() => (panned.current = true)}
            onPanEnd={onPanEnd}
          >
            {list.map((service, i) => (
              <Card
                key={service.id}
                service={service}
                index={i}
                d={rtl ? cur - i : i - cur}
                lang={lang}
                tabId={tabId(service.id)}
                panelId={panelId}
                onSelect={select}
              />
            ))}
          </motion.div>

          <div id={panelId} role="tabpanel" aria-labelledby={tabId(active.id)} aria-live="polite" className={styles.words}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={active.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } }}
                exit={{ opacity: 0, y: -6, transition: { duration: 0.16 } }}
              >
                <h3 className={styles.title}>{active.title[lang]}</h3>
                <p className={styles.line}>{active.description[lang]}</p>
                <ul className={styles.points}>
                  {active.points[lang].map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </motion.div>
            </AnimatePresence>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
