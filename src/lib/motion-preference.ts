/**
 * Whether the site honours a visitor's "reduce motion" setting.
 *
 * Off, by the owner's decision (2026-10-05): every visitor gets the full
 * animation — the intro, the hero, the live screens and the scroll story —
 * even when their system asks apps for less motion (on Windows that is the
 * "Animation effects" / "Show animations in Windows" switch).
 *
 * Turning this back on restores the reduced-motion behaviour everywhere at
 * once: Motion's useReducedMotion() and MotionConfig, the intro overlay, the
 * site's own hooks (useReduceMotion) and the CSS fallbacks, which key off
 * `<html data-motion="reduce">` (set by a small script in the root layout).
 *
 * Kept free of imports, so the server layout can read it too.
 */
export const HONOUR_REDUCED_MOTION = false;
