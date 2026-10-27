"use client";

import { useEffect, useRef, useState, type ReactNode, type Ref } from "react";
import { animate, type AnimationPlaybackControls } from "framer-motion";
import { camStamp, useBootTime } from "./clock";
import { useScreenLive } from "./play";
import styles from "./Screens.module.css";

const MONO = 'ui-monospace, "SFMono-Regular", "Cascadia Mono", Consolas, monospace';

/** The person crosses the lobby from x 26 to 176 (scene units) in 7s. */
const WALK = { from: 26, to: 176, seconds: 7 };
/** The car drives in from off-frame and parks at x 70 over 5.4s, then waits. */
const PARK = { from: 210, to: 70, seconds: 9, arrive: 0.6 };
/** Where both sit in the first paint: mid-corridor, and parked. */
const WALK_START_X = 96;
const PARK_START_SECONDS = 6;

/** An amber detection box with its label tab, as the camera's analytics draw it. */
function Detection({ x, y, w, h, label }: { x: number; y: number; w: number; h: number; label: string }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="none" stroke="#fbbf24" strokeWidth={1.1} />
      <rect x={x} y={y - 7.5} width={label.length * 3.4 + 3} height={7} fill="#fbbf24" />
      <text x={x + 1.5} y={y - 2} fontSize={5.2} fontFamily={MONO} fontWeight={700} fill="#1a1200">
        {label}
      </text>
    </g>
  );
}

function Lobby({ walkerRef, bobRef }: { walkerRef: Ref<SVGGElement>; bobRef: Ref<SVGGElement> }) {
  return (
    <>
      <rect width="200" height="112" fill="#1b1e22" />
      <path d="M0 0 L80 36 L80 72 L0 112 Z" fill="#24282d" />
      <path d="M200 0 L120 36 L120 72 L200 112 Z" fill="#212529" />
      <rect x="80" y="36" width="40" height="36" fill="#30353c" />
      <path d="M0 112 L80 72 L120 72 L200 112 Z" fill="#15171a" />
      <path d="M0 0 L80 36 L120 36 L200 0 Z" fill="#1d2024" />
      <path
        d="M60 112 L90 72 M140 112 L110 72 M100 112 L100 72 M20 112 L84 72 M180 112 L116 72"
        stroke="#1f2226"
        strokeWidth={1}
      />
      <rect x="93" y="46" width="14" height="26" fill="#3b4149" />
      <path d="M18 30 L34 37 L34 92 L18 100 Z" fill="#2b3036" />
      <ellipse cx="100" cy="18" rx="16" ry="3" fill="#fff6dc" opacity={0.75} />
      <ellipse cx="100" cy="42" rx="7" ry="1.5" fill="#fff6dc" opacity={0.55} />
      <circle cx="100" cy="22" r="30" fill="rgb(255 246 220 / 0.05)" />
      <g ref={walkerRef} transform={`translate(${WALK_START_X} 0)`}>
        <g ref={bobRef}>
          <ellipse cx="0" cy="97" rx="8" ry="1.8" fill="rgb(0 0 0 / 0.45)" />
          <path d="M-2.5 96 L-1.5 80 M2.5 96 L1.5 80" stroke="#59616b" strokeWidth={3.2} strokeLinecap="round" />
          <path d="M-6 82 Q-6.5 70 0 69 Q6.5 70 6 82 Z" fill="#747d88" />
          <circle cx="0" cy="64" r="4.4" fill="#9aa3ad" />
          <Detection x={-10} y={57} w={20} h={42} label="PERSON 97%" />
        </g>
      </g>
    </>
  );
}

function Parking({ carRef }: { carRef: Ref<SVGGElement> }) {
  return (
    <>
      <rect width="200" height="112" fill="#0f1215" />
      <path d="M0 26 H40 V14 H70 V26 H120 V8 H150 V26 H200 V44 H0 Z" fill="#171b1f" />
      <rect y="44" width="200" height="68" fill="#1b1e21" />
      <path
        d="M16 112 L52 44 M52 112 L78 44 M88 112 L104 44 M124 112 L130 44 M160 112 L156 44 M196 112 L182 44"
        stroke="#c9b458"
        strokeWidth={1}
        opacity={0.55}
      />
      <path d="M172 44 V18" stroke="#3a4046" strokeWidth={2} />
      <ellipse cx="172" cy="18" rx="7" ry="2" fill="#fff6dc" opacity={0.8} />
      <path d="M165 19 L150 60 L194 60 L179 19 Z" fill="rgb(255 246 220 / 0.05)" />
      <g transform="translate(0 68)">
        <g ref={carRef} transform={`translate(${PARK.to} 0)`}>
          <rect x="0" y="0" width="46" height="17" rx="6" fill="#5f6770" />
          <path d="M8 0 L13 -9 H33 L39 0 Z" fill="#4b525a" />
          <path d="M15 -1 L18 -7 H31 L34 -1 Z" fill="#1d2226" />
          <circle cx="10" cy="17" r="4.4" fill="#111" />
          <circle cx="36" cy="17" r="4.4" fill="#111" />
          <rect x="0" y="4" width="4" height="3" rx="1" fill="#fde68a" />
          <Detection x={-3} y={-12} w={52} h={35} label="VEHICLE 94%" />
        </g>
      </g>
    </>
  );
}

function Entrance() {
  return (
    <>
      <rect width="200" height="112" fill="#15181b" />
      <rect x="40" y="14" width="120" height="78" fill="#23282d" />
      <rect x="52" y="22" width="46" height="70" fill="#2f3a44" />
      <rect x="102" y="22" width="46" height="70" fill="#2c3740" />
      <path
        d="M56 30 L80 22 M60 44 L96 30 M106 30 L130 22 M110 44 L146 30"
        stroke="rgb(255 255 255 / 0.12)"
        strokeWidth={3}
      />
      <rect x="97" y="22" width="6" height="70" fill="#1a1e22" />
      <rect x="162" y="48" width="8" height="14" rx="2" fill="#0d1013" />
      <circle cx="166" cy="58" r="1.4" fill="#ef4444" />
      <rect y="92" width="200" height="20" fill="#101315" />
      <rect x="60" y="94" width="80" height="6" rx="2" fill="#1d2226" />
      <ellipse cx="100" cy="10" rx="30" ry="3" fill="#fff6dc" opacity={0.35} />
    </>
  );
}

const RACK_X = [24, 70, 116, 162];

function ServerRoom() {
  return (
    <>
      <rect width="200" height="112" fill="#101418" />
      <path d="M0 100 L200 100 L200 112 L0 112 Z" fill="#0b0e11" />
      {RACK_X.map((x) => (
        <g key={x}>
          <rect x={x} y="22" width="30" height="76" rx="2" fill="#1c2227" stroke="#2c343c" />
          {Array.from({ length: 9 }, (_, k) => (
            <g key={k}>
              <rect x={x + 4} y={27 + k * 8} width="22" height="5" rx="1" fill="#232a31" />
              <circle cx={x + 23} cy={29.5 + k * 8} r="0.9" fill={k % 3 ? "#34d399" : "#60a5fa"} />
            </g>
          ))}
        </g>
      ))}
      <path d="M0 8 H200" stroke="#2a3138" strokeWidth={3} />
      <path d="M20 8 V14 M100 8 V14 M180 8 V14" stroke="#2a3138" strokeWidth={2} />
    </>
  );
}

/**
 * Four camera feeds with a live clock. A person walks the lobby (7s a
 * crossing) and a car pulls into a bay in the car park (5.4s), each in its
 * detection box. Scanlines and grain are still textures.
 *
 * First paint has the person mid-corridor and the car parked. Everything
 * moves only while the screen is live; each walk picks up where it stopped.
 */
export function CctvScreen() {
  const rootRef = useRef<HTMLDivElement>(null);
  const walkerRef = useRef<SVGGElement>(null);
  const bobRef = useRef<SVGGElement>(null);
  const carRef = useRef<SVGGElement>(null);
  const recRefs = useRef<(HTMLElement | null)[]>([]);
  // Seconds into each loop when it last stopped, so a return resumes it.
  const walkTime = useRef(((WALK_START_X - WALK.from) / (WALK.to - WALK.from)) * WALK.seconds);
  const parkTime = useRef(PARK_START_SECONDS);
  const boot = useBootTime();
  const [now, setNow] = useState<number | null>(null);
  const live = useScreenLive(rootRef);

  useEffect(() => {
    const walker = walkerRef.current;
    const bob = bobRef.current;
    const car = carRef.current;
    const recs = recRefs.current.filter((el): el is HTMLElement => !!el);
    if (!live || !walker || !bob || !car) return;

    const running: AnimationPlaybackControls[] = [];
    const walk = animate(
      walker,
      { x: [WALK.from, WALK.to] },
      { duration: WALK.seconds, ease: "linear", repeat: Infinity },
    );
    walk.time = walkTime.current;
    const park = animate(
      car,
      { x: [PARK.from, PARK.to, PARK.to] },
      { duration: PARK.seconds, times: [0, PARK.arrive, 1], ease: ["easeOut", "linear"], repeat: Infinity },
    );
    park.time = parkTime.current;
    running.push(
      walk,
      park,
      animate(bob, { y: [0, -1.2, 0] }, { duration: WALK.seconds / 14, ease: "easeInOut", repeat: Infinity }),
      animate(recs, { opacity: [1, 0.15] }, { duration: 0.6, repeat: Infinity, repeatType: "reverse" }),
    );

    const clock = window.setInterval(() => setNow(Date.now()), 1000);

    return () => {
      walkTime.current = walk.time % WALK.seconds;
      parkTime.current = park.time % PARK.seconds;
      running.forEach((c) => c.stop());
      window.clearInterval(clock);
    };
  }, [live]);

  const at = now ?? boot;
  const stamp = at === null ? "" : camStamp(new Date(at));

  const feeds: { label: string; scene: ReactNode }[] = [
    { label: "CAM 01 · LOBBY", scene: <Lobby walkerRef={walkerRef} bobRef={bobRef} /> },
    { label: "CAM 04 · PARKING", scene: <Parking carRef={carRef} /> },
    { label: "CAM 07 · ENTRANCE", scene: <Entrance /> },
    { label: "CAM 12 · SERVER ROOM", scene: <ServerRoom /> },
  ];

  return (
    <div ref={rootRef} data-screen="cctv" className={`${styles.root} ${styles.cams}`}>
      {feeds.map((feed, i) => (
        <div key={feed.label} className={styles.feed}>
          <svg viewBox="0 0 200 112" preserveAspectRatio="xMidYMid slice">
            {feed.scene}
          </svg>
          <span className={styles.grain} />
          <span className={styles.camLabel}>{feed.label}</span>
          <span className={styles.rec}>
            <i
              ref={(el) => {
                recRefs.current[i] = el;
              }}
            />
            REC
          </span>
          <span className={styles.stamp}>{stamp}</span>
        </div>
      ))}
    </div>
  );
}
