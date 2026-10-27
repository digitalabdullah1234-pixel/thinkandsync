"use client";

import { useCallback, useState } from "react";

/** The real wordmark files in /public. Both share a 2.876 aspect ratio. */
export const LOGO_DARK = "/thinksync_blacklogo.png";
export const LOGO_WHITE = "/thinksync_white.png";
export const LOGO_ASPECT = 279 / 97;

interface LogoProps {
  /** "dark" = black wordmark for light backgrounds, "white" = for dark ones. */
  variant?: "dark" | "white";
  className?: string;
}

export function Logo({ variant = "dark", className = "" }: LogoProps) {
  const [failed, setFailed] = useState(false);
  const isDark = variant === "dark";

  // A ref callback rather than an effect: if the image 404s before hydration
  // attaches onError, the browser has already finished and onError never
  // fires, leaving a broken-image icon. `complete && naturalWidth === 0`
  // detects that case at mount.
  const detectBroken = useCallback((img: HTMLImageElement | null) => {
    if (img && img.complete && img.naturalWidth === 0) setFailed(true);
  }, []);

  if (failed) {
    return (
      <span
        className={`font-display text-xl tracking-tight ${
          isDark ? "text-ink" : "text-night-ink"
        } ${className}`}
      >
        Think<span className="text-mint">Sync</span>
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={detectBroken}
      src={isDark ? LOGO_DARK : LOGO_WHITE}
      alt="ThinkSync"
      width={279}
      height={97}
      onError={() => setFailed(true)}
      className={`w-auto object-contain ${className}`}
    />
  );
}
