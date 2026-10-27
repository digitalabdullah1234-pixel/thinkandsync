import type { Localized } from "./types";

/** The line icons a reason can be shown with. */
export type WhyIcon = "team" | "language" | "group" | "support" | "ai" | "link" | "shield";

/** The section's headline and the words in it drawn in green. */
export interface WhyHeading {
  title: Localized;
  /** Must appear in `title` exactly to be drawn green; otherwise ignored. */
  accent: Localized;
}

/** The headline the site starts with; the admin keeps its own copy (data/why-heading.json) once saved. */
export const WHY_HEADING: WhyHeading = {
  title: { en: "We work as partners, not vendors.", ar: "نعمل كشركاء، لا كمورّدين." },
  accent: { en: "partners", ar: "كشركاء" },
};

/** The icons the admin can pick from, with the name it shows for each. */
export const WHY_ICONS: { id: WhyIcon; label: string }[] = [
  { id: "team", label: "People (team)" },
  { id: "link", label: "Link (connected)" },
  { id: "shield", label: "Shield (security)" },
  { id: "support", label: "Lifebuoy (support)" },
  { id: "language", label: "Languages" },
  { id: "ai", label: "Sparkle (AI)" },
  { id: "group", label: "Building" },
];

/** One reason to work with ThinkSync. */
export interface WhyPoint {
  /** Stable slug: the key in lists and the admin. */
  id: string;
  icon: WhyIcon;
  title: Localized;
  text: Localized;
}

/**
 * The reasons in the "Why us" section, in display order: the list the site
 * starts with; the admin keeps its own copy (data/why.json) once saved. Each one rests on
 * the services ThinkSync actually offers, software and hardware alike; no
 * numbers, clients or outside backers.
 */
export const WHY: WhyPoint[] = [
  {
    id: "one-partner",
    icon: "team",
    title: { en: "One partner, from software to hardware", ar: "شريك واحد من البرمجيات إلى الأجهزة" },
    text: {
      en: "Websites, apps, custom systems and AI in Arabic and English, plus the networks, servers and devices they run on. One team handles all of it.",
      ar: "مواقع وتطبيقات وأنظمة مخصصة وذكاء اصطناعي بالعربية والإنجليزية، ومعها الشبكات والخوادم والأجهزة التي تعمل عليها. فريق واحد يتولى كل ذلك.",
    },
  },
  {
    id: "works-together",
    icon: "link",
    title: { en: "Everything works together", ar: "كل شيء يعمل معًا" },
    text: {
      en: "Cameras, smart locks, attendance devices and building controls connect to your software, so access logs, attendance and alerts land in one place.",
      ar: "الكاميرات والأقفال الذكية وأجهزة الحضور وأنظمة التحكم في المبنى تتصل ببرامجك، فتصل سجلات الدخول والحضور والتنبيهات إلى مكان واحد.",
    },
  },
  {
    id: "secure",
    icon: "shield",
    title: { en: "Secure, and always on", ar: "آمن ويعمل دائمًا" },
    text: {
      en: "Firewalls, encrypted links, segmented networks, high-availability servers and automatic backups keep your business running.",
      ar: "جدران حماية وروابط مشفّرة وشبكات مقسّمة وخوادم عالية التوفر ونسخ احتياطي تلقائي تُبقي عملك مستمرًا.",
    },
  },
  {
    id: "after-launch",
    icon: "support",
    title: { en: "With you after launch", ar: "معك بعد الإطلاق" },
    text: {
      en: "Maintenance, updates and support for your systems and your hardware, from the same team that set them up.",
      ar: "صيانة وتحديثات ودعم لأنظمتك وأجهزتك، من الفريق نفسه الذي أعدّها.",
    },
  },
];
