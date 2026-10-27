"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Clapperboard, ConciergeBell, Newspaper, Trophy, type LucideIcon } from "lucide-react";
import { EASE } from "@/lib/motion";
import { useScreenLive } from "./play";
import styles from "./Screens.module.css";

interface Channel {
  name: string;
  icon: LucideIcon;
  /** The picture's colours: a gradient from the first to the second. */
  tint: readonly [string, string];
  /** Programme titles and their relative lengths on the guide. */
  shows: readonly (readonly [string, number])[];
  /** Which programme is on now (under the "now" line). */
  now: number;
  /** How far into that programme we are. */
  progress: number;
}

const CHANNELS: readonly Channel[] = [
  {
    name: "SPORT HD",
    icon: Trophy,
    tint: ["#15803d", "#0f766e"],
    shows: [
      ["Preview", 0.8],
      ["Derby · Live", 1.4],
      ["Recap", 0.8],
    ],
    now: 1,
    progress: 0.62,
  },
  {
    name: "NEWS 24",
    icon: Newspaper,
    tint: ["#1d4ed8", "#4338ca"],
    shows: [
      ["Headlines", 1.1],
      ["Markets", 0.9],
      ["Weather", 1],
    ],
    now: 1,
    progress: 0.35,
  },
  {
    name: "CINEMA",
    icon: Clapperboard,
    tint: ["#a21caf", "#6d28d9"],
    shows: [
      ["Desert Light", 1.6],
      ["Late show", 1.4],
    ],
    now: 0,
    progress: 0.78,
  },
  {
    name: "HOTEL INFO",
    icon: ConciergeBell,
    tint: ["#b45309", "#c2410c"],
    shows: [
      ["Welcome", 0.9],
      ["Dining", 1.1],
      ["Events", 1],
    ],
    now: 1,
    progress: 0.44,
  },
];

const ROOMS = ["Lobby", "Room 204", "Café"];
const TIMES = ["20:00", "20:30", "21:00"];
/** The "now" line, as a fraction of the programme area: clear of the 20:30 label. */
const NOW_AT = 0.5;
const SWITCH_MS = 4000;
const FADE = { duration: 0.6, ease: EASE } as const;

/** One picture per channel, stacked; only the selected one is opaque. */
function Pictures({ selected, withIcon }: { selected: number; withIcon: boolean }) {
  return (
    <>
      {CHANNELS.map((channel, i) => {
        const Icon = channel.icon;
        return (
          <motion.span
            key={channel.name}
            className={styles.layer}
            style={{ background: `linear-gradient(135deg, ${channel.tint[0]}, ${channel.tint[1]})` }}
            initial={false}
            animate={{ opacity: i === selected ? 1 : 0 }}
            transition={FADE}
          >
            {withIcon ? <Icon className={styles.layerIcon} size={40} strokeWidth={1.25} /> : null}
          </motion.span>
        );
      })}
    </>
  );
}

/**
 * A hotel's IPTV head-end: the programme guide (four channels, three slots
 * and the "now" line), the channel on air with its progress, and three room
 * screens showing it. Every 4s the selection steps to the next channel and
 * the room screens all switch with it.
 *
 * First paint is the first channel selected. Nothing moves unless the
 * screen is live.
 */
export function IptvScreen() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState(0);
  const live = useScreenLive(rootRef);

  useEffect(() => {
    if (!live) return;
    const next = () => setSelected((s) => (s + 1) % CHANNELS.length);
    // The first switch comes almost at once, so the card answers as it starts playing.
    const first = window.setTimeout(next, 350);
    const id = window.setInterval(next, SWITCH_MS);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
    };
  }, [live]);

  const channel = CHANNELS[selected];

  return (
    <div ref={rootRef} data-screen="iptv" className={`${styles.root} ${styles.iptv}`}>
      <div className={styles.epg} style={{ "--now": NOW_AT } as CSSProperties}>
        <div className={styles.epgHead}>
          <span>GUIDE</span>
          <span className={styles.epgTimes}>
            {TIMES.map((t) => (
              <span key={t}>{t}</span>
            ))}
          </span>
        </div>
        {CHANNELS.map((c, i) => (
          <div key={c.name} className={styles.channel}>
            <motion.span
              className={styles.channelOn}
              initial={false}
              animate={{ opacity: i === selected ? 1 : 0 }}
              transition={FADE}
            />
            <span className={styles.chLogo}>{c.name}</span>
            <span
              className={styles.programs}
              style={{ gridTemplateColumns: c.shows.map(([, w]) => `minmax(0, ${w}fr)`).join(" ") }}
            >
              {c.shows.map(([title], k) => (
                <span key={title} className={k === c.now ? `${styles.program} ${styles.programNow}` : styles.program}>
                  <span>{title}</span>
                </span>
              ))}
            </span>
          </div>
        ))}
        <span className={styles.nowLine}>
          <i>NOW</i>
        </span>
      </div>

      <div className={styles.tv}>
        <div className={styles.picture}>
          <Pictures selected={selected} withIcon />
          <span className={styles.onAir}>
            <i />
            LIVE
          </span>
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={channel.name}
              className={styles.caption}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.3, ease: EASE }}
            >
              <small>{channel.name}</small>
              {channel.shows[channel.now][0]}
            </motion.span>
          </AnimatePresence>
          <span className={styles.progress}>
            <motion.i initial={false} animate={{ scaleX: channel.progress }} transition={{ type: "spring", stiffness: 120, damping: 20 }} />
          </span>
        </div>
        <div className={styles.thumbs}>
          {ROOMS.map((room) => (
            <span key={room} className={styles.thumb}>
              <span className={styles.thumbScreen}>
                <Pictures selected={selected} withIcon={false} />
              </span>
              <small>{room}</small>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
