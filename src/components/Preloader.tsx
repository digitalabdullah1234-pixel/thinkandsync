"use client";

import { useEffect, useRef, useState } from "react";
import { INTRO_HARD_TIMEOUT_MS, markIntroDone } from "@/lib/intro";
import "@/lib/motion-override";
import { HONOUR_REDUCED_MOTION } from "@/lib/motion-preference";
import { LOGO_WHITE } from "./Logo";

/* Matches the hero's ground colour: the intro dissolves straight into the
   dark film rather than flashing a light panel over it. */
const BG = "#0B0F0D";
/** Neutral gray every dot wears before the shine colours it in. Muted against
    the dark ground, so the shine still reads as the wordmark lighting up. */
const GRAY = [0x4d, 0x55, 0x51] as const;

const FORM_MS = 1150; // travel time for one dot
const FORM_STAGGER_MS = 350; // spread of per-dot start delays -> ~1.5s phase
const SHINE_MS = 800; // diagonal sweep, gray -> true colour
const HOLD_MS = 400; // fully coloured beat
const FLY_MS = 900; // centre -> header slot, overlay fades
const HANDOFF_MS = 240; // dots dissolve over the real header logo
const FORM_END = FORM_MS + FORM_STAGGER_MS;
const SHINE_END = FORM_END + SHINE_MS;
const HOLD_END = SHINE_END + HOLD_MS;
const FLY_END = HOLD_END + FLY_MS; // ~3.6s total

const LOGO_WIDTH_RATIO = 0.55; // of viewport width
const SAMPLE_STEP = 4;
const MAX_DOTS = 6000;
const IMAGE_WAIT_MS = 1200;

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);
const easeOutCubic = (p: number) => 1 - Math.pow(1 - p, 3);
const easeInOutCubic = (p: number) =>
  p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;

interface Dot {
  sx: number; // scattered start, absolute screen px
  sy: number;
  tx: number; // target, relative to the logo box
  ty: number;
  diag: number; // position along the diagonal sweep axis
  delay: number;
  r: number;
  cr: number; // true colour sampled from the logo
  cg: number;
  cb: number;
  key: number;
}

/**
 * Draws the wordmark offscreen and turns every opaque pixel on a 4px grid into
 * a dot that remembers its own colour, so the black type and the green K each
 * come back as themselves when the shine passes over.
 */
function sampleLogo(img: HTMLImageElement, w: number, h: number, vw: number, vh: number) {
  const off = document.createElement("canvas");
  off.width = Math.round(w);
  off.height = Math.round(h);
  const octx = off.getContext("2d", { willReadFrequently: true });
  if (!octx) return [];

  octx.drawImage(img, 0, 0, off.width, off.height);
  const { data } = octx.getImageData(0, 0, off.width, off.height);

  const raw: Array<[number, number, number, number, number]> = [];
  for (let y = 0; y < off.height; y += SAMPLE_STEP) {
    for (let x = 0; x < off.width; x += SAMPLE_STEP) {
      const i = (y * off.width + x) * 4;
      if (data[i + 3] > 128) raw.push([x, y, data[i], data[i + 1], data[i + 2]]);
    }
  }
  if (!raw.length) return [];

  const stride = Math.ceil(raw.length / MAX_DOTS);
  const points = stride > 1 ? raw.filter((_, i) => i % stride === 0) : raw;

  return points.map(([tx, ty, cr, cg, cb]): Dot => {
    // ~2/3 rain down from above, the rest scatter in from all around.
    let sx: number;
    let sy: number;
    if (Math.random() < 0.65) {
      sx = Math.random() * vw;
      sy = -30 - Math.random() * vh * 0.9;
    } else {
      const angle = Math.random() * Math.PI * 2;
      const dist = 0.55 + Math.random() * 0.75;
      sx = vw / 2 + Math.cos(angle) * vw * dist;
      sy = vh / 2 + Math.sin(angle) * vh * dist;
    }

    // Quantise so dots can be batched into a handful of fill passes.
    const qr = Math.round(cr / 12) * 12;
    const qg = Math.round(cg / 12) * 12;
    const qb = Math.round(cb / 12) * 12;

    return {
      sx,
      sy,
      tx,
      ty,
      diag: tx + (h - ty) * 0.45,
      delay: (tx / w) * FORM_STAGGER_MS * 0.55 + Math.random() * FORM_STAGGER_MS * 0.45,
      r: 1.4 + Math.random() * 0.7,
      cr: qr,
      cg: qg,
      cb: qb,
      key: (qr << 16) | (qg << 8) | qb,
    };
  });
}

export function Preloader() {
  const [active, setActive] = useState(true);
  const bgRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let finished = false;
    let raf = 0;
    const timers: number[] = [];
    const root = document.documentElement;
    const prevOverflow = root.style.overflow;

    const finish = () => {
      if (finished) return;
      finished = true;
      cancelAnimationFrame(raf);
      for (const id of timers) clearTimeout(id);
      root.style.overflow = prevOverflow;
      markIntroDone();
      setActive(false);
    };

    // Unconditional kill switch: the site becomes visible after this, always.
    timers.push(window.setTimeout(finish, INTRO_HARD_TIMEOUT_MS));

    // A refresh or a step back (marked by the boot script in the layout): no intro.
    if (root.getAttribute("data-intro") === "skip") {
      finish();
      return;
    }

    if (HONOUR_REDUCED_MOTION && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finish();
      return;
    }

    const canvas = canvasRef.current;
    const bg = bgRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !bg || !ctx) {
      finish();
      return;
    }

    root.style.overflow = "hidden";

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    /*
     * Back the canvas at device resolution so the dots render crisp — but cap
     * it hard. A field of a few thousand ~2px circles is fill-rate bound, and
     * at dpr 3 the canvas is nine times the pixels of a dpr-1 one for a
     * sharpness difference nobody can see at that dot size. Phones and small
     * laptops, which are exactly where the ratio runs highest, are also the
     * ones with the least fill rate to spare, so they get the tighter cap.
     */
    const small = Math.min(vw, vh) < 700;
    const dpr = Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2);
    canvas.width = Math.round(vw * dpr);
    canvas.height = Math.round(vh * dpr);
    canvas.style.width = `${vw}px`;
    canvas.style.height = `${vh}px`;
    ctx.scale(dpr, dpr);

    let started = false;
    const start = (img: HTMLImageElement) => {
      if (finished || started) return;
      started = true;

      const aspect = img.naturalWidth / img.naturalHeight || 279 / 97;
      const logoW = Math.min(vw * LOGO_WIDTH_RATIO, vw - 64);
      const logoH = logoW / aspect;

      const dots = sampleLogo(img, logoW, logoH, vw, vh);
      if (!dots.length) {
        finish();
        return;
      }

      // Colour buckets let the held/flying logo draw in a few fill passes.
      const buckets = new Map<number, Dot[]>();
      for (const d of dots) {
        const list = buckets.get(d.key);
        if (list) list.push(d);
        else buckets.set(d.key, [d]);
      }

      let minDiag = Infinity;
      let maxDiag = -Infinity;
      for (const d of dots) {
        if (d.diag < minDiag) minDiag = d.diag;
        if (d.diag > maxDiag) maxDiag = d.diag;
      }
      const band = logoW * 0.16;

      const homeX = (vw - logoW) / 2;
      const homeY = (vh - logoH) / 2;

      /*
       * Prebuilt geometry for the shine.
       *
       * The dots hold still through that whole phase — only their colour
       * moves — yet the old loop rebuilt every circle from scratch and issued
       * one fillStyle, one beginPath, one arc and one fill *per dot per
       * frame*: six thousand of each, sixty times a second, plus six thousand
       * exp() and pow() calls and six thousand template strings. That is what
       * made the intro stutter.
       *
       * A dot's shine colour depends on exactly two things: where it sits
       * along the sweep axis, and what colour it is in the logo. So the dots
       * are grouped by both, once, into immutable Path2D objects. Each frame
       * then costs one colour computation and one fill() per group, with no
       * geometry work at all.
       */
      const DIAG_BUCKETS = 128;
      const diagSpan = maxDiag - minDiag || 1;

      interface ShineGroup {
        path: Path2D;
        diag: number;
        cr: number;
        cg: number;
        cb: number;
      }

      const shine: ShineGroup[] = [];
      {
        const byBucket = new Map<number, Map<number, ShineGroup>>();
        for (const d of dots) {
          const slot = Math.min(
            DIAG_BUCKETS - 1,
            Math.floor(((d.diag - minDiag) / diagSpan) * DIAG_BUCKETS),
          );
          let byColor = byBucket.get(slot);
          if (!byColor) {
            byColor = new Map();
            byBucket.set(slot, byColor);
          }
          let group = byColor.get(d.key);
          if (!group) {
            group = {
              path: new Path2D(),
              // The bucket's centre stands in for every dot in it. At 128
              // buckets that is a fraction of the sweep's own soft edge.
              diag: minDiag + ((slot + 0.5) / DIAG_BUCKETS) * diagSpan,
              cr: d.cr,
              cg: d.cg,
              cb: d.cb,
            };
            byColor.set(d.key, group);
            shine.push(group);
          }
          const x = homeX + d.tx;
          const y = homeY + d.ty;
          group.path.moveTo(x + d.r, y);
          group.path.arc(x, y, d.r, 0, Math.PI * 2);
        }
      }

      // Resolved when the fly starts so a late-loading header can't skew it.
      let flyFrom = { x: homeX, y: homeY, s: 1 };
      let flyTo: { x: number; y: number; s: number } | null = null;

      const t0 = performance.now();

      const draw = (now: number) => {
        const t = now - t0;
        ctx.clearRect(0, 0, vw, vh);

        let originX = homeX;
        let originY = homeY;
        let scale = 1;
        let flying = false;

        if (t >= HOLD_END && flyTo) {
          flying = true;
          const p = easeInOutCubic(clamp01((t - HOLD_END) / FLY_MS));
          originX = flyFrom.x + (flyTo.x - flyFrom.x) * p;
          originY = flyFrom.y + (flyTo.y - flyFrom.y) * p;
          scale = flyFrom.s + (flyTo.s - flyFrom.s) * p;
        }

        if (t < FORM_END) {
          // Phase 2 — dots gather into the wordmark, all one neutral gray.
          ctx.fillStyle = `rgb(${GRAY[0]},${GRAY[1]},${GRAY[2]})`;
          ctx.beginPath();
          for (const d of dots) {
            const p = easeOutCubic(clamp01((t - d.delay) / FORM_MS));
            if (p <= 0) continue;
            const x = d.sx + (homeX + d.tx - d.sx) * p;
            const y = d.sy + (homeY + d.ty - d.sy) * p;
            ctx.moveTo(x + d.r, y);
            ctx.arc(x, y, d.r, 0, Math.PI * 2);
          }
          ctx.fill();
        } else if (t < SHINE_END) {
          // Phase 3 — a diagonal band sweeps across; each dot it touches
          // turns from gray to the colour it had in the logo.
          const p = clamp01((t - FORM_END) / SHINE_MS);
          const sweep = minDiag - band + p * (maxDiag - minDiag + band * 2);

          for (const group of shine) {
            const c = clamp01((sweep - group.diag) / (band * 0.9) + 0.5);
            const offset = (group.diag - sweep) / (band * 0.55);
            const hl = Math.exp(-(offset * offset));
            const mix = (g: number, tc: number) => {
              const v = g + (tc - g) * c;
              return Math.round(v + (255 - v) * hl * 0.7);
            };
            ctx.fillStyle = `rgb(${mix(GRAY[0], group.cr)},${mix(GRAY[1], group.cg)},${mix(GRAY[2], group.cb)})`;
            ctx.fill(group.path);
          }
        } else {
          // Phases 4 and 5 — fully coloured, held then flown to the corner.
          // Dots need a floor or they dissolve as the logo shrinks, but too
          // high a floor makes them overlap and land visibly bolder than the
          // real wordmark. This sits just above dissolving; the crossfade at
          // the end of the flight covers the remaining difference.
          const rScale = Math.max(scale, 0.28);
          for (const [key, list] of buckets) {
            ctx.fillStyle = `rgb(${(key >> 16) & 255},${(key >> 8) & 255},${key & 255})`;
            ctx.beginPath();
            for (const d of list) {
              const x = originX + d.tx * scale;
              const y = originY + d.ty * scale;
              const r = d.r * rScale;
              ctx.moveTo(x + r, y);
              ctx.arc(x, y, r, 0, Math.PI * 2);
            }
            ctx.fill();
          }
        }

        // Safety net only — the teardown timer normally gets here first, and
        // finishing early would cut the crossfade short.
        if (flying && t >= FLY_END + 200) {
          finish();
          return;
        }
        if (!finished) raf = requestAnimationFrame(draw);
      };

      raf = requestAnimationFrame(draw);

      // Phase 5 kicks off here so the header position is read at the last
      // possible moment, and the overlay dissolves alongside the flight.
      timers.push(
        window.setTimeout(() => {
          if (finished) return;
          // Measure the wordmark itself, not its slot. The header logo sits
          // inside a grid track, and a container that stretches would send the
          // flight to the track's edge at the track's scale — the logo would
          // barely shrink and land well left of where it belongs.
          const slot = document.querySelector("[data-header-logo]");
          const mark = slot?.querySelector("img") ?? slot;
          const rect = mark?.getBoundingClientRect();

          bg.style.transition = `opacity ${FLY_MS}ms ease-in-out`;
          bg.style.opacity = "0";

          if (rect && rect.width > 0) {
            flyFrom = { x: homeX, y: homeY, s: 1 };
            flyTo = { x: rect.left, y: rect.top, s: rect.width / logoW };
          } else {
            // Nothing to land on — fade out where it stands.
            canvas.style.transition = `opacity ${FLY_MS}ms ease-in-out`;
            canvas.style.opacity = "0";
          }
          // Hand off before the overlay is torn down: reveal the real header
          // logo underneath, then dissolve the dots over it so the swap is a
          // crossfade rather than a pop.
          timers.push(
            window.setTimeout(() => {
              markIntroDone();
              canvas.style.transition = `opacity ${HANDOFF_MS}ms ease-out`;
              canvas.style.opacity = "0";
            }, Math.max(0, FLY_MS - HANDOFF_MS)),
          );

          timers.push(window.setTimeout(finish, FLY_MS + 80));
        }, HOLD_END),
      );
    };

    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      try {
        start(img);
      } catch {
        finish();
      }
    };
    img.onerror = finish;
    img.src = LOGO_WHITE;
    // A cached image can already be complete before onload is wired up.
    if (img.complete && img.naturalWidth > 0) {
      try {
        start(img);
      } catch {
        finish();
      }
    }
    // Never let a stalled image hold the site hostage.
    timers.push(
      window.setTimeout(() => {
        if (!img.complete || img.naturalWidth === 0) finish();
      }, IMAGE_WAIT_MS),
    );

    return () => {
      finished = true;
      cancelAnimationFrame(raf);
      for (const id of timers) clearTimeout(id);
      root.style.overflow = prevOverflow;
    };
  }, []);

  if (!active) return null;

  return (
    <div
      data-preloader=""
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden"
    >
      <div ref={bgRef} className="absolute inset-0" style={{ background: BG }} />
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  );
}
