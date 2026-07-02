import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { BookCard, type BookCardData } from "@/components/book-card";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { ArrowRight, BookOpen, Download, Sparkles, Star } from "lucide-react";

export const Route = createFileRoute("/")({ component: HomePage });

function HomePage() {
  const { t, lang } = useI18n();

  const { data: featured = [] } = useQuery({
    queryKey: ["home-featured"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("books")
        .select("id,slug,title,author,cover_url,price,rating_avg,is_editor_pick,sales_count")
        .eq("is_featured", true)
        .order("sales_count", { ascending: false })
        .limit(6);
      if (error) throw error;
      return data as BookCardData[];
    },
  });

  const { data: editorPicks = [] } = useQuery({
    queryKey: ["home-editor"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("books")
        .select("id,slug,title,author,cover_url,price,rating_avg")
        .eq("is_editor_pick", true)
        .limit(6);
      if (error) throw error;
      return data as BookCardData[];
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["home-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* HERO */}
      <section className="relative overflow-hidden bg-brand text-brand-foreground">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(60% 60% at 80% 20%, oklch(0.62 0.16 160 / 0.35), transparent 60%), radial-gradient(60% 60% at 15% 80%, oklch(0.55 0.18 275 / 0.35), transparent 60%)",
          }}
        />
        <div className="relative mx-auto grid max-w-7xl gap-12 px-6 py-24 md:grid-cols-[1.15fr_1fr] md:py-32">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium backdrop-blur">
              <Sparkles className="size-3.5 text-emerald" />
              {t("hero_kicker")}
            </div>
            <h1 className="mt-6 font-display text-5xl leading-[1.05] tracking-tight sm:text-6xl md:text-7xl">
              {t("hero_title_1")}
              <span className="italic text-emerald">{t("hero_title_em")}</span>
              {t("hero_title_2")}
            </h1>
            <p className="mt-6 max-w-xl text-lg text-white/70">{t("hero_sub")}</p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-emerald text-emerald-foreground hover:bg-emerald/90">
                <Link to="/books">
                  {t("hero_cta_browse")} <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white">
                <Link to="/auth">{t("hero_cta_join")}</Link>
              </Button>
            </div>
            <div className="mt-12 flex flex-wrap gap-8 text-sm text-white/60">
              <div><span className="block font-display text-2xl text-white">1,200+</span>{lang === "en" ? "Titles" : "Buugaag"}</div>
              <div><span className="block font-display text-2xl text-white">45k</span>{lang === "en" ? "Readers" : "Akhristayaal"}</div>
              <div><span className="block font-display text-2xl text-white">4.9★</span>{lang === "en" ? "Avg. rating" : "Qiimaynta"}</div>
            </div>
          </div>
          <div className="relative hidden md:block">
            <div className="absolute inset-0 grid grid-cols-3 gap-4">
              {featured.slice(0, 6).map((b, i) => (
                <div
                  key={b.id}
                  className="relative overflow-hidden rounded-md shadow-elegant ring-1 ring-white/10"
                  style={{ transform: `translateY(${(i % 3) * 30}px)` }}
                >
                  {b.cover_url && (
                    <img src={b.cover_url} alt={b.title} className="aspect-[2/3] w-full object-cover" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* BEST SELLERS */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <SectionHeader title={t("section_bestsellers")} sub={t("section_bestsellers_sub")} to="/books" />
        <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-6">
          {featured.map((b) => <BookCard key={b.id} book={b} />)}
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="bg-paper">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <SectionHeader title={t("section_categories")} to="/categories" />
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {categories.map((c: any, i) => (
              <Link
                key={c.id}
                to="/categories/$slug"
                params={{ slug: c.slug }}
                className="group relative overflow-hidden rounded-lg border bg-background p-6 transition-all hover:-translate-y-0.5 hover:border-emerald hover:shadow-card"
              >
                <div
                  className="absolute -right-6 -top-6 size-24 rounded-full opacity-20 blur-2xl transition-opacity group-hover:opacity-40"
                  style={{ background: `var(--chart-${(i % 5) + 1})` }}
                />
                <BookOpen className="size-5 text-emerald" />
                <div className="mt-6 font-display text-xl">{lang === "en" ? c.name_en : c.name_so}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {lang === "en" ? "Explore" : "Sahamin"} →
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* EDITOR'S PICKS */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <SectionHeader title={t("section_editor")} to="/books" />
        <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-6">
          {editorPicks.map((b) => <BookCard key={b.id} book={b} />)}
        </div>
      </section>

      {/* READER PROMO */}
      <section className="bg-brand text-brand-foreground">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-24 md:grid-cols-2">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium">
              <Download className="size-3.5 text-emerald" /> {lang === "en" ? "Offline reader" : "Akhriye offline ah"}
            </div>
            <h2 className="mt-4 font-display text-4xl md:text-5xl">{t("section_reader")}</h2>
            <p className="mt-4 max-w-lg text-white/70">{t("section_reader_sub")}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <div className="rounded-md border border-white/15 bg-white/5 px-4 py-3 text-sm">EVC Plus</div>
              <div className="rounded-md border border-white/15 bg-white/5 px-4 py-3 text-sm">Zaad</div>
              <div className="rounded-md border border-white/15 bg-white/5 px-4 py-3 text-sm">Sahal</div>
            </div>
          </div>
          <div className="relative">
            <div className="glass mx-auto max-w-md rounded-2xl p-6 shadow-elegant">
              <div className="mb-4 flex items-center gap-2 text-xs text-white/60">
                <div className="size-2 rounded-full bg-red-400" />
                <div className="size-2 rounded-full bg-yellow-400" />
                <div className="size-2 rounded-full bg-green-400" />
                <span className="ml-auto">maskax.so/reader</span>
              </div>
              <div className="rounded-lg bg-white/95 p-6 text-brand shadow-inner">
                <div className="text-[10px] font-semibold uppercase tracking-widest text-emerald">Chapter 3</div>
                <h3 className="mt-2 font-display text-2xl">The Weight of Words</h3>
                <p className="mt-4 text-sm leading-relaxed text-brand/80">
                  "Odayadii waxay ku yiraahdeen: buugu waa saaxiib aan waligiis kaa tegin — hadduu isku ekaado xataa kolba isku halkaas."
                </p>
                <p className="mt-3 text-sm leading-relaxed text-brand/60">
                  The elders always said: a book is a friend who never leaves — even when he stays in the same place.
                </p>
                <div className="mt-6 flex items-center justify-between text-xs text-brand/50">
                  <span>Page 42 / 218</span>
                  <span className="inline-flex items-center gap-1"><Star className="size-3 fill-gold text-gold" /> 4.9</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function SectionHeader({ title, sub, to }: { title: string; sub?: string; to?: string }) {
  const { t } = useI18n();
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 className="font-display text-3xl md:text-4xl">{title}</h2>
        {sub && <p className="mt-2 max-w-xl text-sm text-muted-foreground">{sub}</p>}
      </div>
      {to && (
        <Link to={to} className="inline-flex items-center gap-1 text-sm font-semibold text-emerald hover:underline">
          {t("view_all")} <ArrowRight className="size-4" />
        </Link>
      )}
    </div>
  );
}
