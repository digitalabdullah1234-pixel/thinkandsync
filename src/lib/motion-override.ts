import { hasReducedMotionListener, prefersReducedMotion } from "framer-motion";
import { HONOUR_REDUCED_MOTION } from "./motion-preference";

/*
 * Motion reads the system's reduced-motion setting once, lazily, into this
 * shared state, and every useReducedMotion() — the site's and the header's —
 * reads it from there. Claiming it first, with "no preference", is how the
 * owner's choice reaches all of them without touching each component.
 *
 * Imported for its side effect by the first client components the layout
 * renders (Preloader, MotionProvider, CustomCursor), so it runs before any
 * component asks.
 */
if (!HONOUR_REDUCED_MOTION) {
  hasReducedMotionListener.current = true;
  prefersReducedMotion.current = false;
}
