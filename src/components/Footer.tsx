"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { ArrowUp } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { serviceCategories, type Service } from "@/content/services";
import { EASE } from "@/lib/motion";
import { Marquee } from "./footer/Marquee";
import { Reveal } from "./Reveal";
import styles from "./footer/Footer.module.css";

/** Under the mouse (or the keyboard) an outlined service name fills green. */
const FILL = { rest: { color: "#ffffff" }, hover: { color: "#0b7c43" } };
const LINE = { rest: { scaleX: 0 }, hover: { scaleX: 1 } };

/**
 * The footer, after the old ThinkSync one: the wordmark, the studio in Medina
 * and the email, then the services sliding by without end, each one a way to
 * the services section. The services are the admin's list, in the order the
 * services section shows them.
 */
export function Footer({ services }: { services: Service[] }) {
  const { t, lang, dir } = useLanguage();
  const { footer } = t;
  const email = t.contact.info.email;
  const year = new Date().getFullYear();
  const list = useMemo(() => serviceCategories(services).flatMap((c) => c.services), [services]);
  const servicesHref = usePathname() === "/" ? "#services" : "/#services";

  return (
    <footer className={styles.footer}>
      <Reveal className={`shell ${styles.head}`}>
        <span dir="ltr" role="img" aria-label="ThinkSync" className={styles.word}>
          thinksync
          <i aria-hidden />
        </span>

        <div className={styles.studio}>
          <span className={styles.label}>{footer.studio}</span>
          <span className={styles.city}>{footer.city}</span>
          <motion.a href={`mailto:${email}`} dir="ltr" className={styles.mail} initial="rest" animate="rest" whileHover="hover" whileFocus="hover">
            <span>
              {email}
              <motion.span aria-hidden className={styles.underline} variants={LINE} transition={{ duration: 0.45, ease: EASE }} />
            </span>
          </motion.a>
        </div>
      </Reveal>

      {list.length > 0 && (
        <nav aria-label={footer.servicesHeading}>
          <Marquee
            className={styles.marquee}
            dir={dir}
            gap="clamp(1.5rem, 3vw, 3rem)"
            items={list}
            render={(service, copy) => (
              <span className={styles.item}>
                <motion.a href={servicesHref} tabIndex={copy ? -1 : undefined} className={styles.link} initial="rest" animate="rest" whileHover="hover" whileFocus="hover">
                  <motion.span className={styles.title} variants={FILL} transition={{ duration: 0.35 }}>
                    {service.title[lang]}
                  </motion.span>
                </motion.a>
                <i aria-hidden className={styles.sq} />
              </span>
            )}
          />
        </nav>
      )}

      <div className="shell">
        <div className={styles.bottom}>
          <span className={styles.rights}>
            © {year} {footer.company}
          </span>
          <Link href="/privacy" className={styles.privacy}>
            {footer.privacy}
          </Link>
          <motion.button type="button" className={styles.top} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }}>
            {footer.top}
            <ArrowUp size={14} strokeWidth={2} aria-hidden />
          </motion.button>
        </div>
      </div>
    </footer>
  );
}
