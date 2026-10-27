import { SERVICES } from "./services";
import type { Localized } from "./types";

/**
 * The "Start a project" form: its heading, field labels, and for each service
 * (by its id in SERVICES) the kinds of request a visitor can tick once they
 * pick it.
 */

export const inquiryHeading: { eyebrow: Localized; title: Localized; accent: Localized; intro: Localized } = {
  eyebrow: { en: "Get in touch", ar: "تواصل معنا" },
  title: { en: "Start a project", ar: "ابدأ مشروعك" },
  accent: { en: "project", ar: "مشروعك" },
  intro: {
    en: "Tell us who you are and what you need. Our team will call you back within one business day.",
    ar: "أخبرنا من أنت وما الذي تحتاجه، وسيتصل بك فريقنا خلال يوم عمل واحد.",
  },
};

export const inquiryForm = {
  name: { en: "Full name", ar: "الاسم الكامل" },
  namePh: { en: "Your name", ar: "اسمك" },
  company: { en: "Company name", ar: "اسم الشركة" },
  companyPh: { en: "Your company", ar: "اسم شركتك" },
  phone: { en: "Phone number", ar: "رقم الجوال" },
  phonePh: { en: "+966 5X XXX XXXX", ar: "+966 5X XXX XXXX" },
  service: { en: "Select a service", ar: "اختر الخدمة" },
  options: { en: "What do you need?", ar: "ما الذي تحتاجه؟" },
  optionsHint: { en: "Pick one or more", ar: "اختر واحدًا أو أكثر" },
  pickFirst: { en: "Pick a service to see the options", ar: "اختر خدمة لتظهر الخيارات" },
  notes: { en: "Notes", ar: "ملاحظات" },
  notesPh: { en: "Anything else we should know: site, timeline, number of branches…", ar: "أي تفاصيل أخرى: الموقع، المدة، عدد الفروع…" },
  optional: { en: "optional", ar: "اختياري" },
  submit: { en: "Send request", ar: "إرسال الطلب" },
  sending: { en: "Sending…", ar: "جارٍ الإرسال…" },
  // The note under the button, with "privacy policy" linked to /privacy.
  consentBefore: { en: "By submitting, you agree to our ", ar: "بإرسال الطلب، فإنك توافق على " },
  consentLink: { en: "privacy policy", ar: "سياسة الخصوصية" },
  consentAfter: { en: ". We never share details with third parties.", ar: ". لا نشارك بياناتك مع أي طرف ثالث أبدًا." },
  success: { en: "Thank you. Our team will call you within one business day.", ar: "شكرًا لك. سيتصل بك فريقنا خلال يوم عمل واحد." },
  error: { en: "Something went wrong. Please try again or call us.", ar: "حدث خطأ ما. حاول مرة أخرى أو اتصل بنا." },
} satisfies Record<string, Localized>;

/** The form read as one sentence: "Hi, I'm ___ from ___. You can call me on ___. I need help with ___." */
export const inquirySentence = {
  hi: { en: "Hi, I’m", ar: "مرحبًا، أنا" },
  from: { en: "from", ar: "من" },
  call: { en: "You can call me on", ar: "يمكنكم الاتصال بي على" },
  need: { en: "I need help with", ar: "أحتاج مساعدة في" },
} satisfies Record<string, Localized>;

/** What a visitor can ask for under each service, keyed by service id (each service carries its own list). */
export const SERVICE_OPTIONS: Record<string, Localized<string[]>> = Object.fromEntries(SERVICES.map((s) => [s.id, s.options]));
