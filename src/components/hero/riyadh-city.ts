/*
 * Riyadh at night, as SVG markup: Al Faisaliah (the pyramid with the golden
 * globe), Kingdom Centre (the arch and the sky bridge) and the PIF Tower at
 * KAFD, with mid-rise blocks around them and lit windows.
 *
 * Two compositions of the same buildings:
 *   wide  the skyline as it was designed, 1440 wide: Al Faisaliah on the left,
 *         Kingdom Centre and the PIF Tower on the right, low in the middle.
 *   tall  the same three landmarks closer together, for portrait screens
 *         (phones, tablets): on a phone the middle 640 units fill the width,
 *         so all three stay in frame at a size that reads.
 *
 * Everything comes from a seeded random sequence, so the server and the client
 * build exactly the same markup (no hydration mismatch), and the wide city has
 * the same towers and the same lit windows as the approved design.
 *
 * Only the site's colours: near-black towers with green edges, white and mint
 * windows. The globe on Al Faisaliah keeps its gold, as the real one.
 */

/** The seeded sequence the mockups used (a 32-bit LCG). */
export function seeded(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
}

export type CityLayout = "wide" | "tall";

export interface City {
  /** viewBox of both layers. */
  viewBox: [number, number, number, number];
  /** The far blocks and the fog (behind the fibres). */
  far: string;
  /** The landmarks and the near blocks (in front of the fibres). */
  near: string;
  /** Points the fibres can rise from, in viewBox units: tower tops and roofs. */
  anchors: [number, number][];
}

const GROUND = 500;
const C = {
  rim: "#5fe3b1",
  edge: "#7fe9c1",
  warm: "#f3fff9",
  cool: "#bff6e2",
  beacon: "#e9fff6",
};

/** Gradients and the glow filter, shared by every layer (ids are page-wide). */
export const CITY_DEFS =
  '<linearGradient id="rc-bld" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1a16"/><stop offset="1" stop-color="#050c0a"/></linearGradient>' +
  '<linearGradient id="rc-bld2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#081310"/><stop offset="1" stop-color="#030806"/></linearGradient>' +
  '<linearGradient id="rc-rim" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#5fe3b1" stop-opacity=".55"/><stop offset=".08" stop-color="#5fe3b1" stop-opacity="0"/></linearGradient>' +
  '<radialGradient id="rc-gold"><stop offset="0" stop-color="#ffe7a3"/><stop offset=".6" stop-color="#f5b942"/><stop offset="1" stop-color="#a86d12"/></radialGradient>' +
  '<linearGradient id="rc-fog" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0f3a2e" stop-opacity="0"/><stop offset="1" stop-color="#0f3a2e" stop-opacity=".55"/></linearGradient>' +
  '<filter id="rc-glow"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>';

type Block = [x: number, w: number, h: number, crown?: "flat" | "slant" | "step"];

interface Plan {
  width: number;
  far: Block[];
  near: Block[];
  /** Centre lines of the three landmarks. */
  faisaliah: number;
  kingdom: number;
  pif: number;
}

const PLANS: Record<CityLayout, Plan> = {
  wide: {
    width: 1440,
    far: [[20, 60, 150], [90, 50, 120], [150, 70, 180], [300, 60, 140], [520, 55, 110], [600, 80, 150], [700, 60, 120], [800, 70, 160], [880, 60, 130], [1180, 70, 170], [1260, 50, 140], [1330, 90, 190]],
    near: [[0, 70, 200, "step"], [70, 60, 240, "slant"], [140, 90, 170, "flat"], [235, 50, 210, "flat"], [395, 70, 190, "slant"], [470, 60, 120, "flat"], [535, 90, 90, "flat"], [630, 70, 70, "flat"], [705, 80, 85, "step"], [790, 60, 110, "flat"], [855, 70, 150, "slant"], [930, 70, 190, "flat"], [1125, 45, 200, "step"], [1172, 50, 150, "flat"], [1300, 40, 230, "slant"], [1342, 45, 190, "flat"], [1390, 50, 230, "step"]],
    faisaliah: 330,
    kingdom: 1075,
    pif: 1262,
  },
  tall: {
    width: 1000,
    far: [[10, 60, 150], [80, 50, 120], [140, 70, 180], [360, 60, 140], [430, 55, 110], [490, 80, 150], [575, 60, 120], [700, 70, 160], [820, 60, 130], [880, 70, 170], [950, 50, 140]],
    near: [[0, 60, 180, "step"], [58, 55, 215, "slant"], [110, 70, 160, "flat"], [178, 45, 200, "flat"], [222, 32, 140, "flat"], [346, 50, 160, "slant"], [394, 60, 110, "flat"], [452, 58, 80, "flat"], [508, 55, 95, "step"], [656, 34, 150, "flat"], [690, 30, 120, "flat"], [790, 45, 205, "slant"], [833, 55, 170, "flat"], [886, 52, 230, "step"], [936, 64, 185, "flat"]],
    faisaliah: 300,
    kingdom: 610,
    pif: 755,
  },
};

/** 70 stars over the top 60% of the hero: x and y in percent, peak opacity. */
export interface Star {
  x: number;
  y: number;
  o: number;
}

function build(plan: Plan, R: () => number): City {
  const anchors: [number, number][] = [];
  const f = (n: number) => +n.toFixed(2);

  function windows(x: number, y: number, w: number, density: number, warm: boolean) {
    let s = "";
    for (let yy = y + 10; yy < GROUND - 8; yy += 9) {
      for (let xx = x + 5; xx < x + w - 5; xx += 7) {
        if (R() > density) continue;
        const c = warm ? (R() < 0.7 ? C.warm : C.cool) : R() < 0.6 ? C.cool : C.warm;
        const blink = R() < 0.06;
        const op = (0.25 + R() * 0.45).toFixed(2);
        // The design drew a period and a phase for these: keep the sequence.
        if (blink) {
          R();
          R();
        }
        s += `<rect x="${xx}" y="${yy}" width="2.2" height="3.2" fill="${c}" opacity="${op}"${blink ? " data-bk" : ""}/>`;
      }
    }
    return s;
  }

  function block([x, w, h, crown = "flat"]: Block, far: boolean) {
    const y = GROUND - h;
    let d: string;
    if (crown === "flat") d = `M${x} ${GROUND} V${y} H${x + w} V${GROUND}Z`;
    else if (crown === "slant") d = `M${x} ${GROUND} V${y + 18} L${x + w} ${y} V${GROUND}Z`;
    else d = `M${x} ${GROUND} V${y + 12} H${x + w * 0.2} V${y} H${x + w * 0.8} V${y + 12} H${x + w} V${GROUND}Z`;
    if (!far) anchors.push([x + w / 2, y + (crown === "slant" ? 9 : 0)]);
    return `<path d="${d}" fill="url(#${far ? "rc-bld2" : "rc-bld"})"/><path d="${d}" fill="url(#rc-rim)"/>` + windows(x, y + 6, w, far ? 0.12 : 0.2, R() < 0.5);
  }

  // Far layer.
  let farBlocks = "";
  for (const [x, w, h] of plan.far) farBlocks += block([x, w, h, R() < 0.5 ? "flat" : "step"], true);
  const far = `<g opacity=".75">${farBlocks}</g><rect x="0" y="${GROUND - 200}" width="${plan.width}" height="200" fill="url(#rc-fog)"/>`;

  let near = "";
  // Al Faisaliah: a slim pyramid with the golden globe and a spire.
  const FX = plan.faisaliah;
  near += `<path d="M${FX - 46} ${GROUND} L${FX} ${GROUND - 270} L${FX + 46} ${GROUND}Z" fill="url(#rc-bld)"/>`;
  near += `<path d="M${FX - 46} ${GROUND} L${FX} ${GROUND - 270}" stroke="${C.rim}" stroke-opacity=".45" stroke-width="1.2"/>`;
  for (let k = 1; k < 9; k++) {
    const yy = GROUND - k * 24;
    const half = 46 * (1 - (k * 24) / 270);
    near += `<line x1="${f(FX - half + 4)}" y1="${yy}" x2="${f(FX + half - 4)}" y2="${yy}" stroke="${C.warm}" stroke-opacity="${(0.18 + R() * 0.25).toFixed(2)}" stroke-width="2"/>`;
  }
  near += `<circle cx="${FX}" cy="${GROUND - 208}" r="12" fill="url(#rc-gold)" filter="url(#rc-glow)"/>`;
  near += `<line x1="${FX}" y1="${GROUND - 270}" x2="${FX}" y2="${GROUND - 302}" stroke="${C.rim}" stroke-opacity=".6" stroke-width="1.5"/><circle data-bc cx="${FX}" cy="${GROUND - 304}" r="2.6" fill="${C.beacon}" filter="url(#rc-glow)" opacity=".15"/>`;

  // Kingdom Centre: the tapering tower with the arch and the sky bridge.
  const KX = plan.kingdom, KH = 290, KW = 44;
  const kc =
    `M${KX - KW} ${GROUND} C${KX - KW + 4} ${f(GROUND - KH * 0.55)} ${KX - 26} ${f(GROUND - KH * 0.85)} ${KX - 17} ${GROUND - KH}` +
    ` L${KX - 10} ${GROUND - KH} C${KX - 13} ${f(GROUND - KH * 0.82)} ${KX - 16} ${f(GROUND - KH * 0.72)} ${KX - 18} ${f(GROUND - KH * 0.66)}` +
    ` Q${KX} ${f(GROUND - KH * 0.6)} ${KX + 18} ${f(GROUND - KH * 0.66)}` +
    ` C${KX + 16} ${f(GROUND - KH * 0.72)} ${KX + 13} ${f(GROUND - KH * 0.82)} ${KX + 10} ${GROUND - KH}` +
    ` L${KX + 17} ${GROUND - KH} C${KX + 26} ${f(GROUND - KH * 0.85)} ${KX + KW - 4} ${f(GROUND - KH * 0.55)} ${KX + KW} ${GROUND}Z`;
  near += `<path d="${kc}" fill="url(#rc-bld)"/><path d="${kc}" fill="none" stroke="${C.rim}" stroke-opacity=".35" stroke-width="1.2"/>`;
  near += `<rect x="${KX - 14}" y="${f(GROUND - KH * 0.955)}" width="28" height="5" rx="1" fill="${C.warm}" opacity=".85" filter="url(#rc-glow)"/>`;
  near +=
    `<path d="M${KX - 18} ${f(GROUND - KH * 0.66)} C${KX - 16} ${f(GROUND - KH * 0.72)} ${KX - 13} ${f(GROUND - KH * 0.82)} ${KX - 10} ${GROUND - KH}` +
    ` M${KX + 18} ${f(GROUND - KH * 0.66)} C${KX + 16} ${f(GROUND - KH * 0.72)} ${KX + 13} ${f(GROUND - KH * 0.82)} ${KX + 10} ${GROUND - KH}` +
    ` M${KX - 18} ${f(GROUND - KH * 0.66)} Q${KX} ${f(GROUND - KH * 0.6)} ${KX + 18} ${f(GROUND - KH * 0.66)}" fill="none" stroke="${C.edge}" stroke-width="1.6" opacity=".85" filter="url(#rc-glow)"/>`;
  for (let k = 0; k < 20; k++) {
    const yy = GROUND - 16 - k * 10;
    const half = KW * (1 - (k * 10) / (KH * 0.75)) - 6;
    if (half > 4) near += `<line x1="${f(KX - half)}" y1="${yy}" x2="${f(KX + half)}" y2="${yy}" stroke="${C.cool}" stroke-opacity="${(0.08 + R() * 0.22).toFixed(2)}" stroke-width="2"/>`;
  }
  near += `<circle data-bc cx="${KX - 13}" cy="${GROUND - KH - 2}" r="2.4" fill="${C.beacon}" filter="url(#rc-glow)" opacity=".15"/><circle data-bc cx="${KX + 13}" cy="${GROUND - KH - 2}" r="2.4" fill="${C.beacon}" filter="url(#rc-glow)" opacity=".15"/>`;

  // PIF Tower (KAFD): the tallest, with a faceted crown.
  const PX = plan.pif, PH = 330;
  const pif = `M${PX - 34} ${GROUND} L${PX - 30} ${GROUND - PH + 40} L${PX - 8} ${GROUND - PH} L${PX + 30} ${GROUND - PH + 70} L${PX + 34} ${GROUND}Z`;
  near += `<path d="${pif}" fill="url(#rc-bld)"/><path d="M${PX - 30} ${GROUND - PH + 40} L${PX - 8} ${GROUND - PH} L${PX + 30} ${GROUND - PH + 70}" fill="none" stroke="${C.edge}" stroke-opacity=".7" stroke-width="1.4"/>`;
  for (let k = 0; k < 28; k++) near += `<line x1="${PX - 26}" y1="${GROUND - 14 - k * 11}" x2="${PX + 26}" y2="${GROUND - 14 - k * 11}" stroke="${C.cool}" stroke-opacity="${(0.06 + R() * 0.2).toFixed(2)}" stroke-width="1.6"/>`;
  near += `<circle data-bc cx="${PX - 8}" cy="${GROUND - PH - 3}" r="2.6" fill="${C.beacon}" filter="url(#rc-glow)" opacity=".15"/>`;

  // Near layer: mid-rise around the landmarks, low in the middle.
  for (const b of plan.near) near += block(b, false);

  // The landmarks first: the fibres prefer the tallest points.
  anchors.unshift([PX - 8, GROUND - PH + 4], [KX, f(GROUND - KH * 0.955)], [FX, GROUND - 208]);
  return { viewBox: [0, 0, plan.width, GROUND], far, near, anchors };
}

// The approved design drew its 70 stars first, then the city, from one sequence.
const R = seeded(21);
export const STARS: Star[] = Array.from({ length: 70 }, () => {
  const x = R() * 100;
  const y = R() * 100;
  R(); // twinkle period: the stars now twinkle in two groups instead
  const o = 0.15 + R() * 0.5;
  return { x: +x.toFixed(2), y: +y.toFixed(2), o: +o.toFixed(2) };
});

export const CITY: Record<CityLayout, City> = {
  wide: build(PLANS.wide, R),
  tall: build(PLANS.tall, seeded(22)),
};
