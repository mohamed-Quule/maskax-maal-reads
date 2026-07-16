import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { useServerFn } from "@tanstack/react-start";
import { getBookReadUrl, getBookDownloadUrl } from "@/lib/library.functions";
import { BookOpen, Download, Library as LibraryIcon } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/account/library")({ component: MyLibrary });

function MyLibrary() {
  const { user, loading } = useAuth();
  const { lang } = useI18n();
  const nav = useNavigate();
  const readFn = useServerFn(getBookReadUrl);
  const downloadFn = useServerFn(getBookDownloadUrl);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/auth" });
  }, [loading, user, nav]);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["my-library", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("library")
        .select("id, granted_at, books(id, slug, title, author, cover_url)")
        .eq("user_id", user.id)
        .order("granted_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const openRead = async (bookId: string) => {
    try {
      const { url } = await readFn({ data: { bookId } });
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    }
  };
  const doDownload = async (bookId: string, slug: string) => {
    try {
      const { url } = await downloadFn({ data: { bookId } });
      const a = document.createElement("a");
      a.href = url;
      a.download = `${slug}.pdf`;
      a.rel = "noopener";
      a.click();
    } catch (e: any) {
      toast.error(e?.message ?? "Failed");
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-md bg-emerald/10 text-emerald">
            <LibraryIcon className="size-5" />
          </div>
          <div>
            <h1 className="font-display text-3xl md:text-4xl">
              {lang === "en" ? "My Library" : "Maktabaddayda"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {lang === "en"
                ? "Every book you've purchased — read online or download."
                : "Buugaagta aad iibsatay — akhri online ama soo dejiso."}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-56 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="mt-12 rounded-lg border border-dashed p-16 text-center">
            <LibraryIcon className="mx-auto size-10 text-muted-foreground" />
            <h3 className="mt-4 font-display text-xl">
              {lang === "en" ? "Your library is empty" : "Maktabadaadu waa faaruq"}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {lang === "en"
                ? "Buy books to build your permanent digital library."
                : "Iibso buugaag si aad u dhisto maktabaddaada dhijitaalka."}
            </p>
            <Button asChild className="mt-6 bg-brand hover:bg-brand/90">
              <Link to="/books">{lang === "en" ? "Browse books" : "Fiiri buugaag"}</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((i: any) => (
              <div key={i.id} className="rounded-lg border bg-card p-4 shadow-card transition hover:shadow-elegant">
                <Link to="/books/$slug" params={{ slug: i.books.slug }} className="block">
                  {i.books.cover_url && (
                    <img
                      src={i.books.cover_url}
                      alt={i.books.title}
                      className="aspect-[2/3] w-full rounded-md object-cover"
                    />
                  )}
                </Link>
                <div className="mt-3">
                  <div className="line-clamp-1 font-semibold">{i.books.title}</div>
                  <div className="text-xs text-muted-foreground">{i.books.author}</div>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 bg-emerald text-emerald-foreground hover:bg-emerald/90"
                    onClick={() => openRead(i.books.id)}
                  >
                    <BookOpen className="mr-1.5 size-3.5" />
                    {lang === "en" ? "Read" : "Akhri"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => doDownload(i.books.id, i.books.slug)}
                  >
                    <Download className="mr-1.5 size-3.5" />
                    PDF
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      <SiteFooter />
    </div>
  );
}
