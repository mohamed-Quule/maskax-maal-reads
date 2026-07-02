import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { money, shortDate } from "@/lib/format";
import { CheckCircle2, Clock, Download } from "lucide-react";

export const Route = createFileRoute("/account/orders/$id")({ component: OrderDetail });

function OrderDetail() {
  const { id } = useParams({ from: "/account/orders/$id" });
  const { user } = useAuth();
  const { lang } = useI18n();

  const { data } = useQuery({
    queryKey: ["order", id],
    queryFn: async () => {
      const order = (await supabase.from("orders").select("*").eq("id", id).maybeSingle()).data;
      const items = (await supabase
        .from("order_items")
        .select("*, books(slug,cover_url,author,pdf_path)")
        .eq("order_id", id)).data ?? [];
      return { order, items };
    },
    enabled: !!user,
  });

  const order = data?.order;
  const items = data?.items ?? [];
  const paid = order?.payment_status === "paid";

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="mx-auto max-w-4xl px-6 py-16">
        {order && (
          <>
            <Link to="/account/orders" className="text-sm text-muted-foreground hover:text-emerald">
              ← {lang === "en" ? "All orders" : "Dalabyada oo dhan"}
            </Link>
            <div className="mt-4 flex items-start justify-between gap-4">
              <div>
                <h1 className="font-display text-3xl">
                  {lang === "en" ? "Order" : "Dalab"} <span className="font-mono text-2xl">{order.order_number}</span>
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">{shortDate(order.created_at)}</p>
              </div>
              <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase ${paid ? "bg-emerald/15 text-emerald" : "bg-yellow-100 text-yellow-800"}`}>
                {paid ? <CheckCircle2 className="size-3.5" /> : <Clock className="size-3.5" />}
                {order.payment_status}
              </div>
            </div>

            {!paid && (
              <div className="mt-6 rounded-lg border border-yellow-300 bg-yellow-50 p-5 text-sm">
                <div className="font-semibold text-yellow-900">
                  {lang === "en" ? "Awaiting payment confirmation" : "Xaqiijinta lacagta la sugayo"}
                </div>
                <p className="mt-1 text-yellow-800">
                  {lang === "en"
                    ? `Send $${Number(order.total).toFixed(2)} via ${order.payment_method?.toUpperCase()} from ${order.phone ?? "your number"}. Confirmation usually takes a few minutes.`
                    : `Ku dir $${Number(order.total).toFixed(2)} ${order.payment_method?.toUpperCase()} ka ${order.phone ?? "lambarkaaga"}. Xaqiijinta waxay qaadataa daqiiqado.`}
                </p>
              </div>
            )}

            <div className="mt-8 divide-y rounded-lg border bg-paper">
              {items.map((i: any) => (
                <div key={i.id} className="flex items-center gap-4 p-4">
                  <Link to="/books/$slug" params={{ slug: i.books?.slug ?? "" }}>
                    <img src={i.books?.cover_url} alt={i.title} className="h-20 w-14 rounded object-cover" />
                  </Link>
                  <div className="flex-1">
                    <div className="font-semibold">{i.title}</div>
                    <div className="text-xs text-muted-foreground">{i.books?.author}</div>
                  </div>
                  <div className="text-sm text-muted-foreground">× {i.quantity}</div>
                  <div className="w-24 text-right font-semibold">{money(Number(i.unit_price) * i.quantity)}</div>
                  {paid && (
                    <button className="rounded-md border p-2 text-emerald hover:bg-emerald/10" title="Download">
                      <Download className="size-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <div className="w-64 rounded-lg border bg-paper p-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{lang === "en" ? "Total" : "Wadarta"}</span>
                  <span className="font-display text-2xl font-semibold text-brand">{money(order.total)}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </section>
      <SiteFooter />
    </div>
  );
}
