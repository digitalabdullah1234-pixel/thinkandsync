"use client";

import { useEffect, useRef } from "react";
import { animate, motion, type AnimationPlaybackControls } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import type { Brand } from "@/content/brands";
import { useLive } from "@/lib/live";
import styles from "./BrandBand.module.css";

/** Wider than this (width / height) and the mark is a wordmark: it names itself. */
const WORDMARK_RATIO = 2.2;
/** Hovering a row slows it to this fraction of its speed, so a logo can be read. */
const HOVER_SPEED = 0.15;

/**
 * Brand logos on a paper strip: the first half of the list drifts toward the
 * reading start, the second half the other way.
 */
export function BrandBand({ brands, label }: { brands: Brand[]; label: string }) {
  const half = Math.ceil(brands.length / 2);
  return (
    <div className={styles.band}>
      <span className={styles.label}>{label}</span>
      <div className={styles.rows}>
        <Row brands={brands.slice(0, half)} toward="start" />
        <Row brands={brands.slice(half)} toward="end" />
      </div>
    </div>
  );
}

/**
 * One row. The group is laid out twice and the track moves by exactly one
 * group (50%), so the loop is seamless. It runs only while live, and the
 * direction follows the reading direction.
 */
function Row({ brands, toward }: { brands: Brand[]; toward: "start" | "end" }) {
  const { dir } = useLanguage();
  const viewRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const live = useLive(viewRef);
  const liveRef = useRef(false);
  const controls = useRef<AnimationPlaybackControls | null>(null);

  // Declared first, so on mount `liveRef` is set before the loop is created.
  useEffect(() => {
    liveRef.current = live;
    const c = controls.current;
    if (!c) return;
    if (live) c.play();
    else c.pause();
  }, [live]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    // Toward the reading start: left in English (negative x), right in Arabic.
    const sign = dir === "rtl" ? 1 : -1;
    const keyframes = toward === "start" ? ["0%", `${50 * sign}%`] : [`${50 * sign}%`, "0%"];
    const c = animate(track, { x: keyframes }, { duration: 40 + brands.length, ease: "linear", repeat: Infinity });
    controls.current = c;
    if (!liveRef.current) c.pause();
    return () => {
      c.stop();
      controls.current = null;
    };
  }, [dir, toward, brands.length]);

  const setSpeed = (speed: number) => {
    if (controls.current) controls.current.speed = speed;
  };

  return (
    <div
      ref={viewRef}
      className={styles.view}
      onPointerEnter={() => setSpeed(HOVER_SPEED)}
      onPointerLeave={() => setSpeed(1)}
    >
      <div ref={trackRef} className={styles.track}>
        <Group brands={brands} />
        <Group brands={brands} copy />
      </div>
    </div>
  );
}

function Group({ brands, copy = false }: { brands: Brand[]; copy?: boolean }) {
  return (
    <div className={styles.group} aria-hidden={copy || undefined}>
      {brands.map((brand) => (
        <Logo key={brand.name} brand={brand} />
      ))}
    </div>
  );
}

/** A logo cropped to its own bounds; wordmarks stand alone, symbols get their name. */
function Logo({ brand }: { brand: Brand }) {
  const [x, y, w, h] = brand.box;
  const wordmark = w / h > WORDMARK_RATIO;
  const height = wordmark ? 20 : 25;
  const width = Math.round(((height * w) / h) * 10) / 10;

  return (
    <motion.span
      data-brand=""
      className={styles.brand}
      whileHover={{ y: -3, scale: 1.06 }}
      transition={{ type: "spring", stiffness: 400, damping: 22 }}
    >
      <svg viewBox={`${x} ${y} ${w} ${h}`} width={width} height={height} aria-hidden focusable="false">
        <path d={brand.path} style={{ fill: brand.color ?? "var(--color-ink)" }} />
      </svg>
      {wordmark ? <span className="sr-only">{brand.name}</span> : <span className={styles.name}>{brand.name}</span>}
    </motion.span>
  );
}
