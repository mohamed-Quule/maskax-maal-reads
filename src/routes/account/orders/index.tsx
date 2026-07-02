import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { money, shortDate } from "@/lib/format";
import { ChevronRight } from "lucide-react";

export const Route = createFileRoute("/account/orders/")({ component: Orders });

const statusBadge = (s: string) => {
  const map: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-emerald/15 text-emerald",
    delivered: "bg-brand/10 text-brand",
    cancelled: "bg-red-100 text-red-700",
  };
  return map[s] ?? "bg-muted text-muted-foreground";
};

function Orders() {
  const { user, loading } = useAuth();
  const { lang } = useI18n();
  const nav = useNavigate();
  useEffect(() => { if (!loading && !user) nav({ to: "/auth" }); }, [loading, user, nav]);

  const { data: orders = [] } = useQuery({
    queryKey: ["orders", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!user,
  });

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="mx-auto max-w-5xl px-6 py-16">
        <h1 className="font-display text-3xl">{lang === "en" ? "Your orders" : "Dalabyadaada"}</h1>
        <div className="mt-8 divide-y rounded-lg border bg-paper">
          {orders.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground">
              {lang === "en" ? "No orders yet." : "Weli dalab ma jiro."}
            </div>
          ) : (
            orders.map((o: any) => (
              <Link
                key={o.id}
                to="/account/orders/$id"
                params={{ id: o.id }}
                className="flex items-center justify-between gap-4 p-5 hover:bg-background"
              >
                <div>
                  <div className="font-mono text-sm">{o.order_number}</div>
                  <div className="text-xs text-muted-foreground">{shortDate(o.created_at)}</div>
                </div>
                <div className="text-right">
                  <div className="font-display text-lg font-semibold text-brand">{money(o.total)}</div>
                  <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${statusBadge(o.payment_status)}`}>
                    {o.payment_status}
                  </span>
                </div>
                <ChevronRight className="size-4 text-muted-foreground" />
              </Link>
            ))
          )}
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
