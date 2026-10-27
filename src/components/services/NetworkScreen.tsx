"use client";

import { useEffect, useId, useRef } from "react";
import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { Cctv, Monitor, Server, Wifi, type LucideIcon } from "lucide-react";
import { useScreenLive } from "./play";
import styles from "./Screens.module.css";

const MONO = 'ui-monospace, "SFMono-Regular", "Cascadia Mono", Consolas, monospace';

type Pt = readonly [number, number];
type Curve = readonly [Pt, Pt, Pt, Pt];

const CORE: Pt = [200, 36];
const SWITCHES: readonly Pt[] = [
  [80, 106],
  [200, 106],
  [320, 106],
];
const ENDPOINTS: readonly { at: Pt; icon: LucideIcon }[] = [
  { at: [44, 178], icon: Cctv },
  { at: [110, 178], icon: Wifi },
  { at: [170, 178], icon: Monitor },
  { at: [230, 178], icon: Server },
  { at: [290, 178], icon: Cctv },
  { at: [356, 178], icon: Wifi },
];

interface Link {
  curve: Curve;
  d: string;
  width: number;
  label?: string;
  labelAt: Pt;
}

/** A cable from a to b: down out of a, across, and down into b. */
function cable(a: Pt, b: Pt, width: number, label?: string): Link {
  const mid = (a[1] + b[1]) / 2;
  return {
    curve: [a, [a[0], mid], [b[0], mid], b],
    d: `M${a[0]} ${a[1]} C${a[0]} ${mid},${b[0]} ${mid},${b[0]} ${b[1]}`,
    width,
    label,
    labelAt: [(a[0] + b[0]) / 2 + (b[0] < a[0] ? -16 : 6), mid + 3],
  };
}

/** 10G uplinks from the core to each access switch, 1G down to the devices. */
const LINKS: Link[] = [
  ...SWITCHES.map((s) => cable(CORE, s, 2.6, "10G")),
  ...ENDPOINTS.map((e, i) => cable(SWITCHES[Math.floor(i / 2)], e.at, 1.6, i % 2 ? undefined : "1G")),
];

/** The point a fraction `t` along a cubic Bezier. */
function pointOn([p0, p1, p2, p3]: Curve, t: number): Pt {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  return [a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]];
}

/** Two packets per cable, one each way, each with its own pace and start. */
const PACKETS = LINKS.flatMap((link, li) =>
  [false, true].map((reverse, p) => ({
    key: `${li}-${p}`,
    link,
    reverse,
    seconds: 1.4 + ((li * 5 + p * 3) % 7) * 0.2,
    phase: (li * 0.37 + p * 0.5) % 1,
  })),
);

interface PacketProps {
  curve: Curve;
  reverse: boolean;
  seconds: number;
  phase: number;
  radius: number;
  glow: string;
  live: boolean;
}

/**
 * A packet riding its cable. Its progress is one motion value; the position
 * is derived from it, so first paint already shows it on the cable, and a
 * restart carries on from wherever it stopped.
 */
function Packet({ curve, reverse, seconds, phase, radius, glow, live }: PacketProps) {
  const t = useMotionValue(phase);
  const cx = useTransform(t, (v) => pointOn(curve, reverse ? 1 - v : v)[0]);
  const cy = useTransform(t, (v) => pointOn(curve, reverse ? 1 - v : v)[1]);

  useEffect(() => {
    if (!live) return;
    const from = t.get();
    const run = animate(t, [0, 1], { duration: seconds, ease: "linear", repeat: Infinity });
    run.time = from * seconds;
    return () => run.stop();
  }, [live, t, seconds]);

  return <motion.circle cx={cx} cy={cy} r={radius} fill="#a5f3fc" filter={glow} />;
}

/**
 * An office network: the core switch, three access switches and six devices
 * (cameras, access points, a desk and a server). Packets run both ways along
 * every cable, and now and then a cable lights up with a burst of traffic.
 *
 * First paint has every packet placed on its cable. Nothing moves unless the
 * screen is live.
 */
export function NetworkScreen() {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const glow = `url(#${uid}-glow)`;
  const rootRef = useRef<HTMLDivElement>(null);
  const spikeRefs = useRef<(SVGPathElement | null)[]>([]);
  const live = useScreenLive(rootRef);

  // A burst on a random cable every 0.8s.
  useEffect(() => {
    if (!live) return;
    const spikes = spikeRefs.current.filter((el): el is SVGPathElement => !!el);
    const id = window.setInterval(() => {
      const spike = spikes[Math.floor(Math.random() * spikes.length)];
      if (spike) animate(spike, { opacity: [0, 0.9, 0] }, { duration: 1.1, ease: "easeInOut" });
    }, 800);
    return () => {
      window.clearInterval(id);
      spikes.forEach((s) => {
        s.style.opacity = "0";
      });
    };
  }, [live]);

  return (
    <div ref={rootRef} data-screen="network" className={`${styles.root} ${styles.net}`}>
      <svg viewBox="0 0 400 216">
        <defs>
          <filter id={`${uid}-glow`} x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur stdDeviation="2.2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {LINKS.map((link, i) => (
          <g key={i}>
            <path d={link.d} fill="none" stroke="rgb(34 211 238 / 0.28)" strokeWidth={link.width} />
            <path
              ref={(el) => {
                spikeRefs.current[i] = el;
              }}
              d={link.d}
              fill="none"
              stroke="#22d3ee"
              strokeWidth={link.width + 2}
              opacity={0}
              filter={glow}
            />
            {link.label ? (
              <text
                x={link.labelAt[0]}
                y={link.labelAt[1]}
                fontFamily={MONO}
                fontSize={8.5}
                fontWeight={600}
                fill="rgb(165 243 252 / 0.7)"
              >
                {link.label}
              </text>
            ) : null}
          </g>
        ))}

        {PACKETS.map((p) => (
          <Packet
            key={p.key}
            curve={p.link.curve}
            reverse={p.reverse}
            seconds={p.seconds}
            phase={p.phase}
            radius={p.link.width > 2 ? 2.6 : 2}
            glow={glow}
            live={live}
          />
        ))}

        <g transform={`translate(${CORE[0]} ${CORE[1]})`}>
          <rect x={-52} y={-13} width={104} height={26} rx={7} fill="#0f172a" stroke="#22d3ee" strokeWidth={1.4} />
          <text x={-40} y={-2} fontFamily={MONO} fontSize={7.5} fontWeight={700} fill="#a5f3fc">
            CORE
          </text>
          {Array.from({ length: 10 }, (_, i) => (
            <circle key={i} cx={-40 + i * 9} cy={5} r={1.4} fill={i % 4 ? "#34d399" : "#fbbf24"} />
          ))}
        </g>

        {SWITCHES.map(([x, y]) => (
          <g key={x} transform={`translate(${x} ${y})`}>
            <rect x={-34} y={-10} width={68} height={20} rx={6} fill="#0f172a" stroke="rgb(34 211 238 / 0.6)" />
            {Array.from({ length: 6 }, (_, j) => (
              <circle key={j} cx={-24 + j * 9.5} cy={0} r={1.3} fill="#34d399" />
            ))}
          </g>
        ))}

        {ENDPOINTS.map(({ at: [x, y], icon: Icon }) => (
          <g key={x} transform={`translate(${x} ${y})`}>
            <circle r={14} fill="#0f172a" stroke="rgb(34 211 238 / 0.45)" />
            <Icon x={-8} y={-8} size={16} color="#a5f3fc" strokeWidth={1.75} />
          </g>
        ))}
      </svg>
    </div>
  );
}
