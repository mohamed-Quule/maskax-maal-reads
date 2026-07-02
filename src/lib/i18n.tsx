import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "so";

type Dict = Record<string, { en: string; so: string }>;

export const dict: Dict = {
  nav_library: { en: "Library", so: "Maktabad" },
  nav_categories: { en: "Categories", so: "Qaybaha" },
  nav_authors: { en: "Authors", so: "Qorayaasha" },
  nav_signin: { en: "Sign in", so: "Gal" },
  nav_signup: { en: "Sign up", so: "Iska diiwaan geli" },
  nav_signout: { en: "Sign out", so: "Ka bax" },
  nav_account: { en: "My account", so: "Akoonkayga" },
  nav_admin: { en: "Admin", so: "Maamul" },
  nav_orders: { en: "Orders", so: "Dalabyada" },
  nav_cart: { en: "Cart", so: "Gaariga" },

  hero_kicker: { en: "The digital home of Somali letters", so: "Xarunta dhijitaal ee suugaanta Soomaaliyeed" },
  hero_title_1: { en: "Discover the soul of ", so: "Ogow nafta " },
  hero_title_em: { en: "Somali", so: "Soomaaliyeed" },
  hero_title_2: { en: " literature.", so: " ee suugaanta." },
  hero_sub: {
    en: "A curated digital library of classic Somali poetry, modern fiction, history, and global thought — read anywhere.",
    so: "Maktabad dhijitaal ah oo ka kooban gabayo, sheekooyin, taariikh iyo aqoon caalami — meel kasta ka akhri.",
  },
  hero_cta_browse: { en: "Browse the library", so: "Fiiri maktabadda" },
  hero_cta_join: { en: "Create free account", so: "Samee akoon bilaash ah" },

  section_bestsellers: { en: "Best sellers", so: "Buugaagta ugu iibsanaya" },
  section_bestsellers_sub: { en: "Most read titles this month across East Africa.", so: "Buugaagta ugu akhriyaan bishan Bariga Afrika." },
  section_editor: { en: "Editor's picks", so: "Doorashada tafatiraha" },
  section_reader: { en: "Read anywhere, on any device", so: "Ka akhri meel kasta, qalab kasta" },
  section_reader_sub: {
    en: "Our reader is tuned for Somali typography, offline access, and instant sync across your devices.",
    so: "Akhriyeheena wuxuu u habaysan yahay farta Soomaaliga, akhris offline, iyo sync degdeg ah.",
  },
  section_categories: { en: "Browse by category", so: "Ka raadi qaybaha" },
  view_all: { en: "View all", so: "Dhammaan arag" },
  add_to_cart: { en: "Add to cart", so: "Ku dar gaariga" },
  buy_now: { en: "Buy now", so: "Iibso hadda" },
  in_stock: { en: "In stock", so: "Waa la heli karaa" },
  out_of_stock: { en: "Out of stock", so: "Ma jiro" },

  footer_tagline: { en: "Preserving the wisdom of the past, empowering the voices of the future.", so: "Ilaalinta xigmadda hore, xoojinta codadka mustaqbalka." },
  footer_pay: { en: "Payments accepted", so: "Lacag-bixinta la aqbalayo" },
};

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: (k: keyof typeof dict) => string };
const I18nCtx = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  useEffect(() => {
    const stored = typeof window !== "undefined" ? (localStorage.getItem("mm-lang") as Lang | null) : null;
    if (stored === "en" || stored === "so") setLangState(stored);
  }, []);
  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") localStorage.setItem("mm-lang", l);
  };
  const t = (k: keyof typeof dict) => dict[k]?.[lang] ?? String(k);
  return <I18nCtx.Provider value={{ lang, setLang, t }}>{children}</I18nCtx.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nCtx);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
