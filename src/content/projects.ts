import type { Accent, Localized, Media } from "./types";

export interface Project {
  /** Stable slug: the key in lists and (later) the admin. */
  id: string;
  title: Localized;
  /** Sector and kind of work, e.g. "Banking · Data Center". */
  category: Localized;
  description: Localized;
  tags: Localized<string[]>;
  /**
   * The project's photos and films. The first is its cover, the picture the
   * section shows; the rest are kept for the case study and the admin.
   */
  media: Media[];
  /** A case study or the live site. Without one, the card links to the contact form. */
  link?: string;
  /** The card's hover tint. */
  accent?: Accent;
  /** Plays in the section's big scroll story; the others sit in the "More work" row under it. */
  featured?: boolean;
}

/** How many projects the scroll story shows at most: one screen of scrolling each. */
export const FEATURED_MAX = 4;

/**
 * Splits the list between the scroll story and the "More work" row. The story
 * takes the projects marked featured (the first FEATURED_MAX of them, in list
 * order); with none marked, the first FEATURED_MAX. So however many projects
 * the admin adds, the story never grows past FEATURED_MAX screens.
 */
export function splitWork(list: Project[]) {
  const marked = list.filter((p) => p.featured);
  const story = (marked.length ? marked : list).slice(0, FEATURED_MAX);
  const shown = new Set(story.map((p) => p.id));
  return { story, more: list.filter((p) => !shown.has(p.id)) };
}

/**
 * The projects, in display order. The projects section maps over this list;
 * an empty list shows the section's empty state.
 *
 * These four are samples the owner chose to keep until the real projects are
 * added through the admin panel.
 */
export const PROJECTS: Project[] = [
  {
    id: "riyadh-smart-city-portal",
    title: { en: "Riyadh Smart City Portal", ar: "بوابة الرياض الذكية" },
    category: { en: "Government · Smart City", ar: "حكومي · مدينة ذكية" },
    description: {
      en: "One online portal that links city offices with the people of Riyadh.",
      ar: "بوابة إلكترونية واحدة تربط الجهات البلدية بسكان الرياض.",
    },
    tags: {
      en: ["Next.js", "Node.js", "AWS", "Microservices"],
      ar: ["Next.js", "Node.js", "AWS", "Microservices"],
    },
    media: [
      {
        kind: "video",
        src: "/work/riyadh-smart-city-portal.mp4",
        poster: "/work/riyadh-smart-city-portal-poster.jpg",
        alt: { en: "A city at night, seen from above", ar: "مدينة ليلًا من الأعلى" },
      },
      {
        kind: "image",
        src: "/work/riyadh-smart-city-portal.jpg",
        alt: { en: "The Riyadh skyline at night", ar: "أفق الرياض ليلًا" },
      },
    ],
    accent: "software",
  },
  {
    id: "national-bank-data-center",
    title: { en: "National Bank Data Center", ar: "مركز بيانات البنك الوطني" },
    category: { en: "Banking · Data Center", ar: "قطاع مصرفي · مركز بيانات" },
    description: {
      en: "A tier-III data center with backup power, cooling, and a core network.",
      ar: "مركز بيانات من الفئة الثالثة، مع طاقة وتبريد احتياطيين وشبكة أساسية.",
    },
    tags: {
      en: ["Data Center", "Redundancy", "Virtualization", "Monitoring"],
      ar: ["Data Center", "Redundancy", "Virtualization", "Monitoring"],
    },
    media: [
      {
        kind: "image",
        src: "/work/national-bank-data-center.jpg",
        alt: { en: "A data center hall with cable trays overhead", ar: "قاعة مركز بيانات تعلوها مسارات الكابلات" },
      },
      {
        kind: "video",
        src: "/work/national-bank-data-center.mp4",
        poster: "/work/national-bank-data-center-poster.jpg",
        alt: { en: "An aisle between server racks", ar: "ممر بين خزائن الخوادم" },
      },
    ],
    accent: "servers",
  },
  {
    id: "smart-retail-network",
    title: { en: "Smart Retail Network", ar: "شبكة التجزئة الذكية" },
    category: { en: "Retail · Networking & Security", ar: "تجزئة · شبكات وأمن" },
    description: {
      en: "One network, CCTV, and smart access system for stores across the country.",
      ar: "شبكة واحدة وكاميرات مراقبة ودخول ذكي لفروع المتاجر في أنحاء المملكة.",
    },
    tags: {
      en: ["SD-WAN", "CCTV", "Smart Access", "Multi-site"],
      ar: ["SD-WAN", "CCTV", "Smart Access", "Multi-site"],
    },
    media: [
      {
        kind: "video",
        src: "/work/smart-retail-network.mp4",
        poster: "/work/smart-retail-network-poster.jpg",
        alt: { en: "Shoppers on the escalators of a busy mall", ar: "متسوقون على سلالم مركز تجاري مزدحم" },
      },
      {
        kind: "image",
        src: "/work/smart-retail-network.jpg",
        alt: { en: "A store with digital display screens", ar: "متجر بشاشات عرض رقمية" },
      },
    ],
    accent: "network",
  },
  {
    id: "government-cloud-migration",
    title: { en: "Government Cloud Migration", ar: "ترحيل الجهات الحكومية إلى السحابة" },
    category: { en: "Government · Cloud", ar: "حكومي · سحابة" },
    description: {
      en: "We moved old ministry systems, step by step, to a cloud that meets the rules and passes audits.",
      ar: "نقلنا أنظمة وزارية قديمة إلى السحابة خطوة بخطوة، على منصة تلتزم بالأنظمة وتجتاز التدقيق.",
    },
    tags: {
      en: ["Cloud Migration", "Kubernetes", "CI/CD", "Compliance"],
      ar: ["Cloud Migration", "Kubernetes", "CI/CD", "Compliance"],
    },
    media: [
      {
        kind: "image",
        src: "/work/government-cloud-migration.jpg",
        alt: { en: "Engineers at their desks in an open office", ar: "مهندسون على مكاتبهم في مكتب مفتوح" },
      },
      {
        kind: "video",
        src: "/work/government-cloud-migration.mp4",
        poster: "/work/government-cloud-migration-poster.jpg",
        alt: { en: "Code scrolling on a screen", ar: "شيفرة برمجية على شاشة" },
      },
    ],
    accent: "cloud",
  },
];
