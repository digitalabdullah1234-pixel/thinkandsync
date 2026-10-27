export type Lang = "en" | "ar";

export interface StoryStep {
  title: string;
  text: string;
}

export interface SiteContent {
  nav: {
    services: string;
    projects: string;
    process: string;
    contact: string;
    quote: string;
  };
  hero: {
    /** Sits above the headline, naming the parent group. */
    eyebrow: string;
    headlinePrefix: string;
    headlineAccent: string;
    headlineSuffix: string;
    subheading: string;
    /** Accessible name for the laptop lid toggle, in each state. */
    laptopOpenLabel: string;
    laptopCloseLabel: string;
    /** Accessible name for the scroll cue at the foot of the hero. */
    scrollCue: string;
    /** Label beside the moving logo band at the foot of the hero. */
    brandsLabel: string;
  };
  services: {
    eyebrow: string;
    title: string;
    /** The substring of `title` drawn in green with an underline. */
    titleAccent: string;
    /** Opens the intro; the names of the admin's services follow it. */
    introLead: string;
    /** The first category tab, showing every service. */
    all: string;
    /** Accessible name for the row of category tabs. */
    categoriesLabel: string;
  };
  projects: {
    eyebrow: string;
    title: string;
    /** The substring of `title` drawn in green with an underline. */
    titleAccent: string;
    intro: string;
    /** Per-card link to the contact form. */
    ctaSimilar: string;
    /** Per-card link when a project has its own page or site. */
    ctaView: string;
    /** Accessible names for the films' pause button, in each state. */
    pauseLabel: string;
    playLabel: string;
    /** The tag on each picture: what it is. */
    kinds: { video: string; image: string };
    /** Shown in place of the projects while there are none. */
    empty: { title: string; text: string; cta: string };
    /** The row of the other projects under the scroll story, and the window a project opens in. */
    more: { title: string; prev: string; next: string; open: string; close: string };
  };
  /** The "Why us" section's heading; its reasons come from the admin's list. */
  why: {
    eyebrow: string;
    title: string;
    /** The substring of `title` drawn in green with an underline. */
    titleAccent: string;
  };
  story: {
    eyebrow: string;
    title: string;
    /** The substring of `title` drawn in the accent. */
    titleAccent: string;
    steps: StoryStep[];
    cta: string;
    /** The corner label while the office is a plan, and once it is built. */
    blueprintLabel: string;
    builtLabel: string;
  };
  contact: {
    eyebrow: string;
    title: string;
    /** The substring of `title` drawn in green with an underline. */
    titleAccent: string;
    intro: string;
    form: {
      name: string;
      namePlaceholder: string;
      contact: string;
      contactPlaceholder: string;
      service: string;
      servicePlaceholder: string;
      message: string;
      messagePlaceholder: string;
      submit: string;
      sending: string;
      success: string;
      error: string;
    };
    info: {
      title: string;
      email: string;
      phone: string;
      location: string;
      locationValue: string;
    };
  };
  footer: {
    /** The studio: its label and city. */
    studio: string;
    city: string;
    /** The name in the © line. */
    company: string;
    /** The button back to the top of the page. */
    top: string;
    /** The link to the privacy policy. */
    privacy: string;
    /** Names the sliding row of services. */
    servicesHeading: string;
    /** The rest are used only by the footer labs. */
    tagline: string;
    companyHeading: string;
    contactHeading: string;
    vision: string;
    rights: string;
  };
}

export const content: Record<Lang, SiteContent> = {
  en: {
    nav: {
      services: "Services",
      projects: "Our work",
      process: "Process",
      contact: "Contact",
      quote: "Get project quote",
    },
    hero: {
      eyebrow: "The technology arm of Mind Destiny Holding",
      headlinePrefix: "Where idea meets ",
      headlineAccent: "technology",
      headlineSuffix: ".",
      subheading:
        "Digital solutions, smart systems, and operational platforms — plus the networking, servers, and cabling that power them. All under one roof, across the Kingdom.",
      laptopOpenLabel: "Open the laptop lid",
      laptopCloseLabel: "Close the laptop lid",
      scrollCue: "Scroll to services",
      brandsLabel: "Brands we work with",
    },
    services: {
      eyebrow: "What we do",
      title: "Everything your business runs on.",
      titleAccent: "runs on",
      introLead: "One team for the software your business runs on:",
      all: "All",
      categoriesLabel: "Service categories",
    },
    projects: {
      eyebrow: "Selected work",
      title: "Our work",
      titleAccent: "work",
      intro:
        "Some of the platforms and networks we have built across the Kingdom.",
      ctaSimilar: "Discuss a similar project",
      ctaView: "View project",
      pauseLabel: "Pause video",
      playLabel: "Play video",
      kinds: { video: "Video", image: "Photo" },
      empty: {
        title: "New case studies are on the way.",
        text: "We are putting our latest work together. Ask us for references in the meantime.",
        cta: "Ask for references",
      },
      more: { title: "More work", prev: "Previous", next: "Next", open: "Open project", close: "Close" },
    },
    why: {
      eyebrow: "Why us",
      title: "We work as partners, not vendors.",
      titleAccent: "partners",
    },
    story: {
      eyebrow: "How it comes together",
      title: "From a blueprint to a smart office.",
      titleAccent: "smart office",
      steps: [
        { title: "The plan", text: "Every smart office starts as a blueprint." },
        { title: "Structured cabling", text: "Cables run through every ceiling and floor." },
        { title: "Servers & network", text: "The rack and the core network slide into place." },
        { title: "Security", text: "Cameras and smart access on every door." },
        { title: "Wi-Fi & workspaces", text: "Every desk and every device gets connected." },
        { title: "Software", text: "The screens light up with the apps we build." },
        { title: "Cloud & support", text: "Linked to the cloud, and looked after by one team." },
      ],
      cta: "Start a project",
      blueprintLabel: "Blueprint · Client office",
      builtLabel: "Built · by ThinkSync",
    },
    contact: {
      eyebrow: "Get in touch",
      title: "Start a project",
      titleAccent: "project",
      intro:
        "Tell us about your goals and our team will respond within one business day.",
      form: {
        name: "Full name",
        namePlaceholder: "Your name",
        contact: "Email or WhatsApp",
        contactPlaceholder: "you@company.com",
        service: "Service needed",
        servicePlaceholder: "Select a service",
        message: "Project details",
        messagePlaceholder: "Tell us about your project and timeline",
        submit: "Send request",
        sending: "Sending…",
        success:
          "Thank you — our team will be in touch within one business day.",
        error:
          "Something went wrong. Please try again or contact us directly.",
      },
      info: {
        title: "Direct contact",
        email: "info@thinksync.sa",
        phone: "+966 11 000 0000",
        location: "Headquarters",
        locationValue: "Riyadh, Saudi Arabia",
      },
    },
    footer: {
      studio: "Studio",
      city: "Medina",
      company: "ThinkSync Company",
      top: "Back to top",
      privacy: "Privacy policy",
      tagline:
        "Web, mobile, custom systems and AI, built in Riyadh for Saudi business.",
      servicesHeading: "Services",
      companyHeading: "Company",
      contactHeading: "Contact",
      vision: "Aligned with Saudi Vision 2030",
      rights: "All rights reserved.",
    },
  },
  ar: {
    nav: {
      services: "الخدمات",
      projects: "أعمالنا",
      process: "منهجية العمل",
      contact: "تواصل معنا",
      quote: "احصل على عرض سعر",
    },
    hero: {
      eyebrow: "الذراع التقنية لشركة مايند ديستني القابضة",
      headlinePrefix: "حيث تلتقي الفكرة ",
      headlineAccent: "بالتقنية",
      /* No full stop, unlike the English. A trailing Latin period after Arabic
         is placed at the logical end of the run, which in RTL is the far LEFT
         of the line — it reads as a stray mark floating away from the words. */
      headlineSuffix: "",
      subheading:
        "حلول رقمية وأنظمة ذكية ومنصات تشغيلية، إلى جانب الشبكات والخوادم والتمديدات التي تشغّلها. كل ذلك تحت سقف واحد، في أنحاء المملكة.",
      laptopOpenLabel: "افتح غطاء الحاسوب",
      laptopCloseLabel: "أغلق غطاء الحاسوب",
      scrollCue: "انتقل إلى الخدمات",
      brandsLabel: "علامات نعمل معها",
    },
    services: {
      eyebrow: "ما نقدمه",
      title: "كل ما يقوم عليه عملك.",
      titleAccent: "يقوم عليه",
      introLead: "فريق واحد لكل البرمجيات التي يقوم عليها عملك:",
      all: "الكل",
      categoriesLabel: "فئات الخدمات",
    },
    projects: {
      eyebrow: "أعمال مختارة",
      title: "أعمالنا",
      titleAccent: "أعمالنا",
      intro:
        "بعض المنصات والشبكات التي نفّذناها في أنحاء المملكة.",
      ctaSimilar: "ناقش مشروعًا مشابهًا",
      ctaView: "عرض المشروع",
      pauseLabel: "إيقاف الفيديو",
      playLabel: "تشغيل الفيديو",
      kinds: { video: "فيديو", image: "صورة" },
      empty: {
        title: "دراسات حالة جديدة قريبًا.",
        text: "نعمل على تجهيز أحدث أعمالنا. اطلب منا مراجع في هذه الأثناء.",
        cta: "اطلب مراجع",
      },
      more: { title: "المزيد من أعمالنا", prev: "السابق", next: "التالي", open: "افتح المشروع", close: "إغلاق" },
    },
    why: {
      eyebrow: "لماذا نحن",
      title: "نعمل كشركاء، لا كمورّدين.",
      titleAccent: "كشركاء",
    },
    story: {
      eyebrow: "كيف يكتمل العمل",
      title: "من المخطط إلى مكتب ذكي.",
      titleAccent: "مكتب ذكي",
      steps: [
        { title: "المخطط", text: "كل مكتب ذكي يبدأ بمخطط." },
        { title: "الكابلات المهيكلة", text: "تمتد الكابلات في كل سقف وأرضية." },
        { title: "الخوادم والشبكة", text: "تُركَّب الخزانة والشبكة الأساسية في مكانها." },
        { title: "الأمن", text: "كاميرات وتحكم ذكي بالدخول على كل باب." },
        { title: "Wi-Fi ومساحات العمل", text: "كل مكتب وكل جهاز متصل." },
        { title: "البرمجيات", text: "تضيء الشاشات بالتطبيقات التي نبنيها." },
        { title: "السحابة والدعم", text: "متصل بالسحابة، ويرعاه فريق واحد." },
      ],
      cta: "ابدأ مشروعك",
      blueprintLabel: "مخطط · مكتب العميل",
      builtLabel: "تم التنفيذ · بواسطة ThinkSync",
    },
    contact: {
      eyebrow: "تواصل معنا",
      title: "ابدأ مشروعك",
      titleAccent: "مشروعك",
      intro: "أخبرنا عن أهدافك وسيتواصل معك فريقنا خلال يوم عمل واحد.",
      form: {
        name: "الاسم الكامل",
        namePlaceholder: "اسمك",
        contact: "البريد الإلكتروني أو واتساب",
        contactPlaceholder: "you@company.com",
        service: "الخدمة المطلوبة",
        servicePlaceholder: "اختر الخدمة",
        message: "تفاصيل المشروع",
        messagePlaceholder: "أخبرنا عن مشروعك والجدول الزمني",
        submit: "إرسال الطلب",
        sending: "جارٍ الإرسال…",
        success: "شكرًا لك — سيتواصل معك فريقنا خلال يوم عمل واحد.",
        error: "حدث خطأ ما. يرجى المحاولة مرة أخرى أو التواصل معنا مباشرة.",
      },
      info: {
        title: "التواصل المباشر",
        email: "info@thinksync.sa",
        phone: "+966 11 000 0000",
        location: "المقر الرئيسي",
        locationValue: "الرياض، المملكة العربية السعودية",
      },
    },
    footer: {
      studio: "الاستوديو",
      city: "المدينة المنورة",
      company: "شركة ThinkSync",
      top: "العودة للأعلى",
      privacy: "سياسة الخصوصية",
      tagline: "الويب والجوال والأنظمة المخصصة والذكاء الاصطناعي، نبنيها في الرياض للأعمال السعودية.",
      servicesHeading: "الخدمات",
      companyHeading: "الشركة",
      contactHeading: "تواصل",
      vision: "بما يتماشى مع رؤية السعودية 2030",
      rights: "جميع الحقوق محفوظة.",
    },
  },
};
