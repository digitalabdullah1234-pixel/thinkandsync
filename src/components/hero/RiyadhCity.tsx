"use client";

import { useEffect, type RefObject } from "react";
import { CITY, CITY_DEFS, STARS, type CityLayout } from "./riyadh-city";

const LAYOUTS: CityLayout[] = ["wide", "tall"];

/** The city's gradients and glow, once for the page (both layers point at them). */
export function CityDefs() {
  return (
    <svg
      aria-hidden
      focusable="false"
      width="0"
      height="0"
      style={{ position: "absolute" }}
      dangerouslySetInnerHTML={{ __html: `<defs>${CITY_DEFS}</defs>` }}
    />
  );
}

/**
 * One layer of the city, in both compositions. The stylesheet shows the one
 * that fits the screen (wide on landscape screens, tall on portrait ones), so
 * the right city is there from the first paint, on the server too.
 */
export function CityLayer({ layer, classNames }: { layer: "far" | "near"; classNames: Record<CityLayout, string> }) {
  return (
    <>
      {LAYOUTS.map((name) => (
        <svg
          key={name}
          data-layout={name}
          className={classNames[name]}
          viewBox={CITY[name].viewBox.join(" ")}
          preserveAspectRatio="xMidYMax slice"
          aria-hidden
          focusable="false"
          dangerouslySetInnerHTML={{ __html: CITY[name][layer] }}
        />
      ))}
    </>
  );
}

/** The night sky's stars, in two groups that twinkle out of step: two animations, not seventy. */
export function Stars({ className, groupClassName }: { className: string; groupClassName: string }) {
  return (
    <div className={className} aria-hidden>
      {[0, 1].map((group) => (
        <svg key={group} className={groupClassName} data-group={group} width="100%" height="100%" focusable="false">
          {STARS.filter((_, i) => i % 2 === group).map((s, i) => (
            <circle key={i} cx={`${s.x}%`} cy={`${s.y}%`} r={1} fill={`rgba(233, 255, 246, ${s.o})`} />
          ))}
        </svg>
      ))}
    </div>
  );
}

/**
 * The city's small life: now and then a window goes dark or lights up, and
 * the beacon lights on the three towers blink. On slow timers rather
 * than per-frame work, and only while the hero is live.
 */
export function useCityLife(hostRef: RefObject<HTMLElement | null>, live: boolean) {
  useEffect(() => {
    const host = hostRef.current;
    if (!host || !live) return;
    const windows = Array.from(host.querySelectorAll<SVGElement>("[data-bk]"));
    const beacons = Array.from(host.querySelectorAll<SVGElement>("[data-bc]"));
    let lit = false;
    const blink = window.setInterval(() => {
      const w = windows[Math.floor(Math.random() * windows.length)];
      if (w) w.style.opacity = w.style.opacity ? "" : "0.12";
    }, 700);
    const beacon = window.setInterval(() => {
      lit = !lit;
      for (const b of beacons) b.style.opacity = lit ? "1" : "";
    }, 900);
    return () => {
      window.clearInterval(blink);
      window.clearInterval(beacon);
    };
  }, [hostRef, live]);
}
