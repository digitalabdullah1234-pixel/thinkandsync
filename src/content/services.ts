import type { Accent, ImageMedia, Localized } from "./types";

/** The built-in live screens a service card can show. */
export type ServiceScreenKey =
  | "software"
  | "cctv"
  | "access"
  | "network"
  | "servers"
  | "wifi"
  | "iptv"
  | "pbx"
  | "cloud"
  | "support";

/** Icons a service can be shown with (Lucide icons, by these names). */
export type ServiceIcon =
  | "code"
  | "camera"
  | "fingerprint"
  | "network"
  | "server"
  | "wifi"
  | "tv"
  | "phone"
  | "cloud"
  | "wrench";

/**
 * The group a service is filed under: a category id. Each category in use
 * gets a tab of its own (see serviceCategories), so a new id here adds a tab.
 */
export type ServiceCategory = string;

export interface CategoryInfo {
  id: ServiceCategory;
  label: Localized;
}

/** Labels and tab order for the known categories. */
export const SERVICE_CATEGORIES: CategoryInfo[] = [
  { id: "software", label: { en: "Software", ar: "البرمجيات" } },
  { id: "infrastructure", label: { en: "Infrastructure", ar: "البنية التحتية" } },
  { id: "security", label: { en: "Security", ar: "الأمن" } },
  { id: "support", label: { en: "Support", ar: "الدعم" } },
];

export interface CategoryTab extends CategoryInfo {
  /** The services filed under it, in list order. */
  services: Service[];
}

/** "cloud-hosting" -> "Cloud hosting": a readable label for a category added without one. */
const labelOf = (id: string) => {
  const words = id.replace(/[-_]+/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

/**
 * The categories the services use, in tab order: the known ones first (in
 * SERVICE_CATEGORIES order), then any others in the order they first appear.
 * Categories with no services get no tab.
 */
export function serviceCategories(services: Service[] = SERVICES): CategoryTab[] {
  const known = new Map(SERVICE_CATEGORIES.map((c) => [c.id, c]));
  const groups = new Map<ServiceCategory, Service[]>();
  for (const service of services) {
    const group = groups.get(service.category);
    if (group) group.push(service);
    else groups.set(service.category, [service]);
  }
  const order = [
    ...SERVICE_CATEGORIES.map((c) => c.id).filter((id) => groups.has(id)),
    ...[...groups.keys()].filter((id) => !known.has(id)),
  ];
  return order.map((id) => {
    const info = known.get(id) ?? { id, label: { en: labelOf(id), ar: labelOf(id) } };
    return { ...info, services: groups.get(id) ?? [] };
  });
}

/** What fills a service card: a photo (the services section uses these), or one of the built-in live screens. */
export type ServiceMedia = { kind: "screen"; screen: ServiceScreenKey } | ImageMedia;

export interface Service {
  /** Stable slug: the key in lists, forms and the admin. */
  id: string;
  title: Localized;
  description: Localized;
  /** Short tags under the card's line (stacks, methods). */
  points: Localized<string[]>;
  /** What a visitor can tick in the contact form once they pick this service. */
  options: Localized<string[]>;
  category: ServiceCategory;
  /** Shown on the card's screen when the service has no media. */
  icon: ServiceIcon;
  /** The card's hover tint. */
  accent: Accent;
  /** A live screen or a picture. Without one, the screen shows the icon. */
  media?: ServiceMedia;
  /** Prefer a large tile, with its live screen, in the services grid. */
  featured?: boolean;
}

/**
 * The services, in display order: the list the site starts with. The admin
 * panel keeps its own copy (data/services.json) once it has been saved; the
 * services section, the contact form's service list and the footer all read
 * that one list.
 */
export const SERVICES: Service[] = [
  {
    id: "web",
    title: { en: "Web Development", ar: "تطوير المواقع" },
    description: {
      en: "Marketing sites, dashboards and commerce platforms built on modern stacks. Performance-first, SEO-ready, instrumented from day one.",
      ar: "مواقع تسويقية ولوحات تحكم ومنصات تجارة إلكترونية مبنية بأحدث التقنيات. الأداء أولًا، جاهزة لمحركات البحث، ومراقَبة من اليوم الأول.",
    },
    points: { en: ["Next.js", "Remix", "Edge"], ar: ["Next.js", "Remix", "Edge"] },
    options: {
      en: ["New website", "Website redesign", "Dashboard or portal", "Online store", "Landing page", "SEO & performance"],
      ar: ["موقع جديد", "إعادة تصميم موقع", "لوحة تحكم أو بوابة", "متجر إلكتروني", "صفحة هبوط", "تحسين محركات البحث والأداء"],
    },
    category: "software",
    icon: "code",
    accent: "software",
    media: {
      kind: "image",
      src: "/services/software.webp",
      alt: { en: "Code on a developer's monitor in a dimly lit studio", ar: "شيفرة برمجية على شاشة مطوّر في غرفة خافتة الإضاءة" },
    },
  },
  {
    id: "mobile",
    title: { en: "Mobile Apps", ar: "تطبيقات الجوال" },
    description: {
      en: "Native-feel iOS and Android products with consistent design language, offline support and release pipelines that ship weekly.",
      ar: "تطبيقات iOS وAndroid بإحساس أصلي ولغة تصميم موحّدة، تعمل دون اتصال، مع خطوط إصدار تُطلق تحديثًا كل أسبوع.",
    },
    points: { en: ["Swift", "Kotlin", "React Native"], ar: ["Swift", "Kotlin", "React Native"] },
    options: {
      en: ["iOS app", "Android app", "iOS and Android", "App redesign", "New features", "Publish to the stores"],
      ar: ["تطبيق iOS", "تطبيق Android", "iOS وAndroid معًا", "إعادة تصميم تطبيق", "ميزات جديدة", "النشر على المتاجر"],
    },
    category: "software",
    icon: "phone",
    accent: "pbx",
    media: {
      kind: "image",
      src: "/services/mobile.webp",
      alt: { en: "A hand holding a smartphone in a stairwell", ar: "يد تمسك هاتفًا ذكيًا على درج" },
    },
  },
  {
    id: "systems",
    title: { en: "Custom Systems", ar: "الأنظمة المخصصة" },
    description: {
      en: "Internal tools, ERPs, booking engines, back-office. We model the domain first, then build the smallest system that changes the outcome.",
      ar: "أدوات داخلية وأنظمة ERP ومحركات حجز وأنظمة إدارة خلفية. نفهم طبيعة عملك أولًا، ثم نبني أصغر نظام يغيّر النتيجة.",
    },
    points: { en: ["Postgres", "Event driven", "Self host"], ar: ["Postgres", "قائم على الأحداث", "استضافة ذاتية"] },
    options: {
      en: ["ERP", "Booking system", "Internal tool", "Back-office", "Integrations & APIs", "Replace an old system"],
      ar: ["نظام ERP", "نظام حجوزات", "أداة داخلية", "نظام إدارة خلفي", "التكاملات وواجهات API", "استبدال نظام قديم"],
    },
    category: "software",
    icon: "server",
    accent: "servers",
    media: {
      kind: "image",
      src: "/services/cloud.webp",
      alt: { en: "Live analytics dashboards on a monitor", ar: "لوحات تحليلات مباشرة على شاشة" },
    },
  },
  {
    id: "ai",
    title: { en: "AI Solutions", ar: "حلول الذكاء الاصطناعي" },
    description: {
      en: "Production-grade LLM features, retrieval pipelines and agentic workflows. We ship evaluated, measurable AI — not demos.",
      ar: "ميزات نماذج لغوية جاهزة للإنتاج، وخطوط استرجاع للمعرفة، وسير عمل بوكلاء أذكياء. نسلّم ذكاءً اصطناعيًا مُقيَّمًا وقابلًا للقياس، لا عروضًا تجريبية.",
    },
    points: { en: ["RAG", "Evals", "Agents"], ar: ["RAG", "التقييم", "الوكلاء الأذكياء"] },
    options: {
      en: ["AI chatbot", "Search our documents (RAG)", "AI agents & automation", "Add AI to our product", "Evaluate an AI feature"],
      ar: ["مساعد محادثة ذكي", "البحث في مستنداتنا (RAG)", "وكلاء أذكياء وأتمتة", "إضافة الذكاء الاصطناعي لمنتجنا", "تقييم ميزة ذكاء اصطناعي"],
    },
    category: "software",
    icon: "cloud",
    accent: "cloud",
    media: {
      kind: "image",
      src: "/services/ai.webp",
      alt: { en: "A glowing green AI chip on a circuit board", ar: "شريحة ذكاء اصطناعي خضراء متوهجة على لوحة إلكترونية" },
    },
  },
];
