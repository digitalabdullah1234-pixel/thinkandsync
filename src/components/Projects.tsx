"use client";

import { useEffect, useRef, useState, type CSSProperties, type FocusEvent } from "react";
import Image from "next/image";
import {
  motion,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { ArrowUpRight, Pause, Play } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { splitWork, type Project } from "@/content/projects";
import type { Media } from "@/content/types";
import type { Lang } from "@/lib/translations";
import { EASE, nudge, press } from "@/lib/motion";
import { useLive } from "@/lib/live";
import { useReduceMotion } from "@/lib/use-reduce-motion";
import { Reveal } from "./Reveal";
import { SectionHeading } from "./SectionHeading";
import { MoreWork } from "./projects/MoreWork";
import styles from "./projects/Projects.module.css";

/** Smooths the page's scroll into the columns' travel, so a wheel's steps glide. */
const GLIDE = { stiffness: 140, damping: 30, mass: 0.35 } as const;
/** Matches the picture column: the whole width on phones, a little over half beside the stories. */
const SIZES = "(width < 54rem) 100vw, 53vw";

const two = (n: number) => String(n).padStart(2, "0");

/**
 * Our work: a pinned split screen. One half is a column of full-height
 * project pictures that rises as the visitor scrolls; the other is the column
 * of their stories, which sinks the opposite way, so each picture meets its
 * story in the middle and they pass each other on the way. A hairline seam
 * between the halves fills with green and carries the project number.
 *
 * Reads the projects list the admin keeps (each project's first media item is its cover: a
 * photo, or a film that plays only while it is the one in view). Only the
 * featured few play in the split screen, so it never grows past a few screens;
 * the rest follow in the "More work" row. With no projects, an empty state
 * stands in. Phones split top and bottom.
 */
export function Projects({ list }: { list: Project[] }) {
  const { t } = useLanguage();
  const { projects } = t;
  const { story, more } = splitWork(list);

  return (
    <section id="projects" className={styles.section}>
      <div className={`shell ${styles.head}`}>
        <SectionHeading
          tone="light"
          eyebrow={projects.eyebrow}
          title={projects.title}
          accent={projects.titleAccent}
          intro={projects.intro}
          className="max-w-3xl"
        />
      </div>
      {list.length ? (
        <>
          <Showcase list={story} />
          {more.length > 0 && <MoreWork list={more} start={story.length} />}
        </>
      ) : (
        <div className="shell">
          <Reveal delay={0.15} className={styles.empty}>
            <p className={styles.emptyTitle}>{projects.empty.title}</p>
            <p className={styles.emptyText}>{projects.empty.text}</p>
            <a href="#contact" className={styles.cta}>
              {projects.empty.cta}
              <ArrowUpRight size={16} strokeWidth={2} aria-hidden />
            </a>
          </Reveal>
        </div>
      )}
    </section>
  );
}

/** The pinned split screen itself. */
function Showcase({ list }: { list: Project[] }) {
  const { t, lang, dir } = useLanguage();
  const { projects } = t;
  const n = list.length;
  const reduced = useReduceMotion();
  const trackRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: trackRef, offset: ["start start", "end end"] });
  const progress = useSpring(scrollYProgress, GLIDE);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  // Each column is n screens tall; over the pinned scroll it travels n - 1 of
  // them. The pictures rise from the first; the stories, stacked bottom-up,
  // sink from the last.
  const span = ((n - 1) * 100) / n;
  const rise = useTransform(progress, (p) => `${-p * span}%`);
  const sink = useTransform(progress, (p) => `${(p - 1) * span}%`);

  useMotionValueEvent(progress, "change", (p) => setIndex(Math.round(p * (n - 1))));

  /**
   * Keyboard focus landing in a story that is not on screen scrolls the page
   * to the point where that story sits in the middle, so focus is never lost
   * behind the stage.
   */
  const reveal = (i: number) => (e: FocusEvent<HTMLElement>) => {
    const track = trackRef.current;
    if (!track || reduced || !(e.target as HTMLElement).matches(":focus-visible")) return;
    const top = track.getBoundingClientRect().top + window.scrollY;
    const travel = track.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + (n > 1 ? (i / (n - 1)) * travel : 0), behavior: "smooth" });
  };

  return (
    <div ref={trackRef} className={styles.track} style={{ "--n": n } as CSSProperties}>
      <div className={styles.stage}>
        <div className={styles.pictures}>
          <motion.div className={styles.strip} style={reduced ? undefined : { y: rise }}>
            {list.map((project, i) => (
              <Shot
                key={project.id}
                project={project}
                index={i}
                count={n}
                progress={progress}
                active={i === index}
                paused={paused}
                lang={lang}
              />
            ))}
          </motion.div>
          {list.some((p) => p.media[0]?.kind === "video") ? (
            <motion.button
              type="button"
              className={styles.pause}
              aria-pressed={paused}
              aria-label={paused ? projects.playLabel : projects.pauseLabel}
              onClick={() => setPaused((v) => !v)}
              {...press}
            >
              {paused ? <Play size={16} strokeWidth={2} aria-hidden /> : <Pause size={16} strokeWidth={2.2} aria-hidden />}
            </motion.button>
          ) : null}
        </div>

        <div className={styles.stories}>
          <motion.div className={`${styles.strip} ${styles.sink}`} style={reduced ? undefined : { y: sink }}>
            {list.map((project, i) => (
              <Story
                key={project.id}
                project={project}
                index={i}
                count={n}
                progress={progress}
                active={i === index}
                lang={lang}
                dir={dir}
                cta={project.link ? projects.ctaView : projects.ctaSimilar}
                onFocus={reveal(i)}
              />
            ))}
          </motion.div>
        </div>

        <div className={styles.seam} aria-hidden>
          <motion.i style={{ "--p": progress } as unknown as CSSProperties} />
          <b dir="ltr">
            <span>{two(index + 1)}</span> / {two(n)}
          </b>
        </div>
      </div>
    </div>
  );
}

/** How far item `i` is from the middle of the stage, in screens (0 when centred). */
function useDistance(progress: MotionValue<number>, i: number, count: number) {
  return useTransform(progress, (p) => Math.min(1, Math.abs(p * (count - 1) - i)));
}

interface ShotProps {
  project: Project;
  index: number;
  count: number;
  progress: MotionValue<number>;
  active: boolean;
  paused: boolean;
  lang: Lang;
}

/** One full-height picture in the rising column: it settles to full size and light as it reaches the middle. */
function Shot({ project, index, count, progress, active, paused, lang }: ShotProps) {
  const media = project.media[0];
  const far = useDistance(progress, index, count);
  const scale = useTransform(far, [0, 1], [1, 1.12]);
  const shade = useTransform(far, [0, 1], [0, 0.5]);
  if (!media) return <div className={styles.shot} style={{ gridRow: index + 1 }} />;

  return (
    <figure className={styles.shot} style={{ gridRow: index + 1 }}>
      <motion.div className={styles.frame} style={{ scale }}>
        <Cover media={media} active={active} paused={paused} lang={lang} eager={index === 0} />
      </motion.div>
      <motion.span className={styles.shade} style={{ opacity: shade }} aria-hidden />
    </figure>
  );
}

interface CoverProps {
  media: Media;
  active: boolean;
  paused: boolean;
  lang: Lang;
  eager: boolean;
}

function Cover({ media, active, paused, lang, eager }: CoverProps) {
  if (media.kind === "image") {
    return (
      <Image
        src={media.src}
        alt={media.alt[lang]}
        fill
        sizes={SIZES}
        loading={eager ? "eager" : "lazy"}
        className={styles.media}
        draggable={false}
      />
    );
  }
  return <Film media={media} active={active} paused={paused} lang={lang} />;
}

/**
 * A project film. It loads nothing until it is first wanted, then plays only
 * while it is the picture in the middle, the section is on screen and the tab
 * is in front, and the visitor hasn't paused it.
 */
function Film({ media, active, paused, lang }: Omit<CoverProps, "eager"> & { media: Extract<Media, { kind: "video" }> }) {
  const ref = useRef<HTMLVideoElement>(null);
  const live = useLive(ref);
  const play = live && active && !paused;

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (play) video.play().catch(() => {});
    else video.pause();
  }, [play]);

  return (
    <video
      ref={ref}
      className={styles.media}
      src={media.src}
      poster={media.poster}
      muted
      loop
      playsInline
      preload="none"
      disablePictureInPicture
      aria-label={media.alt[lang]}
    />
  );
}

interface StoryProps {
  project: Project;
  index: number;
  count: number;
  progress: MotionValue<number>;
  active: boolean;
  lang: Lang;
  dir: "ltr" | "rtl";
  cta: string;
  onFocus: (e: FocusEvent<HTMLElement>) => void;
}

/** One project's story in the sinking column; it comes up to full strength as it meets its picture. */
function Story({ project, index, count, progress, active, lang, dir, cta, onFocus }: StoryProps) {
  const far = useDistance(progress, index, count);
  const opacity = useTransform(far, [0, 1], [1, 0.28]);
  const href = project.link ?? "#contact";
  const external = !!project.link;

  return (
    <motion.article className={styles.story} style={{ gridRow: index + 1, opacity }} onFocus={onFocus}>
      <motion.span
        className={styles.number}
        aria-hidden
        initial={false}
        animate={{ color: active ? "rgba(16, 152, 90, 1)" : "rgba(16, 152, 90, 0)" }}
        transition={{ duration: 0.6, ease: EASE }}
      >
        {two(index + 1)}
      </motion.span>
      <h3 className={styles.name}>{project.title[lang]}</h3>
      <p className={styles.description}>{project.description[lang]}</p>
      <ul className={styles.tags}>
        {project.tags[lang].map((tag) => (
          <li key={tag}>{tag}</li>
        ))}
      </ul>
      <motion.a
        href={href}
        className={styles.cta}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        {...nudge(dir, 3)}
      >
        {cta}
        <ArrowUpRight size={16} strokeWidth={2} aria-hidden />
      </motion.a>
    </motion.article>
  );
}
