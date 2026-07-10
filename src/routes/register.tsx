import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useI18n } from "@/lib/i18n";
import { BookOpen, Store, ArrowRight, UserPlus } from "lucide-react";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Register — Maskax Maal" },
      { name: "description", content: "Create a reader account or apply to register your bookshop on Maskax Maal." },
    ],
  }),
  component: RegisterChooser,
});

function RegisterChooser() {
  const { lang } = useI18n();
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-md bg-emerald/10 px-3 py-1 text-xs font-semibold text-emerald">
            <UserPlus className="size-3.5" /> {lang === "en" ? "Join Maskax Maal" : "Ku biir Maskax Maal"}
          </div>
          <h1 className="mt-4 font-display text-4xl md:text-5xl">
            {lang === "en" ? "How would you like to register?" : "Sideed rabtaa inaad isu diiwaan geliso?"}
          </h1>
          <p className="mt-3 text-muted-foreground">
            {lang === "en"
              ? "Pick the account that fits you. You can always upgrade later."
              : "Dooro nooca ku habboon. Waad awoodaa inaad kordhiso mar dambe."}
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <Link
            to="/register/user"
            className="group relative overflow-hidden rounded-2xl border bg-paper p-8 shadow-card transition hover:-translate-y-1 hover:shadow-elegant"
          >
            <div className="grid size-12 place-items-center rounded-lg bg-emerald/10 text-emerald">
              <BookOpen className="size-6" />
            </div>
            <h2 className="mt-6 font-display text-2xl">
              {lang === "en" ? "Reader account" : "Akoon akhriye"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {lang === "en"
                ? "Buy books, read online, track orders, and save favorites."
                : "Iibso buugag, si toos ah u akhri, la soco dalabyada, kaydiso kuwa aad jeceshahay."}
            </p>
            <ul className="mt-4 space-y-1.5 text-sm text-foreground/80">
              <li>• {lang === "en" ? "Free forever" : "Bilaash weligaa"}</li>
              <li>• {lang === "en" ? "Instant delivery" : "Gaarsiin deg deg ah"}</li>
              <li>• {lang === "en" ? "EVC / Zaad / Sahal" : "EVC / Zaad / Sahal"}</li>
            </ul>
            <div className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-emerald">
              {lang === "en" ? "Continue" : "Sii wad"} <ArrowRight className="size-4 transition group-hover:translate-x-1" />
            </div>
          </Link>

          <Link
            to="/register/library"
            className="group relative overflow-hidden rounded-2xl border bg-brand p-8 text-brand-foreground shadow-card transition hover:-translate-y-1 hover:shadow-elegant"
          >
            <div className="grid size-12 place-items-center rounded-lg bg-emerald text-emerald-foreground">
              <Store className="size-6" />
            </div>
            <h2 className="mt-6 font-display text-2xl">
              {lang === "en" ? "Bookshop / Library" : "Maktabad / Dukaan buugaag"}
            </h2>
            <p className="mt-2 text-sm text-white/70">
              {lang === "en"
                ? "Register your bookshop to sell books, manage inventory, and reach thousands of readers."
                : "Isdiiwaan geli maktabaddaada si aad u iibiso buugag, u maamusho kaydka, oo u gaadho kumanaan akhriste."}
            </p>
            <ul className="mt-4 space-y-1.5 text-sm text-white/80">
              <li>• {lang === "en" ? "Dedicated admin dashboard" : "Dashboard gaar ah oo maamul"}</li>
              <li>• {lang === "en" ? "Sales & analytics reports" : "Warbixin iib iyo falanqayn"}</li>
              <li>• {lang === "en" ? "Reviewed by the platform team" : "Waxaa dib u eegi doona kooxda"}</li>
            </ul>
            <div className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-emerald">
              {lang === "en" ? "Apply now" : "Codso hadda"} <ArrowRight className="size-4 transition group-hover:translate-x-1" />
            </div>
          </Link>
        </div>

        <p className="mt-10 text-center text-sm text-muted-foreground">
          {lang === "en" ? "Already have an account?" : "Akoon ma leedahay?"}{" "}
          <Link to="/auth" className="font-semibold text-emerald hover:underline">
            {lang === "en" ? "Sign in" : "Gal"}
          </Link>
        </p>
      </section>
      <SiteFooter />
    </div>
  );
}
