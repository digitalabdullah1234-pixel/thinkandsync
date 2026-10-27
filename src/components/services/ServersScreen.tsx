"use client";

import { useEffect, useRef } from "react";
import { animate, motion, useMotionValue, useTransform, type MotionValue } from "framer-motion";
import { useScreenLive } from "./play";
import styles from "./Screens.module.css";

const UNITS = [22, 56, 90, 124];
const BAYS = 5;
const SPRING = { type: "spring", stiffness: 140, damping: 16 } as const;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const drift = (v: number, step: number, lo: number, hi: number) => clamp(v + (Math.random() * 2 - 1) * step, lo, hi);

/** A rack of four servers, each with five drive bays and two status lights. */
function Rack() {
  return (
    <svg className={styles.rack} viewBox="0 0 112 188">
      <rect x="3" y="3" width="106" height="182" rx="8" fill="#232b34" stroke="#44505c" />
      <rect x="10" y="10" width="92" height="7" rx="2" fill="#131920" />
      {UNITS.map((y, s) => (
        <g key={y}>
          <rect x="9" y={y} width="94" height="30" rx="3" fill="#3a4550" />
          {Array.from({ length: BAYS }, (_, b) => (
            <g key={b}>
              <rect x={16 + b * 13} y={y + 5} width="10" height="20" rx="1.5" fill="#1b2229" />
              <circle data-led="" cx={21 + b * 13} cy={y + 9} r="1.2" fill={(b + s) % 3 ? "#34d399" : "#60a5fa"} />
            </g>
          ))}
          <circle cx="92" cy={y + 9} r="2.4" fill="#34d399" />
          <circle data-led="" cx="92" cy={y + 19} r="1.8" fill="#60a5fa" />
        </g>
      ))}
      <rect x="9" y="158" width="94" height="20" rx="3" fill="#2d3640" />
      {Array.from({ length: 12 }, (_, i) => (
        <rect key={i} x={14 + i * 7.3} y="164" width="4.6" height="6" rx="0.8" fill="#0c1116" />
      ))}
    </svg>
  );
}

function Metric({
  label,
  text,
  fill,
  cool = false,
}: {
  label: string;
  text: MotionValue<string>;
  fill: MotionValue<number>;
  cool?: boolean;
}) {
  return (
    <div className={styles.metric}>
      <div className={styles.metricTop}>
        <span>{label}</span>
        <motion.b>{text}</motion.b>
      </div>
      <div className={styles.bar}>
        <motion.i className={cool ? styles.cool : undefined} style={{ scaleX: fill }} />
      </div>
    </div>
  );
}

/**
 * A server rack and its health: drive lights flicker as the disks work, and
 * CPU, memory, storage and inlet temperature spring to new readings every
 * 1.6s, each wandering inside a believable band.
 *
 * First paint is a settled reading. Nothing moves unless the screen is live.
 */
export function ServersScreen() {
  const rootRef = useRef<HTMLDivElement>(null);
  const cpu = useMotionValue(38);
  const memory = useMotionValue(61);
  const storage = useMotionValue(72);
  const temp = useMotionValue(23.8);
  const cpuText = useTransform(cpu, (v) => `${Math.round(v)}%`);
  const memoryText = useTransform(memory, (v) => `${Math.round(v)}%`);
  const storageText = useTransform(storage, (v) => `${Math.round(v)}%`);
  const tempText = useTransform(temp, (v) => `${v.toFixed(1)}°C`);
  const cpuFill = useTransform(cpu, (v) => v / 100);
  const memoryFill = useTransform(memory, (v) => v / 100);
  const storageFill = useTransform(storage, (v) => v / 100);
  // 18–30°C across the bar.
  const tempFill = useTransform(temp, (v) => (v - 18) / 12);
  const live = useScreenLive(rootRef);

  // New readings every 1.6s.
  useEffect(() => {
    if (!live) return;
    const id = window.setInterval(() => {
      animate(cpu, drift(cpu.get(), 9, 18, 78), SPRING);
      animate(memory, drift(memory.get(), 3, 52, 74), SPRING);
      animate(storage, drift(storage.get(), 0.6, 70, 76), SPRING);
      animate(temp, drift(temp.get(), 0.4, 22.6, 25.2), SPRING);
    }, 1600);
    return () => {
      window.clearInterval(id);
      [cpu, memory, storage, temp].forEach((v) => v.stop());
    };
  }, [live, cpu, memory, storage, temp]);

  // Drive lights: a couple blink off for a moment every tick.
  useEffect(() => {
    const root = rootRef.current;
    if (!live || !root) return;
    const leds = [...root.querySelectorAll<SVGCircleElement>("[data-led]")];
    const id = window.setInterval(() => {
      for (let k = 0; k < 2; k++) {
        const led = leds[Math.floor(Math.random() * leds.length)];
        if (led) animate(led, { opacity: [1, 0.15, 1] }, { duration: 0.16 });
      }
    }, 110);
    return () => window.clearInterval(id);
  }, [live]);

  return (
    <div ref={rootRef} data-screen="servers" className={`${styles.root} ${styles.servers}`}>
      <Rack />
      <div>
        <Metric label="CPU" text={cpuText} fill={cpuFill} />
        <Metric label="Memory" text={memoryText} fill={memoryFill} />
        <Metric label="Storage" text={storageText} fill={storageFill} />
        <Metric label="Inlet temp" text={tempText} fill={tempFill} cool />
        <div className={styles.healthy}>
          <i />
          All systems normal
        </div>
      </div>
    </div>
  );
}
