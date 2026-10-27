"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { content, type Lang, type SiteContent } from "@/lib/translations";

interface LanguageContextValue {
  lang: Lang;
  dir: "ltr" | "rtl";
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
  t: SiteContent;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);
const STORAGE_KEY = "thinksync-lang";

/*
 * The chosen language lives in localStorage and is read through
 * useSyncExternalStore: the server and hydration render English, then the
 * saved choice takes over. It is written only when the visitor picks a
 * language (writing it on every change used to save "en" before the saved
 * "ar" had been read, so a refresh fell back to English). Another tab's pick
 * arrives through the storage event.
 */
const listeners = new Set<() => void>();
let current: Lang | null = null;

function readStored(): Lang {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "ar" ? "ar" : "en";
  } catch {
    return "en";
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY) return;
    current = readStored();
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

const getSnapshot = () => (current ??= readStored());
const getServerSnapshot = (): Lang => "en";

function writeLang(next: Lang) {
  try {
    window.localStorage.setItem(STORAGE_KEY, next);
  } catch {}
  current = next;
  for (const listener of listeners) listener();
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const lang = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    const root = document.documentElement;
    root.lang = lang;
    root.dir = lang === "ar" ? "rtl" : "ltr";
    // The boot script hid the page while the saved language loaded; it has now.
    if (root.getAttribute("data-lang-boot") === lang) root.removeAttribute("data-lang-boot");
  }, [lang]);

  const setLang = useCallback((next: Lang) => writeLang(next), []);
  const toggleLang = useCallback(() => writeLang(lang === "en" ? "ar" : "en"), [lang]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      lang,
      dir: lang === "ar" ? "rtl" : "ltr",
      setLang,
      toggleLang,
      t: content[lang],
    }),
    [lang, setLang, toggleLang]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return ctx;
}
