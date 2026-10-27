"use client";

import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useTransform } from "framer-motion";
import { ArrowLeft, ArrowRight, ArrowUpRight, Pause, Play, Video, X } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import type { Project } from "@/content/projects";
import type { Media, VideoMedia } from "@/content/types";
import type { Lang } from "@/lib/translations";
import { EASE, press } from "@/lib/motion";
import { useFinePointer } from "@/lib/media";
import { useHydrated, useReduceMotion } from "@/lib/use-reduce-motion";
import styles from "./MoreWork.module.css";

const two = (n: number) => String(n).padStart(2, "0");
const MORPH = { duration: 0.55, ease: EASE } as const;
/** Matches the card width in MoreWork.module.css. */
const CARD_SIZES = "(width < 40rem) 72vw, 24rem";
const OPEN_SIZES = "(width < 56rem) 100vw, 60vw";

/** A project's still: its photo, or the poster of its film. */
const still = (m: Media) => (m.kind === "video" ? m.poster : m.src);

/**
 * The projects that are not in the scroll story, in one row that slides
 * sideways (swipe, trackpad, or the arrows). A card opens its project in a
 * window: the picture grows out of the card into it, the film plays, and the
 * arrows step through the rest. Numbers carry on from the story's.
 */
export function MoreWork({ list, start }: { list: Project[]; start: number }) {
  const { t, dir } = useLanguage();
  const { more } = t.projects;
  const rtl = dir === "rtl";
  const row = useRef<HTMLDivElement>(null);
  const { scrollXProgress } = useScroll({ container: row });
  // Arabic scrolls the other way (scrollLeft runs negative): the bar fills from the right.
  const fill = useTransform(scrollXProgress, (p) => Math.min(1, Math.abs(p)));
  const [ends, setEnds] = useState({ first: true, last: list.length < 2 });
  const [open, setOpen] = useState<number | null>(null);
  const opener = useRef<HTMLButtonElement | null>(null);

  useMotionValueEvent(fill, "change", (p) => setEnds({ first: p < 0.01, last: p > 0.99 }));

  /** One card's width along, in the reading direction. */
  const step = (by: number) => {
    const el = row.current;
    const card = el?.querySelector("button");
    if (!el || !card) return;
    el.scrollBy({ left: by * (card.getBoundingClientRect().width + 16) * (rtl ? -1 : 1), behavior: "smooth" });
  };

  const show = (i: number) => {
    setOpen(i);
    // Keep the card under the window in view, so the picture grows from it and shrinks back to it.
    row.current?.querySelectorAll("button")[i]?.scrollIntoView({ block: "nearest", inline: "nearest" });
  };

  const close = () => {
    setOpen(null);
    opener.current?.focus({ preventScroll: true });
  };

  return (
    <div className={styles.more}>
      <div className={`shell ${styles.head}`}>
        <h3 className={styles.title}>
          {more.title}
          <span dir="ltr">{two(list.length)}</span>
        </h3>
        {list.length > 1 && (
          <div className={styles.arrows}>
            <motion.button type="button" aria-label={more.prev} disabled={ends.first} onClick={() => step(-1)} {...press}>
              {rtl ? <ArrowRight size={18} aria-hidden /> : <ArrowLeft size={18} aria-hidden />}
            </motion.button>
            <motion.button type="button" aria-label={more.next} disabled={ends.last} onClick={() => step(1)} {...press}>
              {rtl ? <ArrowLeft size={18} aria-hidden /> : <ArrowRight size={18} aria-hidden />}
            </motion.button>
          </div>
        )}
      </div>

      <motion.div ref={row} className={styles.row} layoutScroll>
        {list.map((project, i) => (
          <Card
            key={project.id}
            project={project}
            number={start + i + 1}
            label={more.open}
            onOpen={(el) => {
              opener.current = el;
              show(i);
            }}
          />
        ))}
      </motion.div>

      <div className="shell">
        <div className={styles.bar} aria-hidden>
          <motion.i style={{ scaleX: fill, transformOrigin: rtl ? "100% 50%" : "0% 50%" }} />
        </div>
      </div>

      <Window list={list} start={start} index={open} onStep={show} onClose={close} />
    </div>
  );
}

/** One project in the row. Under a mouse, its film plays while hovered. */
function Card({ project, number, label, onOpen }: { project: Project; number: number; label: string; onOpen: (el: HTMLButtonElement) => void }) {
  const { lang, dir } = useLanguage();
  const fine = useFinePointer();
  const reduced = useReduceMotion();
  const media = project.media[0];
  const film = media?.kind === "video" ? media : null;
  const [hot, setHot] = useState(false);

  return (
    <motion.button
      type="button"
      className={styles.card}
      aria-label={`${label}: ${project.title[lang]}`}
      onClick={(e) => onOpen(e.currentTarget)}
      onHoverStart={() => setHot(true)}
      onHoverEnd={() => setHot(false)}
      onFocus={(e) => e.currentTarget.matches(":focus-visible") && setHot(true)}
      onBlur={() => setHot(false)}
      initial="rest"
      animate={hot ? "hover" : "rest"}
    >
      <motion.span layoutId={reduced ? undefined : `work-${project.id}`} className={styles.pic} transition={MORPH} style={{ borderRadius: 18 }}>
        <motion.span className={styles.zoom} variants={{ rest: { scale: 1 }, hover: { scale: 1.06 } }} transition={{ duration: 0.7, ease: EASE }}>
          {media && <Image src={still(media)} alt="" fill sizes={CARD_SIZES} className={styles.img} draggable={false} />}
          {film && fine && hot && <video className={styles.img} src={film.src} poster={film.poster} muted loop playsInline autoPlay aria-hidden />}
        </motion.span>
        <span className={styles.chip} dir="ltr">
          {two(number)}
          {film && <Video size={13} strokeWidth={2} aria-hidden />}
        </span>
      </motion.span>
      <span className={styles.meta}>
        <span className={styles.name}>
          {project.title[lang]}
          <motion.span className={styles.go} variants={{ rest: { x: 0, y: 0 }, hover: { x: dir === "rtl" ? -3 : 3, y: -3 } }} transition={{ duration: 0.35, ease: EASE }}>
            <ArrowUpRight size={18} strokeWidth={2} aria-hidden style={dir === "rtl" ? { transform: "scaleX(-1)" } : undefined} />
          </motion.span>
        </span>
      </span>
    </motion.button>
  );
}

interface WindowProps {
  list: Project[];
  start: number;
  index: number | null;
  onStep: (i: number) => void;
  onClose: () => void;
}

/** The window a project opens in. Escape, the cross or the dark around it closes it; the arrows (and arrow keys) step. */
function Window({ list, start, index, onStep, onClose }: WindowProps) {
  const { t, lang, dir } = useLanguage();
  const { projects } = t;
  const reduced = useReduceMotion();
  const panel = useRef<HTMLDivElement>(null);
  const shut = useRef<HTMLButtonElement>(null);
  const mounted = useHydrated();
  const project = index === null ? null : list[index];
  const isOpen = index !== null;

  // While open: the page behind stays still, and the cross takes the keyboard.
  useEffect(() => {
    if (!isOpen) return;
    const html = document.documentElement;
    const before = html.style.overflow;
    html.style.overflow = "hidden";
    shut.current?.focus({ preventScroll: true });
    return () => {
      html.style.overflow = before;
    };
  }, [isOpen]);

  const go = (by: number) => {
    if (index === null || list.length < 2) return;
    onStep((index + by + list.length) % list.length);
  };

  const onKey = (e: ReactKeyboardEvent) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      onClose();
    } else if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      go((e.key === "ArrowRight") === (dir === "ltr") ? 1 : -1);
    } else if (e.key === "Tab") {
      // Keep Tab inside the window.
      const items = panel.current?.querySelectorAll<HTMLElement>("button, a[href]");
      if (!items?.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  if (!mounted) return null;
  const media = project?.media[0];
  // Only a web address opens as the project's link (never javascript: or the like).
  const link = project?.link && /^https?:\/\//i.test(project.link) ? project.link : undefined;
  const cta = link ? projects.ctaView : projects.ctaSimilar;

  return createPortal(
    <AnimatePresence>
      {project && (
        <motion.div
          key="window"
          className={styles.backdrop}
          dir={dir}
          lang={lang}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.3, delay: 0.1 } }}
          transition={{ duration: 0.35 }}
          onClick={(e) => e.target === e.currentTarget && onClose()}
          onKeyDown={onKey}
        >
          <div ref={panel} role="dialog" aria-modal="true" aria-labelledby="work-window-title" className={styles.panel}>
            <motion.div layoutId={reduced ? undefined : `work-${project.id}`} className={styles.screen} transition={MORPH} style={{ borderRadius: 18 }}>
              {media?.kind === "video" ? (
                <Film key={media.src} media={media} lang={lang} labels={projects} />
              ) : media ? (
                <Image src={media.src} alt={media.alt[lang]} fill sizes={OPEN_SIZES} className={styles.img} />
              ) : null}
            </motion.div>

            <motion.div
              key={project.id}
              className={styles.words}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.15, ease: EASE } }}
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
            >
              <span className={styles.category}>
                <i aria-hidden />
                <b dir="ltr">{two(start + (index ?? 0) + 1)}</b>
              </span>
              <h3 id="work-window-title" className={styles.big}>
                {project.title[lang]}
              </h3>
              <p className={styles.text}>{project.description[lang]}</p>
              <ul className={styles.tags}>
                {project.tags[lang].map((tag) => (
                  <li key={tag}>{tag}</li>
                ))}
              </ul>
              <a
                href={link ?? "#contact"}
                className={styles.cta}
                onClick={link ? undefined : onClose}
                {...(link ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              >
                {cta}
                <ArrowUpRight size={16} strokeWidth={2} aria-hidden style={dir === "rtl" ? { transform: "scaleX(-1)" } : undefined} />
              </a>
            </motion.div>

            <div className={styles.controls}>
              {list.length > 1 && (
                <>
                  <motion.button type="button" aria-label={t.projects.more.prev} onClick={() => go(-1)} {...press}>
                    {dir === "rtl" ? <ArrowRight size={18} aria-hidden /> : <ArrowLeft size={18} aria-hidden />}
                  </motion.button>
                  <span dir="ltr">
                    {two((index ?? 0) + 1)} / {two(list.length)}
                  </span>
                  <motion.button type="button" aria-label={t.projects.more.next} onClick={() => go(1)} {...press}>
                    {dir === "rtl" ? <ArrowLeft size={18} aria-hidden /> : <ArrowRight size={18} aria-hidden />}
                  </motion.button>
                </>
              )}
              <motion.button ref={shut} type="button" className={styles.shut} aria-label={t.projects.more.close} onClick={onClose} {...press}>
                <X size={18} aria-hidden />
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/** The open project's film: it plays (muted, looping) until the visitor pauses it. */
function Film({ media, lang, labels }: { media: VideoMedia; lang: Lang; labels: { playLabel: string; pauseLabel: string } }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (paused) video.pause();
    else video.play().catch(() => {});
  }, [paused]);

  return (
    <>
      <video ref={ref} className={styles.img} src={media.src} poster={media.poster} muted loop playsInline aria-label={media.alt[lang]} />
      <motion.button type="button" className={styles.pause} aria-pressed={paused} aria-label={paused ? labels.playLabel : labels.pauseLabel} onClick={() => setPaused((v) => !v)} {...press}>
        {paused ? <Play size={16} aria-hidden /> : <Pause size={16} aria-hidden />}
      </motion.button>
    </>
  );
}
