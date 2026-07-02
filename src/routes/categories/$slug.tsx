import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { BookCard, type BookCardData } from "@/components/book-card";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/categories/$slug")({ component: CategoryPage });

function CategoryPage() {
  const { slug } = useParams({ from: "/categories/$slug" });
  const { lang } = useI18n();

  const { data } = useQuery({
    queryKey: ["cat", slug],
    queryFn: async () => {
      const cat = (await supabase.from("categories").select("*").eq("slug", slug).maybeSingle()).data;
      if (!cat) return { cat: null, books: [] as BookCardData[] };
      const books = (await supabase
        .from("books")
        .select("id,slug,title,author,cover_url,price,rating_avg")
        .eq("category_id", cat.id)
        .order("sales_count", { ascending: false })).data ?? [];
      return { cat, books };
    },
  });

  const cat = data?.cat;
  const books = data?.books ?? [];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="border-b bg-paper">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <div className="text-xs font-bold uppercase tracking-widest text-emerald">
            {lang === "en" ? "Category" : "Qayb"}
          </div>
          <h1 className="mt-2 font-display text-4xl md:text-5xl">
            {cat ? (lang === "en" ? cat.name_en : cat.name_so) : slug}
          </h1>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-6 py-12">
        {books.length === 0 ? (
          <div className="rounded-lg border border-dashed p-16 text-center text-muted-foreground">
            {lang === "en" ? "No books in this category yet." : "Weli buug qaybtan kuma jiro."}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-6">
            {books.map((b) => <BookCard key={b.id} book={b as BookCardData} />)}
          </div>
        )}
      </section>
      <SiteFooter />
    </div>
  );
}
