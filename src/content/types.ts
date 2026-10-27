import type { Lang } from "@/lib/translations";

/**
 * Shapes shared by the site's content lists (services, projects).
 *
 * The lists are plain data: one entry per item, every piece of text in both
 * languages. The sections only map over them, so the admin panel (phase 2)
 * can replace each list with its collection without touching the layout.
 */

/** Text in both site languages. */
export type Localized<T = string> = Record<Lang, T>;

/**
 * The brand's ten accent colours (the --color-acc-* tokens in globals.css).
 * A card takes one as the tint it shows on hover.
 */
export type Accent =
  | "software"
  | "cloud"
  | "network"
  | "wifi"
  | "servers"
  | "cctv"
  | "access"
  | "iptv"
  | "pbx"
  | "support";

/** A picture in place of a built-in live screen. */
export interface ImageMedia {
  kind: "image";
  /** A file under /public (e.g. "/work/riyadh-portal.webp"). */
  src: string;
  alt: Localized;
}

/** A short, silent film that loops while it is on screen. */
export interface VideoMedia {
  kind: "video";
  /** A file under /public (e.g. "/work/riyadh-portal.mp4"). */
  src: string;
  /** The still shown before the film has loaded, and while it is paused. */
  poster: string;
  alt: Localized;
}

/** A photo or a film: what fills a project's picture. */
export type Media = ImageMedia | VideoMedia;
