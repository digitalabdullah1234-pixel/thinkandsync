import type { Localized } from "./types";

/** One part of the privacy policy: a heading and its paragraphs. */
export interface PolicySection {
  /** Stable slug: the part's anchor (#who-we-are). */
  id: string;
  title: Localized;
  body: Localized<string[]>;
}

/**
 * The privacy policy, after the old ThinkSync site's. Facts changed with the
 * new site: the contact form asks for a phone number (not an email), requests
 * are emailed to the team through an email service and also kept on our own
 * server, and the browser keeps only the language.
 */
export const PRIVACY = {
  title: { en: "Privacy Policy", ar: "سياسة الخصوصية" },
  updatedLabel: { en: "Last updated", ar: "آخر تحديث" },
  updated: { en: "27 October 2026", ar: "27 أكتوبر 2026" },
  intro: {
    en: "ThinkSync respects your privacy. This page describes what we collect, why, and how to get in touch.",
    ar: "تحترم ThinkSync خصوصيتك. توضّح هذه الصفحة ما نجمعه، ولماذا، وكيف تتواصل معنا.",
  },
  contents: { en: "On this page", ar: "في هذه الصفحة" },
  ask: {
    title: { en: "Questions about your privacy?", ar: "لديك سؤال عن خصوصيتك؟" },
    text: { en: "Write to us and the team will reply.", ar: "راسلنا وسيرد عليك الفريق." },
  },
} satisfies Record<string, Localized | Record<string, Localized>>;

export const POLICY: PolicySection[] = [
  {
    id: "who-we-are",
    title: { en: "Who we are", ar: "من نحن" },
    body: {
      en: ["ThinkSync is a software studio based in Medina, Saudi Arabia.", "For any privacy questions, write to info@thinksync.sa."],
      ar: ["ThinkSync استوديو برمجيات مقرّه المدينة المنورة في المملكة العربية السعودية.", "لأي استفسار عن الخصوصية، راسلنا على info@thinksync.sa."],
    },
  },
  {
    id: "what-we-collect",
    title: { en: "What we collect", ar: "ما الذي نجمعه" },
    body: {
      en: [
        "Through the contact form on this site we receive your name, phone number, optional company name, the service you pick and the options you tick, and any details you choose to share.",
        "That is the only data we collect. This site uses no analytics, no ad pixels, and no third-party trackers.",
      ],
      ar: [
        "من خلال نموذج التواصل في هذا الموقع نستلم اسمك، ورقم هاتفك، واسم شركتك (اختياري)، والخدمة التي تختارها والخيارات التي تحددها، وأي تفاصيل تختار مشاركتها.",
        "هذه هي البيانات الوحيدة التي نجمعها. لا يستخدم هذا الموقع أدوات تحليل، ولا بكسلات إعلانية، ولا أدوات تتبّع من أطراف ثالثة.",
      ],
    },
  },
  {
    id: "how-we-use-it",
    title: { en: "How we use what you submit", ar: "كيف نستخدم ما ترسله" },
    body: {
      en: ["To respond to your inquiry, usually within 24 hours.", "We do not add you to mailing lists, sell your information, or share it with third parties."],
      ar: ["للرد على طلبك، عادةً خلال 24 ساعة.", "لا نضيفك إلى قوائم بريدية، ولا نبيع معلوماتك، ولا نشاركها مع أي طرف ثالث."],
    },
  },
  {
    id: "browser-storage",
    title: { en: "Browser storage", ar: "التخزين في المتصفح" },
    body: {
      en: ["We store one preference in your browser's local storage: the language you chose (English or Arabic). This data stays on your device and is never sent to us."],
      ar: ["نحفظ تفضيلًا واحدًا في التخزين المحلي لمتصفحك: اللغة التي اخترتها (العربية أو الإنجليزية). تبقى هذه البيانات على جهازك ولا تُرسل إلينا أبدًا."],
    },
  },
  {
    id: "email-delivery",
    title: { en: "Email delivery", ar: "إرسال البريد" },
    body: {
      en: [
        "Contact-form submissions are emailed to info@thinksync.sa through our email service provider, which processes the message solely for the purpose of delivery.",
        "A copy is also kept on our own server, read only by the ThinkSync team. Neither is used for marketing.",
      ],
      ar: [
        "تُرسل طلبات نموذج التواصل إلى info@thinksync.sa عبر مزوّد خدمة البريد لدينا، الذي يعالج الرسالة لغرض توصيلها فقط.",
        "وتُحفظ نسخة منها أيضًا على خادمنا الخاص، ولا يطّلع عليها إلا فريق ThinkSync. ولا يُستخدم أيٌّ منهما للتسويق.",
      ],
    },
  },
  {
    id: "retention",
    title: { en: "Retention", ar: "مدة الاحتفاظ" },
    body: {
      en: ["We keep contact-form messages for as long as the conversation is active. Write to info@thinksync.sa if you would like yours deleted."],
      ar: ["نحتفظ برسائل نموذج التواصل ما دامت المحادثة قائمة. راسلنا على info@thinksync.sa إذا أردت حذف رسالتك."],
    },
  },
  {
    id: "your-rights",
    title: { en: "Your rights", ar: "حقوقك" },
    body: {
      en: ["You can request a copy of the information we hold, correct it, or ask us to delete it. Email info@thinksync.sa and we will action your request within 30 days."],
      ar: ["يمكنك طلب نسخة من المعلومات التي نحتفظ بها، أو تصحيحها، أو حذفها. راسلنا على info@thinksync.sa وسننفّذ طلبك خلال 30 يومًا."],
    },
  },
  {
    id: "changes",
    title: { en: "Changes to this policy", ar: "التغييرات على هذه السياسة" },
    body: {
      en: ["If we change this policy, we will update the “last updated” date at the top of this page."],
      ar: ["إذا غيّرنا هذه السياسة، سنحدّث تاريخ «آخر تحديث» في أعلى هذه الصفحة."],
    },
  },
];
