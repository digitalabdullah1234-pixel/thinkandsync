import type { Localized } from "./types";

/**
 * The process section: six phases, each with the step the software track
 * takes and the step the hardware track takes. No numbers, no client names:
 * only what the work is. The admin panel (phase 2) can replace this list.
 */

export interface ProcessStep {
  title: Localized;
  text: Localized;
}

export interface ProcessPhase {
  name: Localized;
  software: ProcessStep;
  hardware: ProcessStep;
}

export const processHeading: { eyebrow: Localized; title: Localized; accent: Localized; intro: Localized } = {
  eyebrow: { en: "Our process", ar: "طريقة عملنا" },
  title: { en: "We design it, build it, install it, and keep it running.", ar: "نصمّم، ونبني، ونركّب، ونتابع التشغيل." },
  accent: { en: "keep it running", ar: "نتابع التشغيل" },
  intro: {
    en: "Every project runs on two tracks at once: the websites and apps we design, develop and deploy, and the networks, servers, cameras and cabling we survey, supply and install. One team plans both, so they go live together.",
    ar: "كل مشروع يسير على مسارين معًا: المواقع والتطبيقات التي نصمّمها ونطوّرها ونطلقها، والشبكات والخوادم والكاميرات والتمديدات التي نعاينها ونورّدها ونركّبها. فريق واحد يخطّط للاثنين، فينطلقان معًا.",
  },
};

export const processPhases: ProcessPhase[] = [
  {
    name: { en: "Plan", ar: "التخطيط" },
    software: { title: { en: "Discovery", ar: "الاكتشاف" }, text: { en: "We sit with you, map the workflow and agree what to build.", ar: "نجلس معك، نرسم سير العمل ونتفق على ما سنبنيه." } },
    hardware: { title: { en: "Site survey", ar: "معاينة الموقع" }, text: { en: "We walk the site: rooms, ceilings, power, and where every point goes.", ar: "نعاين الموقع: الغرف والأسقف والكهرباء ومكان كل نقطة." } },
  },
  {
    name: { en: "Design", ar: "التصميم" },
    software: { title: { en: "UI/UX design", ar: "تصميم الواجهات" }, text: { en: "Wireframes, then screens you can click through before any code.", ar: "مخططات أولية، ثم شاشات تتنقل بينها قبل كتابة أي كود." } },
    hardware: { title: { en: "System design", ar: "تصميم الأنظمة" }, text: { en: "Network, camera and access layouts drawn up and agreed.", ar: "مخططات الشبكة والكاميرات والدخول تُرسم ويُتفق عليها." } },
  },
  {
    name: { en: "Build", ar: "التنفيذ" },
    software: { title: { en: "Development", ar: "التطوير" }, text: { en: "Web and mobile apps built in short sprints you see as they grow.", ar: "تطبيقات الويب والجوال تُبنى على مراحل قصيرة تراها وهي تكبر." } },
    hardware: { title: { en: "Supply & install", ar: "التوريد والتركيب" }, text: { en: "Switches, servers, cameras and cabling supplied, fitted and labelled.", ar: "المحوّلات والخوادم والكاميرات والتمديدات تُورَّد وتُركَّب وتُرقَّم." } },
  },
  {
    name: { en: "Test", ar: "الاختبار" },
    software: { title: { en: "Testing", ar: "الاختبار" }, text: { en: "Every screen and role checked on real devices, in Arabic and English.", ar: "كل شاشة وكل صلاحية تُختبر على أجهزة حقيقية بالعربية والإنجليزية." } },
    hardware: { title: { en: "Configure & test", ar: "الضبط والاختبار" }, text: { en: "Every port, camera and access point configured and tested.", ar: "كل منفذ وكاميرا ونقطة اتصال تُضبط وتُختبر." } },
  },
  {
    name: { en: "Launch", ar: "الإطلاق" },
    software: { title: { en: "Deployment", ar: "النشر" }, text: { en: "Released to the cloud or your own servers.", ar: "يُطلق على السحابة أو على خوادمك." } },
    hardware: { title: { en: "Handover", ar: "التسليم" }, text: { en: "Switched on and handed over with full documentation.", ar: "يُشغَّل ويُسلَّم مع التوثيق الكامل." } },
  },
  {
    name: { en: "Support", ar: "الدعم" },
    software: { title: { en: "Updates", ar: "التحديثات" }, text: { en: "Fixes, updates and new features after launch.", ar: "إصلاحات وتحديثات وميزات جديدة بعد الإطلاق." } },
    hardware: { title: { en: "Maintenance", ar: "الصيانة" }, text: { en: "Monitoring, planned visits, and help when you need it.", ar: "مراقبة وزيارات دورية ومساندة عند الحاجة." } },
  },
];
