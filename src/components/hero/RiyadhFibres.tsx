"use client";

import { useEffect, useRef, type RefObject } from "react";
import { animate, useReducedMotion } from "framer-motion";
import { useLive } from "@/lib/live";
import { CITY, seeded, type CityLayout } from "./riyadh-city";

type Pt = [number, number];
interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Fibre {
  /** "r,g,b" */
  c: string;
  /** Alpha of the run out in the city; the stretch at the word is brighter. */
  a: number;
  w: number;
  /** Offset from the line, so the fibres lie side by side in it. */
  d: number;
  /** Where on its tower it starts, -0.5..0.5. */
  j: number;
  pts: Pt[];
  /** Indices where the stretch under the word starts and ends. */
  i0: number;
  i1: number;
}

interface Pulse {
  f: Fibre;
  dir: 1 | -1;
  k: number;
  crossed: boolean;
}

/** Green and white only, as the rest of the site. */
const COLORS = ["47,208,138", "47,208,138", "120,240,190", "220,255,240", "16,185,129"];
const MEET = "47,208,138";
/** Points every 4px along each fibre, so light runs at an even speed. */
const STEP = 4;
/** Light along a fibre, px per second. */
const SPEED = 520;
/** At most this many points of light at once. */
const MAX_PULSES = 2;
const INTRO_DURATION = 2.3;
const INTRO_DELAY = 0.8;
const INTRO_EASE = [0.3, 0.55, 0.25, 1] as const;

/** Each fibre's look, fixed (seeded), so every visit draws the same light. */
const LOOKS = (() => {
  const R = seeded(8);
  return Array.from({ length: 14 }, () => ({
    c: COLORS[Math.floor(R() * COLORS.length)],
    a: 0.22 + R() * 0.28,
    w: 0.9 + R() * 1.1,
    d: (R() - 0.5) * 2.2,
    j: R() - 0.5,
  }));
})();

/**
 * The software fibres: from the editor, browser and phone up beside the
 * headline into the same line. The hero's two greens, a touch brighter than the
 * city's, so the two kinds of light read as one family.
 */
const SOFT_LOOKS = (() => {
  const R = seeded(21);
  return Array.from({ length: 6 }, (_, i) => ({
    c: i % 2 ? "20,200,166" : "47,208,138",
    a: 0.32 + R() * 0.16,
    w: 1.1 + R() * 0.5,
    d: (R() - 0.5) * 1.6,
    j: 0,
  }));
})();

const rgba = (c: string, a: number) => `rgba(${c},${Math.max(0, Math.min(1, a)).toFixed(3)})`;

function bez(p0: Pt, p1: Pt, p2: Pt, p3: Pt, n = 60): Pt[] {
  const out: Pt[] = [];
  for (let k = 0; k <= n; k++) {
    const s = k / n;
    const m = 1 - s;
    const a = m * m * m, b = 3 * m * m * s, c = 3 * m * s * s, d = s * s * s;
    out.push([a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]]);
  }
  return out;
}

function resample(pts: Pt[], step: number): Pt[] {
  const out: Pt[] = [pts[0]];
  let carry = 0;
  for (let i = 1; i < pts.length; i++) {
    const [ax, ay] = pts[i - 1];
    const [bx, by] = pts[i];
    const len = Math.hypot(bx - ax, by - ay);
    let d = step - carry;
    while (d <= len) {
      const t = d / len;
      out.push([ax + (bx - ax) * t, ay + (by - ay) * t]);
      d += step;
    }
    carry = len - (d - step);
  }
  const last = pts[pts.length - 1];
  const tail = out[out.length - 1];
  if (Math.hypot(last[0] - tail[0], last[1] - tail[1]) > step * 0.3) out.push(last);
  return out;
}

/**
 * Where an element rests inside the host: layout offsets, which ignore the
 * entrance transforms (the words rising, the city sliding up), so the fibres
 * are laid out once, to where everything will be.
 */
function boxIn(el: HTMLElement, host: HTMLElement): Box {
  let x = 0;
  let y = 0;
  let node: HTMLElement | null = el;
  while (node && node !== host) {
    x += node.offsetLeft;
    y += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return { x, y, w: el.offsetWidth, h: el.offsetHeight };
}

interface Parts {
  host: HTMLElement;
  /** The near city layer: its towers are where the fibres start. */
  near: HTMLElement;
  /** The copy block; it is watched for size changes (fonts, language). */
  copy: HTMLElement;
  sub: HTMLElement;
  still: HTMLCanvasElement;
  light: HTMLCanvasElement;
  accentSelector: string;
  underlineSelector: string;
}

function createEngine(p: Parts) {
  const stillCtx = p.still.getContext("2d");
  const lightCtx = p.light.getContext("2d");
  if (!stillCtx || !lightCtx) return null;
  const sctx: CanvasRenderingContext2D = stillCtx;
  const pctx: CanvasRenderingContext2D = lightCtx;

  const fibres: Fibre[] = LOOKS.map((look) => ({ ...look, pts: [], i0: 0, i1: 0 }));
  const soft: Fibre[] = SOFT_LOOKS.map((look) => ({ ...look, pts: [], i0: 0, i1: 0 }));
  /** Every fibre drawn: the city's n, then the software ones in use. */
  let active: Fibre[] = [];
  const pulses: Pulse[] = [];
  let n = 0, W = 0, H = 0, DPR = 1, tall = false;
  let U = { x0: 0, x1: 0, y: 0 };
  let S: Box = { x: 0, y: 0, w: 0, h: 0 };
  let ul: HTMLElement | null = null;
  let intro = 0, drawn = -1, arrived = false, live = false, raf = 0, last = 0;
  /** Where light was drawn last frame: only those spots are cleared, not the whole canvas. */
  let lit: Box[] = [];
  let flareUntil = 0, hitUntil = 0, nextAt = 0, glow = "";
  let mask: HTMLCanvasElement | null = null;
  let maskKey = "";

  /** The city's anchor points on screen, from the visible composition. */
  function anchors(layout: CityLayout): Pt[] {
    const box = boxIn(p.near, p.host);
    const [vx, vy, vw, vh] = CITY[layout].viewBox;
    const s = Math.max(box.w / vw, box.h / vh);
    const tx = box.x + (box.w - vw * s) / 2 - vx * s;
    const ty = box.y + box.h - vh * s - vy * s;
    // A few px into the tower, so each fibre comes out of it, not off it.
    return CITY[layout].anchors.map(([x, y]) => [tx + x * s, ty + y * s + 5] as Pt);
  }

  function layout() {
    const accent = p.host.querySelector<HTMLElement>(p.accentSelector);
    ul = p.host.querySelector<HTMLElement>(p.underlineSelector);
    if (!accent || !ul) return;
    W = p.host.clientWidth;
    H = p.host.clientHeight;
    if (!W || !H) return;
    DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    for (const c of [p.still, p.light]) {
      c.width = Math.round(W * DPR);
      c.height = Math.round(H * DPR);
    }
    const u = boxIn(ul, p.host);
    U = { x0: u.x, x1: u.x + u.w, y: u.y + u.h / 2 };
    S = boxIn(p.sub, p.host);
    const tallSvg = p.near.querySelector<SVGElement>('[data-layout="tall"]');
    tall = !!tallSvg && getComputedStyle(tallSvg).display !== "none";
    n = tall ? (W < 600 ? 6 : 10) : 14;

    const all = anchors(tall ? "tall" : "wide").filter(([x]) => x > -10 && x < W + 10);
    const cx = (U.x0 + U.x1) / 2;
    const left = all.filter(([x]) => (tall ? x < cx - W * 0.1 : x < U.x0 - 40)).sort((a, b) => a[1] - b[1]);
    const right = all.filter(([x]) => (tall ? x > cx + W * 0.1 : x > U.x1 + 40)).sort((a, b) => a[1] - b[1]);
    if (!left.length) left.push([-30, H * 0.7]);
    if (!right.length) right.push([W + 30, H * 0.7]);

    const pairs = fibres.slice(0, n).map((f, i) => {
      const a = left[i % left.length];
      const b = right[(i + 1) % right.length];
      return { f, a: [a[0] + f.j * 6, a[1]] as Pt, b: [b[0] - f.j * 6, b[1]] as Pt };
    });

    // Portrait: each side's fibres climb in a lane beside the text, the
    // outermost tower taking the outermost lane, so they don't cross.
    const rankL = new Map(pairs.slice().sort((q, r) => q.a[0] - r.a[0]).map((q, k) => [q.f, k]));
    const rankR = new Map(pairs.slice().sort((q, r) => r.b[0] - q.b[0]).map((q, k) => [q.f, k]));
    const lanes = (n - 1) * 3;
    const off = Math.min(24, Math.max(14, S.x * 0.35));
    const outL = Math.max(6, S.x - off - lanes);
    const outR = Math.min(W - 6, S.x + S.w + off + lanes);

    for (const { f, a, b } of pairs) {
      const y = U.y + f.d;
      let toWord: Pt[];
      let fromWord: Pt[];
      if (tall) {
        const gl = outL + (rankL.get(f) ?? 0) * 3;
        const gr = outR - (rankR.get(f) ?? 0) * 3;
        // Out of the tower to the lane below the text, up the lane, and into the line's end.
        const top = S.y + S.h + 16;
        const ga = Math.min(a[1] - 30, top);
        const gb = Math.min(b[1] - 30, top);
        toWord = bez(a, [a[0], a[1] - (a[1] - ga) * 0.5], [gl, ga + (a[1] - ga) * 0.45], [gl, ga], 40).concat(
          bez([gl, ga], [gl, y + 4], [gl + (U.x0 - gl) * 0.5, y], [U.x0, y], 40).slice(1),
        );
        fromWord = bez([U.x1, y], [U.x1 + (gr - U.x1) * 0.5, y], [gr, y + 4], [gr, gb], 40).concat(
          bez([gr, gb], [gr, gb + (b[1] - gb) * 0.45], [b[0], b[1] - (b[1] - gb) * 0.5], b, 40).slice(1),
        );
      } else {
        // Up out of the towers in one sweep, level with the line for the last stretch.
        const reach = Math.min(W * 0.12, 170);
        const rise = (q: Pt) => Math.max(60, (q[1] - y) * 0.55);
        toWord = bez(a, [a[0] + (U.x0 - a[0]) * 0.1, a[1] - rise(a)], [U.x0 - reach, y], [U.x0, y]);
        fromWord = bez([U.x1, y], [U.x1 + reach, y], [b[0] - (b[0] - U.x1) * 0.1, b[1] - rise(b)], b);
      }
      const L = resample(toWord, STEP);
      const M = resample([[U.x0, y], [U.x1, y]], STEP);
      const R = resample(fromWord, STEP);
      f.pts = L.concat(M.slice(1), R.slice(1));
      f.i0 = L.length - 1;
      f.i1 = f.i0 + M.length - 1;
    }
    // Software: anything in the hero marked as a fibre source (the editor,
    // the browser, the phone) sends light into the same line, alongside the city's.
    const srcEls = [...p.host.querySelectorAll<HTMLElement>("[data-fibre-src]")].filter((el) => el.offsetParent);
    // Their size follows the room above the copy: lay out again if it changes.
    for (const el of srcEls) observer.observe(el);
    const sources = srcEls.map((el) => {
      const b = boxIn(el, p.host);
      const mid = b.x + b.w / 2;
      // From its foot, or (wide screens, "side") from the edge facing the word.
      const side = !tall && el.dataset.fibreSrc === "side";
      return (side ? [mid < cx ? b.x + b.w - 10 : b.x + 10, b.y + b.h * 0.6] : [mid, b.y + b.h - 10]) as Pt;
    });
    const sl = sources.filter(([x]) => x < cx).sort((a, b) => a[1] - b[1]);
    const sr = sources.filter(([x]) => x >= cx).sort((a, b) => a[1] - b[1]);
    const m = Math.min(soft.length, Math.max(sl.length, sr.length));
    const reach = Math.min(W * 0.12, 170);
    for (let i = 0; i < m; i++) {
      const f = soft[i];
      const y = U.y + f.d;
      const a = sl.length ? sl[i % sl.length] : null;
      const b = sr.length ? sr[(i + 1) % sr.length] : null;
      // Tall screens: down the outer edge, clear of the copy, then into the line.
      const laneL = (q: Pt) => Math.min(q[0], 16);
      const laneR = (q: Pt) => Math.max(q[0], W - 16);
      const L = a
        ? resample(
            tall
              ? bez(a, [laneL(a), a[1] + 24], [laneL(a), y - 24], [U.x0, y])
              : bez(a, [a[0] + (U.x0 - a[0]) * 0.12, y], [U.x0 - reach, y], [U.x0, y]),
            STEP,
          )
        : [[U.x0, y] as Pt];
      const M = resample([[U.x0, y], [U.x1, y]], STEP);
      const R = b
        ? resample(
            tall
              ? bez([U.x1, y], [laneR(b), y - 24], [laneR(b), b[1] + 24], b)
              : bez([U.x1, y], [U.x1 + reach, y], [b[0] - (b[0] - U.x1) * 0.12, y], b),
            STEP,
          )
        : [[U.x1, y] as Pt];
      f.pts = L.concat(M.slice(1), R.slice(1));
      f.i0 = L.length - 1;
      f.i1 = f.i0 + M.length - 1;
    }
    active = fibres.slice(0, n).concat(soft.slice(0, m));
    pulses.length = 0;
    mask = null;
    drawn = -1;
    drawStill(intro);
    drawn = intro;
    pctx.setTransform(1, 0, 0, 1, 0, 0);
    pctx.clearRect(0, 0, p.light.width, p.light.height);
  }

  /** Fibres and light passing behind the subheading fade out, so it always reads. */
  function clearText(ctx: CanvasRenderingContext2D) {
    if (!S.w || !S.h) return;
    const pad = tall ? 6 : 34;
    const key = `${S.w}|${S.h}|${pad}|${DPR}`;
    if (!mask || key !== maskKey) {
      const c = document.createElement("canvas");
      c.width = Math.ceil((S.w + pad * 2) * DPR);
      c.height = Math.ceil((S.h + pad * 2) * DPR);
      const g = c.getContext("2d");
      if (!g) return;
      // The block itself is drawn far off the canvas; only its blurred shadow lands.
      const off = 10000;
      g.shadowColor = "rgba(0,0,0,.85)";
      g.shadowBlur = pad * 0.8 * DPR;
      g.shadowOffsetX = off;
      g.setTransform(DPR, 0, 0, DPR, 0, 0);
      g.fillStyle = "#000";
      g.beginPath();
      g.roundRect(pad - off / DPR, pad, S.w, S.h, Math.min(18, pad * 3));
      g.fill();
      // Nothing above the subheading's top edge: the line just over it stays whole.
      g.shadowColor = "transparent";
      g.globalCompositeOperation = "destination-in";
      const full = S.h + pad * 2;
      const fade = g.createLinearGradient(0, 0, 0, full);
      fade.addColorStop(0, "rgba(0,0,0,0)");
      fade.addColorStop(Math.max(0, Math.min(1, (pad - 8) / full)), "rgba(0,0,0,0)");
      fade.addColorStop(Math.max(0, Math.min(1, (pad + 4) / full)), "#000");
      fade.addColorStop(1, "#000");
      g.fillStyle = fade;
      g.fillRect(0, 0, S.w + pad * 2, full);
      mask = c;
      maskKey = key;
    }
    ctx.globalCompositeOperation = "destination-out";
    ctx.drawImage(mask, S.x - pad, S.y - pad, S.w + pad * 2, S.h + pad * 2);
    ctx.globalCompositeOperation = "source-over";
  }

  function glowAt(ctx: CanvasRenderingContext2D, [x, y]: Pt, r: number, c: string, a: number) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(255,255,255,${a})`);
    g.addColorStop(0.3, rgba(c, a * 0.65));
    g.addColorStop(1, rgba(c, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  function stroke(ctx: CanvasRenderingContext2D, f: Fibre, i0: number, i1: number) {
    if (i1 - i0 < 1) return;
    ctx.beginPath();
    ctx.moveTo(f.pts[i0][0], f.pts[i0][1]);
    for (let k = i0 + 1; k <= i1; k++) ctx.lineTo(f.pts[k][0], f.pts[k][1]);
    ctx.stroke();
  }

  /**
   * The fibres themselves. During the entrance they draw in from the towers on
   * both sides, then fill the line from both ends until they meet in the
   * middle; after that they are drawn once and left alone.
   */
  function drawStill(prog: number) {
    sctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    sctx.clearRect(0, 0, W, H);
    if (prog <= 0 || !n) return;
    sctx.globalCompositeOperation = "lighter";
    const bottom = Math.max(...fibres.slice(0, n).map((f) => Math.max(f.pts[0]?.[1] ?? H, f.pts[f.pts.length - 1]?.[1] ?? H)));
    for (const f of active) {
      const end = f.pts.length - 1;
      if (end < 1) continue;
      const hi = Math.min(1, f.a * 2.2);
      const ends = f.a * 1.3;
      let g: CanvasGradient;
      if (tall) {
        // Brighter as the fibres climb toward the word.
        g = sctx.createLinearGradient(0, U.y - 2, 0, bottom);
        g.addColorStop(0, rgba(f.c, hi));
        g.addColorStop(0.18, rgba(f.c, f.a));
        g.addColorStop(1, rgba(f.c, ends));
      } else {
        const s = f.pts[0];
        const e = f.pts[end];
        const span = e[0] - s[0] || 1;
        const t0 = Math.min(0.48, Math.max(0.05, (U.x0 - s[0]) / span));
        const t1 = Math.max(0.52, Math.min(0.95, (U.x1 - s[0]) / span));
        g = sctx.createLinearGradient(s[0], s[1], e[0], e[1]);
        g.addColorStop(0, rgba(f.c, ends));
        g.addColorStop(t0 * 0.5, rgba(f.c, f.a));
        g.addColorStop(t0, rgba(f.c, hi));
        g.addColorStop(t1, rgba(f.c, hi));
        g.addColorStop(t1 + (1 - t1) * 0.5, rgba(f.c, f.a));
        g.addColorStop(1, rgba(f.c, ends));
      }
      sctx.strokeStyle = g;
      sctx.lineWidth = f.w;
      if (prog >= 1) stroke(sctx, f, 0, end);
      else {
        const q = Math.min(1, prog / 0.78);
        const w = Math.max(0, (prog - 0.78) / 0.22);
        const half = (f.i1 - f.i0) / 2;
        const iL = Math.round(q < 1 ? q * f.i0 : f.i0 + w * half);
        const iR = Math.round(q < 1 ? end - q * (end - f.i1) : f.i1 - w * half);
        stroke(sctx, f, 0, iL);
        stroke(sctx, f, iR, end);
        glowAt(sctx, f.pts[iL], 7, f.c, 0.7);
        glowAt(sctx, f.pts[iR], 7, f.c, 0.7);
      }
    }
    // The line is the fibres held together: a soft core along it, a glow at each end.
    const w = prog >= 1 ? 1 : Math.max(0, (prog - 0.78) / 0.22);
    const half = ((U.x1 - U.x0) / 2) * w;
    if (w > 0) {
      sctx.strokeStyle = rgba(MEET, 0.22 * w);
      sctx.lineWidth = 9;
      sctx.lineCap = "round";
      sctx.beginPath();
      sctx.moveTo(U.x0, U.y);
      sctx.lineTo(U.x0 + half, U.y);
      sctx.moveTo(U.x1, U.y);
      sctx.lineTo(U.x1 - half, U.y);
      sctx.stroke();
      sctx.lineCap = "butt";
    }
    // Flattened to an ellipse (90 wide, 30 tall) and kept above the
    // subheading's top edge, so the bright point never sits on the text.
    const reach = Math.max(8, Math.min(30, S.y - U.y - 6));
    for (const x of [U.x0, U.x1]) {
      const g = sctx.createRadialGradient(0, 0, 0, 0, 0, 90);
      g.addColorStop(0, rgba(MEET, 0.2 * Math.min(1, prog / 0.78)));
      g.addColorStop(1, rgba(MEET, 0));
      sctx.save();
      sctx.translate(x, U.y);
      sctx.scale(1, reach / 90);
      sctx.fillStyle = g;
      sctx.fillRect(-90, -90, 180, 180);
      sctx.restore();
    }
    sctx.globalCompositeOperation = "source-over";
    clearText(sctx);
  }

  function setGlow(state: string) {
    if (state === glow || !ul) return;
    glow = state;
    if (state) ul.setAttribute("data-glow", state);
    else ul.removeAttribute("data-glow");
  }

  function frame(now: number) {
    raf = 0;
    if (!live) return;
    const t = now / 1000;
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
    last = now;
    if (n) {
      if (intro < 1) {
        drawStill(intro);
        drawn = intro;
      } else if (drawn !== 1) {
        drawStill(1);
        drawn = 1;
      }
      // Light now and then: in along a fibre on one side, through the word, out the other.
      if (arrived && pulses.length < MAX_PULSES && t > nextAt) {
        const f = active[Math.floor(Math.random() * active.length)];
        const dir: 1 | -1 = Math.random() < 0.5 ? 1 : -1;
        pulses.push({ f, dir, k: dir > 0 ? 0 : f.pts.length - 1, crossed: false });
        nextAt = t + 1.4 + Math.random() * 1.2;
      }
      pctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      for (const r of lit) pctx.clearRect(r.x, r.y, r.w, r.h);
      lit = [];
      if (pulses.length) {
        pctx.globalCompositeOperation = "lighter";
        for (let i = pulses.length - 1; i >= 0; i--) {
          const q = pulses[i];
          const f = q.f;
          const end = f.pts.length - 1;
          q.k += (q.dir * SPEED * dt) / STEP;
          if (!q.crossed && (q.dir > 0 ? q.k >= f.i0 : q.k <= f.i1)) {
            q.crossed = true;
            hitUntil = now + 300;
          }
          const k = Math.round(q.k);
          if (k < 0 || k > end) {
            pulses.splice(i, 1);
            continue;
          }
          const tail = 14;
          let x0 = f.pts[k][0], y0 = f.pts[k][1], x1 = x0, y1 = y0;
          for (let j = 1; j <= tail; j++) {
            const k0 = k - q.dir * j;
            const k1 = k - q.dir * (j - 1);
            if (k0 < 0 || k0 > end) continue;
            const [ax, ay] = f.pts[k0];
            x0 = Math.min(x0, ax); y0 = Math.min(y0, ay); x1 = Math.max(x1, ax); y1 = Math.max(y1, ay);
            pctx.strokeStyle = rgba(f.c, 1 - j / tail);
            pctx.lineWidth = f.w + 1.3;
            pctx.beginPath();
            pctx.moveTo(ax, ay);
            pctx.lineTo(f.pts[k1][0], f.pts[k1][1]);
            pctx.stroke();
          }
          glowAt(pctx, f.pts[k], k > f.i0 && k < f.i1 ? 7 : 9, f.c, 0.95);
          lit.push({ x: x0 - 12, y: y0 - 12, w: x1 - x0 + 24, h: y1 - y0 + 24 });
        }
        pctx.globalCompositeOperation = "source-over";
        // Only where the light can have crossed the subheading.
        const pad = tall ? 6 : 34;
        if (lit.some((r) => r.x < S.x + S.w + pad && r.x + r.w > S.x - pad && r.y < S.y + S.h + pad && r.y + r.h > S.y - pad)) clearText(pctx);
      }
    }
    setGlow(now < flareUntil ? "flare" : now < hitUntil ? "hit" : "");
    raf = requestAnimationFrame(frame);
  }

  let pending = 0;
  let dead = false;
  const relayout = () => {
    if (dead) return;
    cancelAnimationFrame(pending);
    pending = requestAnimationFrame(layout);
  };
  const observer = new ResizeObserver(relayout);
  observer.observe(p.host);
  observer.observe(p.copy);
  document.fonts?.ready.then(relayout);
  // The Arabic face loads the first time Arabic is shown: lay out again then.
  document.fonts?.addEventListener("loadingdone", relayout);

  return {
    /** Measure again (after a language switch, say) and redraw. */
    relayout,
    setLive(v: boolean) {
      live = v;
      if (v && !raf) {
        last = 0;
        raf = requestAnimationFrame(frame);
      } else if (!v && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    },
    setIntro(v: number) {
      intro = v;
      if (!raf) {
        drawStill(v);
        drawn = v;
      }
    },
    /** The fibres have met in the middle: the line flares, and light starts to run. */
    arrive() {
      if (arrived) return;
      arrived = true;
      flareUntil = performance.now() + 750;
      nextAt = performance.now() / 1000 + 1.4;
    },
    /** Straight to the finished picture, nothing moving. */
    finish() {
      intro = 1;
      drawStill(1);
      drawn = 1;
    },
    destroy() {
      dead = true;
      live = false;
      cancelAnimationFrame(raf);
      cancelAnimationFrame(pending);
      raf = 0;
      observer.disconnect();
      document.fonts?.removeEventListener("loadingdone", relayout);
    },
  };
}

interface RiyadhFibresProps {
  hostRef: RefObject<HTMLElement | null>;
  nearRef: RefObject<HTMLElement | null>;
  copyRef: RefObject<HTMLElement | null>;
  subRef: RefObject<HTMLElement | null>;
  accentSelector: string;
  underlineSelector: string;
  /** Reading direction: a switch re-lays the fibres onto the new headline. */
  dir: "ltr" | "rtl";
  /** Turns true once the intro has handed over: the fibres then draw in. */
  play: boolean;
  className: string;
}

/**
 * Light fibres from Riyadh's towers to the word "technology". They rise out
 * of the city on both sides and run through the line under the word, so the
 * line is the fibres themselves; now and then a point of light runs in from
 * one side, along the line and out the other.
 *
 * Wide screens: one sweep from the towers either side of the copy. Portrait
 * screens (phones, tablets): the fibres climb in two narrow lanes beside the
 * text and turn into the line's ends, so they never cross the copy.
 *
 * Two canvases: the fibres (drawn once, then left alone) and the moving light
 * (at most two points). Nothing runs while the hero is off screen or the tab
 * is hidden.
 */
export function RiyadhFibres({ hostRef, nearRef, copyRef, subRef, accentSelector, underlineSelector, dir, play, className }: RiyadhFibresProps) {
  const reduced = useReducedMotion() ?? false;
  const stillRef = useRef<HTMLCanvasElement>(null);
  const lightRef = useRef<HTMLCanvasElement>(null);
  const live = useLive(hostRef);
  const engine = useRef<ReturnType<typeof createEngine>>(null);
  // Where the entrance has got to, so an engine made again (a remount) picks it up.
  const progress = useRef({ intro: 0, arrived: false });

  useEffect(() => {
    const host = hostRef.current, near = nearRef.current, copy = copyRef.current, sub = subRef.current;
    const still = stillRef.current, light = lightRef.current;
    if (!host || !near || !copy || !sub || !still || !light) return;
    const e = createEngine({ host, near, copy, sub, still, light, accentSelector, underlineSelector });
    engine.current = e;
    if (e && progress.current.intro) e.setIntro(progress.current.intro);
    if (e && progress.current.arrived) e.arrive();
    return () => {
      e?.destroy();
      engine.current = null;
    };
  }, [hostRef, nearRef, copyRef, subRef, accentSelector, underlineSelector]);

  useEffect(() => {
    engine.current?.setLive(live);
  }, [live]);

  // A language switch swaps the headline: lay the fibres onto it again once
  // the new words are in (the copy's size change also triggers this).
  useEffect(() => {
    engine.current?.relayout();
  }, [dir]);

  useEffect(() => {
    if (reduced) {
      progress.current.intro = 1;
      engine.current?.finish();
      return;
    }
    if (!play || progress.current.arrived) return;
    const controls = animate(progress.current.intro, 1, {
      duration: INTRO_DURATION * (1 - progress.current.intro),
      delay: progress.current.intro ? 0 : INTRO_DELAY,
      ease: INTRO_EASE,
      onUpdate: (v) => {
        progress.current.intro = v;
        engine.current?.setIntro(v);
      },
      onComplete: () => {
        progress.current.arrived = true;
        engine.current?.arrive();
      },
    });
    return () => controls.stop();
  }, [play, reduced]);

  return (
    <>
      <canvas ref={stillRef} className={className} aria-hidden />
      <canvas ref={lightRef} className={className} aria-hidden />
    </>
  );
}
