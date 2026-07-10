import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { BookCard, type BookCardData } from "@/components/book-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { Search as SearchIcon } from "lucide-react";

type SearchParams = { q?: string; cat?: string; sort?: string; cover?: string };

export const Route = createFileRoute("/books/")({
  component: BooksList,
  validateSearch: (s: Record<string, unknown>): SearchParams => ({
    q: typeof s.q === "string" ? s.q : undefined,
    cat: typeof s.cat === "string" ? s.cat : undefined,
    sort: typeof s.sort === "string" ? s.sort : "popular",
    cover: s.cover === "hard" || s.cover === "soft" ? s.cover : undefined,
  }),
});

function BooksList() {
  const { q, cat, sort } = useSearch({ from: "/books/" });
  const { lang, t } = useI18n();
  const [query, setQuery] = useState(q ?? "");

  const { data: categories = [] } = useQuery({
    queryKey: ["cats"],
    queryFn: async () => (await supabase.from("categories").select("*").order("sort_order")).data ?? [],
  });

  const { data: books = [], isLoading } = useQuery({
    queryKey: ["books-list", q, cat, sort],
    queryFn: async () => {
      let qb = supabase
        .from("books")
        .select("id,slug,title,author,cover_url,price,rating_avg,category_id");
      if (cat) {
        const c = (await supabase.from("categories").select("id").eq("slug", cat).maybeSingle()).data;
        if (c) qb = qb.eq("category_id", c.id);
      }
      if (q) qb = qb.or(`title.ilike.%${q}%,author.ilike.%${q}%`);
      if (sort === "popular") qb = qb.order("sales_count", { ascending: false });
      else if (sort === "new") qb = qb.order("created_at", { ascending: false });
      else if (sort === "price-asc") qb = qb.order("price", { ascending: true });
      else if (sort === "price-desc") qb = qb.order("price", { ascending: false });
      else if (sort === "rating") qb = qb.order("rating_avg", { ascending: false });
      const { data, error } = await qb.limit(48);
      if (error) throw error;
      return data as BookCardData[];
    },
  });

  const nav = Route.useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="border-b bg-paper">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <h1 className="font-display text-4xl md:text-5xl">{t("nav_library")}</h1>
          <p className="mt-2 text-muted-foreground">
            {lang === "en" ? "Explore every title in our collection." : "Sahami buug walba oo ku jira ururintayada."}
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              nav({ search: (s: SearchParams) => ({ ...s, q: query || undefined }) });
            }}
            className="mt-6 flex max-w-xl gap-2"
          >
            <div className="relative flex-1">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={lang === "en" ? "Search titles, authors…" : "Raadi cinwaan, qore…"}
                className="pl-10"
              />
            </div>
            <Button type="submit" className="bg-brand text-brand-foreground hover:bg-brand/90">
              {lang === "en" ? "Search" : "Raadi"}
            </Button>
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-8 flex flex-wrap items-center gap-2">
          <Button
            variant={!cat ? "default" : "outline"}
            size="sm"
            onClick={() => nav({ search: (s: SearchParams) => ({ ...s, cat: undefined }) })}
            className={!cat ? "bg-brand hover:bg-brand/90" : ""}
          >
            {lang === "en" ? "All" : "Dhammaan"}
          </Button>
          {categories.map((c: any) => (
            <Button
              key={c.id}
              variant={cat === c.slug ? "default" : "outline"}
              size="sm"
              onClick={() => nav({ search: (s: SearchParams) => ({ ...s, cat: c.slug }) })}
              className={cat === c.slug ? "bg-brand hover:bg-brand/90" : ""}
            >
              {lang === "en" ? c.name_en : c.name_so}
            </Button>
          ))}
          <div className="ml-auto">
            <select
              value={sort}
              onChange={(e) => nav({ search: (s: SearchParams) => ({ ...s, sort: e.target.value }) })}
              className="rounded-md border bg-background px-3 py-1.5 text-sm"
            >
              <option value="popular">{lang === "en" ? "Popular" : "Caan"}</option>
              <option value="new">{lang === "en" ? "Newest" : "Cusub"}</option>
              <option value="rating">{lang === "en" ? "Top rated" : "Sare qiimaysan"}</option>
              <option value="price-asc">{lang === "en" ? "Price ↑" : "Qiime ↑"}</option>
              <option value="price-desc">{lang === "en" ? "Price ↓" : "Qiime ↓"}</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] animate-pulse rounded-md bg-muted" />
            ))}
          </div>
        ) : books.length === 0 ? (
          <div className="rounded-lg border border-dashed p-16 text-center text-muted-foreground">
            {lang === "en" ? "No books match your search." : "Ma jiraan buugag u dhigma raadintaada."}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-6">
            {books.map((b) => <BookCard key={b.id} book={b} />)}
          </div>
        )}
      </section>
      <SiteFooter />
    </div>
  );
}
