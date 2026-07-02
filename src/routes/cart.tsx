import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { money } from "@/lib/format";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/cart")({ component: CartPage });

function CartPage() {
  const { user, loading } = useAuth();
  const { lang } = useI18n();
  const qc = useQueryClient();
  const nav = useNavigate();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["cart", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("cart_items")
        .select("*, books(id,slug,title,author,cover_url,price,stock)")
        .eq("user_id", user.id);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const updateQty = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      if (quantity <= 0) {
        await supabase.from("cart_items").delete().eq("id", id);
      } else {
        await supabase.from("cart_items").update({ quantity }).eq("id", id);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cart"] });
      qc.invalidateQueries({ queryKey: ["cart-count"] });
    },
  });

  const subtotal = items.reduce((s, i: any) => s + Number(i.books?.price ?? 0) * i.quantity, 0);

  if (loading) return <div className="min-h-screen"><SiteHeader /></div>;
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-md px-6 py-24 text-center">
          <ShoppingBag className="mx-auto size-10 text-muted-foreground" />
          <h1 className="mt-4 font-display text-3xl">
            {lang === "en" ? "Sign in to view your cart" : "Gal si aad u aragto gaariga"}
          </h1>
          <Button asChild className="mt-6 bg-brand hover:bg-brand/90">
            <Link to="/auth">{lang === "en" ? "Sign in" : "Gal"}</Link>
          </Button>
        </div>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h1 className="font-display text-4xl md:text-5xl">{lang === "en" ? "Your cart" : "Gaarigaaga"}</h1>
        {isLoading ? (
          <div className="mt-8 h-64 animate-pulse rounded-lg bg-muted" />
        ) : items.length === 0 ? (
          <div className="mt-8 rounded-lg border border-dashed p-16 text-center">
            <p className="text-muted-foreground">
              {lang === "en" ? "Your cart is empty." : "Gaarigaagu waa faaruq."}
            </p>
            <Button asChild className="mt-6 bg-brand hover:bg-brand/90">
              <Link to="/books">{lang === "en" ? "Browse the library" : "Fiiri maktabadda"}</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_360px]">
            <div className="divide-y">
              {items.map((i: any) => (
                <div key={i.id} className="flex gap-5 py-6">
                  <Link to="/books/$slug" params={{ slug: i.books.slug }} className="shrink-0">
                    <img src={i.books.cover_url} alt={i.books.title} className="h-32 w-24 rounded-md object-cover shadow-card" />
                  </Link>
                  <div className="flex flex-1 flex-col">
                    <Link to="/books/$slug" params={{ slug: i.books.slug }} className="font-semibold hover:text-emerald">
                      {i.books.title}
                    </Link>
                    <div className="text-sm text-muted-foreground">{i.books.author}</div>
                    <div className="mt-auto flex items-center justify-between">
                      <div className="inline-flex items-center rounded-md border">
                        <button
                          className="p-2 hover:bg-muted"
                          onClick={() => updateQty.mutate({ id: i.id, quantity: i.quantity - 1 })}
                        >
                          <Minus className="size-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm font-medium">{i.quantity}</span>
                        <button
                          className="p-2 hover:bg-muted"
                          onClick={() => updateQty.mutate({ id: i.id, quantity: i.quantity + 1 })}
                        >
                          <Plus className="size-3.5" />
                        </button>
                      </div>
                      <div className="font-display text-xl font-semibold text-brand">
                        {money(Number(i.books.price) * i.quantity)}
                      </div>
                      <button
                        onClick={() => updateQty.mutate({ id: i.id, quantity: 0 })}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="h-fit rounded-lg border bg-paper p-6">
              <h3 className="font-display text-xl">{lang === "en" ? "Order summary" : "Kooban dalabka"}</h3>
              <div className="mt-4 space-y-2 border-b pb-4 text-sm">
                <Row label={lang === "en" ? "Subtotal" : "Wadarta"} value={money(subtotal)} />
                <Row label={lang === "en" ? "Delivery" : "Gaarsiin"} value={lang === "en" ? "Instant" : "Deg deg"} />
              </div>
              <div className="flex items-center justify-between py-4">
                <span className="font-semibold">{lang === "en" ? "Total" : "Wadarta"}</span>
                <span className="font-display text-2xl font-semibold text-brand">{money(subtotal)}</span>
              </div>
              <Button
                className="w-full bg-emerald text-emerald-foreground hover:bg-emerald/90"
                onClick={() => nav({ to: "/checkout" })}
              >
                {lang === "en" ? "Proceed to checkout" : "U gudub biilka"}
              </Button>
            </div>
          </div>
        )}
      </section>
      <SiteFooter />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
