import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { money, shortDate } from "@/lib/format";
import { ShoppingCart, Star, BookOpen, ChevronLeft, Download } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { getBookReadUrl, getBookDownloadUrl, getFreeBookUrl } from "@/lib/library.functions";


export const Route = createFileRoute("/books/$slug")({ component: BookDetail });

function BookDetail() {
  const { slug } = useParams({ from: "/books/$slug" });
  const { lang, t } = useI18n();
  const { user } = useAuth();
  const qc = useQueryClient();
  const readFn = useServerFn(getBookReadUrl);
  const downloadFn = useServerFn(getBookDownloadUrl);
  const freeFn = useServerFn(getFreeBookUrl);



  const { data: book, isLoading } = useQuery({
    queryKey: ["book", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("books")
        .select("*, categories(slug,name_en,name_so)")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ["reviews", book?.id],
    queryFn: async () => {
      if (!book?.id) return [];
      const { data } = await supabase
        .from("reviews")
        .select("*")
        .eq("book_id", book.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!book?.id,
  });


  const { data: owned = false } = useQuery({
    queryKey: ["library-owns", user?.id, book?.id],
    queryFn: async () => {
      if (!user || !book?.id) return false;
      const { data } = await supabase
        .from("library")
        .select("id")
        .eq("user_id", user.id)
        .eq("book_id", book.id)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user && !!book?.id,
  });

  const addToCart = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sign in required");
      const { error } = await supabase.from("cart_items").upsert(
        { user_id: user.id, book_id: book!.id, quantity: 1 },
        { onConflict: "user_id,book_id" }
      );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cart-count"] });
      qc.invalidateQueries({ queryKey: ["cart"] });
      toast.success(lang === "en" ? "Added to cart" : "Waxaa lagu daray gaariga");
    },
    onError: (e: Error) => {
      if (e.message === "Sign in required") {
        toast.error(lang === "en" ? "Please sign in first" : "Fadlan marka hore gal");
      } else toast.error(e.message);
    },
  });

  if (isLoading) return <div className="min-h-screen"><SiteHeader /><div className="mx-auto max-w-4xl p-12"><div className="h-96 animate-pulse rounded-lg bg-muted" /></div></div>;
  if (!book) return <div className="min-h-screen"><SiteHeader /><div className="p-12 text-center">Not found</div></div>;

  const desc = lang === "en" ? book.description_en : book.description_so;
  const catName = book.categories ? (lang === "en" ? book.categories.name_en : book.categories.name_so) : null;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="border-b bg-paper">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <Link to="/books" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-emerald">
            <ChevronLeft className="size-4" /> {t("nav_library")}
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-12 px-6 py-16 md:grid-cols-[360px_1fr]">
        <div>
          <div className="overflow-hidden rounded-md bg-muted shadow-elegant ring-1 ring-black/5">
            {book.cover_url && <img src={book.cover_url} alt={book.title} className="aspect-[2/3] w-full object-cover" />}
          </div>
        </div>
        <div>
          {catName && (
            <Link to="/categories/$slug" params={{ slug: book.categories!.slug }} className="text-xs font-bold uppercase tracking-widest text-emerald hover:underline">
              {catName}
            </Link>
          )}
          <h1 className="mt-2 font-display text-4xl md:text-5xl">{book.title}</h1>
          <p className="mt-2 text-lg text-muted-foreground">by {book.author}</p>
          <div className="mt-4 flex items-center gap-4 text-sm">
            <span className="inline-flex items-center gap-1">
              <Star className="size-4 fill-gold text-gold" />
              <b>{Number(book.rating_avg).toFixed(1)}</b>
              <span className="text-muted-foreground">({book.rating_count})</span>
            </span>
            <span className="text-muted-foreground">•</span>
            <span className={book.stock > 0 ? "text-emerald" : "text-destructive"}>
              {book.stock > 0 ? t("in_stock") : t("out_of_stock")}
            </span>
          </div>
          <p className="mt-6 max-w-2xl leading-relaxed text-foreground/80">{desc}</p>

          <div className="mt-8 flex items-end gap-4">
            <div className="font-display text-4xl font-semibold text-brand">
              {book.is_free ? (lang === "en" ? "FREE" : "BILAASH") : money(book.price)}
            </div>
            {book.is_free && (
              <span className="rounded-full bg-emerald/10 px-3 py-1 text-xs font-bold uppercase text-emerald">
                {lang === "en" ? "Open access" : "Furan"}
              </span>
            )}
          </div>


          <div className="mt-6 flex flex-wrap gap-3">
            {(owned || book.is_free) && book.pdf_path ? (
              <>
                <Button
                  size="lg"
                  onClick={async () => {
                    try {
                      const fn = owned ? readFn : freeFn;
                      const { url } = await fn({ data: { bookId: book.id } });
                      window.open(url, "_blank", "noopener,noreferrer");
                    } catch (e: any) { toast.error(e?.message ?? "Failed"); }
                  }}
                  className="bg-emerald text-emerald-foreground hover:bg-emerald/90"
                >
                  <BookOpen className="mr-2 size-4" />
                  {lang === "en" ? "Read now" : "Akhri hadda"}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={async () => {
                    try {
                      const fn = owned ? downloadFn : freeFn;
                      const { url } = await fn({ data: { bookId: book.id } });
                      const a = document.createElement("a");
                      a.href = url; a.download = `${book.slug}.pdf`; a.rel = "noopener"; a.click();
                    } catch (e: any) { toast.error(e?.message ?? "Failed"); }
                  }}
                >
                  <Download className="mr-2 size-4" />
                  {lang === "en" ? "Download PDF" : "Soo dejiso"}
                </Button>
                {owned && (
                  <span className="inline-flex items-center rounded-full bg-emerald/10 px-3 py-1 text-xs font-bold uppercase text-emerald">
                    {lang === "en" ? "In your library" : "Maktabaddaada"}
                  </span>
                )}
              </>
            ) : (
              <>
                <Button
                  size="lg"
                  onClick={() => addToCart.mutate()}
                  disabled={addToCart.isPending}
                  className="bg-emerald text-emerald-foreground hover:bg-emerald/90"
                >
                  <ShoppingCart className="mr-2 size-4" />
                  {t("add_to_cart")}
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/cart"><BookOpen className="mr-2 size-4" />{t("nav_cart")}</Link>
                </Button>
              </>
            )}
          </div>



          <div className="mt-10 grid grid-cols-2 gap-4 rounded-lg border bg-paper p-4 text-sm sm:grid-cols-4">
            <Meta label={lang === "en" ? "Language" : "Luuqad"} value={book.language === "so" ? "Somali" : "English"} />
            <Meta label={lang === "en" ? "Cover" : "Jaldi"} value={book.cover_type === "hard" ? (lang === "en" ? "Hard cover" : "Jaldi adag") : (lang === "en" ? "Soft cover" : "Jaldi jilicsan")} />
            <Meta label={lang === "en" ? "Payment" : "Lacag bixin"} value="EVC / Zaad / Sahal" />
            <Meta label={lang === "en" ? "Delivery" : "Gaarsiin"} value={lang === "en" ? "Instant" : "Deg deg"} />
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="border-t bg-paper">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="font-display text-3xl">{lang === "en" ? "Reader reviews" : "Ra'yiga akhristayaasha"}</h2>
          {user && book.stock >= 0 && <ReviewForm bookId={book.id} />}
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {reviews.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {lang === "en" ? "No reviews yet — be the first." : "Weli ra'yi lama qorin — noqo kii ugu horeeya."}
              </p>
            ) : (
              reviews.map((r: any) => (
                <div key={r.id} className="rounded-lg border bg-background p-5">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">{lang === "en" ? "Reader" : "Akhriste"}</div>
                    <div className="inline-flex items-center gap-1 text-sm">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`size-3.5 ${i < r.rating ? "fill-gold text-gold" : "text-muted"}`} />
                      ))}
                    </div>
                  </div>
                  {r.comment && <p className="mt-2 text-sm leading-relaxed text-foreground/80">{r.comment}</p>}
                  <div className="mt-3 text-xs text-muted-foreground">{shortDate(r.created_at)}</div>
                </div>
              ))

            )}
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 font-medium">{value}</div>
    </div>
  );
}

function ReviewForm({ bookId }: { bookId: string }) {
  const { user } = useAuth();
  const { lang } = useI18n();
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const qc = useQueryClient();
  const m = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("reviews").upsert(
        { book_id: bookId, user_id: user!.id, rating, comment: body || null } as any,
        { onConflict: "book_id,user_id" }
      );
      if (error) throw error;
    },

    onSuccess: () => {
      toast.success(lang === "en" ? "Thanks for your review!" : "Mahadsanid ra'yigaaga!");
      setBody("");
      qc.invalidateQueries({ queryKey: ["reviews"] });
      qc.invalidateQueries({ queryKey: ["book"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="mt-6 rounded-lg border bg-background p-5">
      <div className="mb-3 flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <button key={i} type="button" onClick={() => setRating(i + 1)}>
            <Star className={`size-5 ${i < rating ? "fill-gold text-gold" : "text-muted"}`} />
          </button>
        ))}
      </div>
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={lang === "en" ? "Share your thoughts…" : "La wadaag fikradahaaga…"}
        rows={3}
      />
      <Button onClick={() => m.mutate()} disabled={m.isPending} className="mt-3 bg-brand hover:bg-brand/90">
        {lang === "en" ? "Post review" : "Dir ra'yiga"}
      </Button>
    </div>
  );
}
