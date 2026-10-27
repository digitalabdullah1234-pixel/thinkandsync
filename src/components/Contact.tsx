"use client";

import { useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, Check } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import type { Service } from "@/content/services";
import { inquiryForm as F, inquiryHeading as H, inquirySentence as S } from "@/content/inquiry";
import { EASE } from "@/lib/motion";
import { Reveal } from "./Reveal";
import { SectionHeading } from "./SectionHeading";
import styles from "./contact/Contact.module.css";

type Status = "idle" | "sending" | "success" | "error";

const EMPTY = { name: "", company: "", phone: "", notes: "" };

/**
 * Start a project: the form written as one sentence on a white ground,
 * "Hi, I'm ___ from ___. You can call me on ___. I need help with ___.",
 * then the picked service's kinds of request as chips, the notes, and send.
 * Name, phone and a service are required; company and notes are not.
 */
export function Contact({ services }: { services: Service[] }) {
  const { lang } = useLanguage();
  const [status, setStatus] = useState<Status>("idle");
  const [form, setForm] = useState(EMPTY);
  const [service, setService] = useState("");
  const [picked, setPicked] = useState<number[]>([]);
  const chosen = services.find((s) => s.id === service);
  const options = chosen?.options?.[lang] ?? [];

  const pick = (id: string) => {
    setService(id);
    setPicked([]);
  };
  const toggle = (i: number) => setPicked((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]));
  const bind = (key: keyof typeof EMPTY) => ({
    value: form[key],
    onChange: (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Sent in English whatever the page language, so the team reads one set of names.
        body: JSON.stringify({
          ...form,
          service: chosen?.title.en ?? "",
          options: picked.map((i) => chosen?.options?.en[i]).filter(Boolean),
        }),
      });
      if (!res.ok) throw new Error("Request failed");
      setStatus("success");
      setForm(EMPTY);
      setService("");
      setPicked([]);
    } catch {
      setStatus("error");
    }
  };

  return (
    <section id="contact" className={styles.section}>
      <div className={`shell ${styles.shell}`}>
        <SectionHeading eyebrow={H.eyebrow[lang]} title={H.title[lang]} accent={H.accent[lang]} tone="light" />

        <Reveal delay={0.15}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <p className={styles.sentence}>
              {S.hi[lang]}{" "}
              <input {...bind("name")} aria-label={F.name[lang]} required autoComplete="name" placeholder={F.namePh[lang]} className={`${styles.blank} ${styles.name}`} /> {S.from[lang]}{" "}
              <input {...bind("company")} aria-label={F.company[lang]} autoComplete="organization" placeholder={F.companyPh[lang]} className={`${styles.blank} ${styles.company}`} />. {S.call[lang]}{" "}
              <input {...bind("phone")} aria-label={F.phone[lang]} required type="tel" autoComplete="tel" dir="ltr" placeholder={F.phonePh[lang]} className={`${styles.blank} ${styles.phone}`} />. {S.need[lang]}{" "}
              <span style={{ whiteSpace: "nowrap" }}>
              <select aria-label={F.service[lang]} required value={service} onChange={(e) => pick(e.target.value)} className={`${styles.blank} ${styles.select}`}>
                <option value="">{F.service[lang]}…</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title[lang]}
                  </option>
                ))}
              </select>
              .
              </span>
            </p>

            {(!service || options.length > 0) && (
            <div className={styles.group} role="group" aria-label={F.options[lang]}>
              <div className={styles.labelRow}>
                <span className={styles.label}>{F.options[lang]}</span>
                <span className={styles.hint}>{service ? F.optionsHint[lang] : ""}</span>
              </div>
              <AnimatePresence mode="wait" initial={false}>
                {service ? (
                  <motion.div key={service} className={styles.chips} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3, ease: EASE }}>
                    {options.map((o, i) => {
                      const on = picked.includes(i);
                      return (
                        <motion.button key={o} type="button" aria-pressed={on} onClick={() => toggle(i)} whileTap={{ scale: 0.97 }} className={styles.chip}>
                          {on && <Check size={14} strokeWidth={3} aria-hidden />}
                          {o}
                        </motion.button>
                      );
                    })}
                  </motion.div>
                ) : (
                  <motion.p key="none" className={styles.empty} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    {F.pickFirst[lang]}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
            )}

            <div className={styles.group}>
              <label htmlFor="contact-notes" className={styles.label}>
                {F.notes[lang]} <span style={{ textTransform: "none", letterSpacing: 0, fontWeight: 400 }}>({F.optional[lang]})</span>
              </label>
              <textarea id="contact-notes" {...bind("notes")} rows={2} placeholder={F.notesPh[lang]} className={styles.notes} />
            </div>

            <div style={{ display: "grid", gap: ".7rem", justifyItems: "start" }}>
              <motion.button type="submit" disabled={status === "sending"} whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} className={styles.send}>
                {status === "sending" ? F.sending[lang] : F.submit[lang]}
                <ArrowUpRight size={18} strokeWidth={2} aria-hidden className="rtl:-scale-x-100" />
              </motion.button>
              <p className={styles.consent}>
                {F.consentBefore[lang]}
                <Link href="/privacy">{F.consentLink[lang]}</Link>
                {F.consentAfter[lang]}
              </p>
              <AnimatePresence>
                {(status === "success" || status === "error") && (
                  <motion.p role="status" className={styles.status} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35, ease: EASE }} style={{ color: status === "success" ? "#0b7c43" : "#c4372f" }}>
                    {status === "success" ? F.success[lang] : F.error[lang]}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </form>
        </Reveal>
      </div>
    </section>
  );
}
