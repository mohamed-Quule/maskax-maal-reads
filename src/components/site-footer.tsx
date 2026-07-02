import { Link } from "@tanstack/react-router";
import { useI18n } from "@/lib/i18n";

export function SiteFooter() {
  const { t } = useI18n();
  return (
    <footer className="border-t bg-paper">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="font-display text-2xl font-semibold text-brand">Maskax Maal</div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
            {t("footer_tagline")}
          </p>
        </div>
        <div>
          <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Platform
          </h4>
          <ul className="space-y-3 text-sm">
            <li><Link to="/books" className="hover:text-emerald">Library</Link></li>
            <li><Link to="/categories" className="hover:text-emerald">Categories</Link></li>
            <li><Link to="/account" className="hover:text-emerald">My Account</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {t("footer_pay")}
          </h4>
          <div className="flex flex-wrap gap-2">
            {["EVC Plus", "Zaad", "Sahal"].map((p) => (
              <span key={p} className="rounded-md border bg-background px-3 py-1.5 text-xs font-semibold">
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-6 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Maskax Maal Platform. All rights reserved.</p>
          <p>Muqdisho • Hargeysa • London</p>
        </div>
      </div>
    </footer>
  );
}
