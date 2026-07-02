import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { BookCard, type BookCardData } from "@/components/book-card";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/categories/")({
  component: CategoriesIndex,
});

function CategoriesIndex() {
  const { lang } = useI18n();
  const { data: categories = [] } = useQuery({
    queryKey: ["all-cats"],
    queryFn: async () => (await supabase.from("categories").select("*").order("sort_order")).data ?? [],
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="border-b bg-paper">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <h1 className="font-display text-4xl md:text-5xl">{lang === "en" ? "Categories" : "Qaybaha"}</h1>
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-6 py-12 sm:grid-cols-3 lg:grid-cols-4">
        {categories.map((c: any, i) => (
          <Link
            key={c.id}
            to="/categories/$slug"
            params={{ slug: c.slug }}
            className="group relative overflow-hidden rounded-lg border bg-background p-8 transition-all hover:-translate-y-0.5 hover:border-emerald hover:shadow-card"
          >
            <div
              className="absolute -right-6 -top-6 size-32 rounded-full opacity-15 blur-2xl"
              style={{ background: `var(--chart-${(i % 5) + 1})` }}
            />
            <div className="text-xs font-semibold uppercase tracking-widest text-emerald">
              {lang === "en" ? "Explore" : "Sahami"}
            </div>
            <div className="mt-3 font-display text-2xl">{lang === "en" ? c.name_en : c.name_so}</div>
          </Link>
        ))}
      </section>
      <SiteFooter />
    </div>
  );
}
