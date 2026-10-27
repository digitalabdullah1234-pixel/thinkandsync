"use client";

import {
  Children,
  createContext,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useIntroDone } from "@/lib/intro";
import {
  EASE,
  ITEM_DURATION,
  REVEAL_DURATION,
  SETTLE_GRACE_MS,
  VIEWPORT,
  fadeUp,
  staggerContainer,
  useVisibilityFallback,
} from "@/lib/motion";

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}

/**
 * A single fade/slide reveal, played once when 15% of it scrolls into view.
 *
 * Two things guard the end state:
 *   - reduced motion jumps straight to `visible` with no transition, and the
 *     stylesheet pins `[data-reveal]` open from the very first paint;
 *   - `useVisibilityFallback` writes the finished state itself if the
 *     animation never ran.
 */
export function Reveal({ children, className, delay = 0, y = 24 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion() ?? false;
  const introDone = useIntroDone();
  /**
   * Reveals stay parked until the intro overlay has handed over, or the first
   * screen would finish animating behind it and arrive already done. Leaving
   * `whileInView` undefined keeps Motion from even observing the element
   * until that point.
   */
  const armed = introDone && !reduced;
  const variants = useMemo(() => fadeUp(y), [y]);

  useVisibilityFallback(
    ref,
    armed,
    (delay + REVEAL_DURATION) * 1000 + SETTLE_GRACE_MS,
  );

  return (
    <motion.div
      ref={ref}
      data-reveal=""
      className={className}
      variants={variants}
      initial="hidden"
      animate={reduced ? "visible" : undefined}
      whileInView={armed ? "visible" : undefined}
      viewport={VIEWPORT}
      transition={
        reduced
          ? { duration: 0 }
          : { duration: REVEAL_DURATION, delay, ease: EASE }
      }
    >
      {children}
    </motion.div>
  );
}

interface GroupState {
  armed: boolean;
  reduced: boolean;
  settleMs: number;
}

/**
 * Defaults are deliberately "already safe": a stray RevealItem outside a group
 * has no parent variant driving it, so it renders visible and keeps its
 * fallback armed.
 */
const GroupContext = createContext<GroupState>({
  armed: true,
  reduced: false,
  settleMs: 2000,
});

interface RevealGroupProps {
  children: ReactNode;
  className?: string;
  stagger?: number;
}

/**
 * Reveals its RevealItem children one after another. The container holds no
 * visual state of its own — it drives the children through Motion's variant
 * propagation, so `initial`, `whileInView` and the stagger are all declared
 * once, here.
 */
export function RevealGroup({
  children,
  className,
  stagger = 0.1,
}: RevealGroupProps) {
  const reduced = useReducedMotion() ?? false;
  const introDone = useIntroDone();
  const armed = introDone && !reduced;
  const effectiveStagger = reduced ? 0 : stagger;

  const variants = useMemo(
    () => staggerContainer(effectiveStagger),
    [effectiveStagger],
  );

  // Conservative: assumes every child is a RevealItem and that the last one
  // starts at the very end of the stagger, so the fallback never fires early.
  const settleMs =
    (Children.count(children) * effectiveStagger + ITEM_DURATION) * 1000 +
    SETTLE_GRACE_MS;

  const group = useMemo(
    () => ({ armed, reduced, settleMs }),
    [armed, reduced, settleMs],
  );

  return (
    <GroupContext.Provider value={group}>
      <motion.div
        className={className}
        variants={variants}
        initial="hidden"
        animate={reduced ? "visible" : undefined}
        whileInView={armed ? "visible" : undefined}
        viewport={VIEWPORT}
      >
        {children}
      </motion.div>
    </GroupContext.Provider>
  );
}

interface RevealItemProps {
  children: ReactNode;
  className?: string;
  y?: number;
}

/** One member of a RevealGroup. Its timing comes from the group. */
export function RevealItem({ children, className, y = 20 }: RevealItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { armed, reduced, settleMs } = useContext(GroupContext);
  const variants = useMemo(() => fadeUp(y), [y]);

  useVisibilityFallback(ref, armed, settleMs);

  return (
    <motion.div
      ref={ref}
      data-reveal=""
      className={className}
      variants={variants}
      transition={
        reduced ? { duration: 0 } : { duration: ITEM_DURATION, ease: EASE }
      }
    >
      {children}
    </motion.div>
  );
}
