import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { money } from "@/lib/format";
import { BookOpen, DollarSign, ShoppingBag, Users, TrendingUp, Trophy } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export const Route = createFileRoute("/admin/")({ component: AdminDashboard });

function AdminDashboard() {
  const { lang } = useI18n();

  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [{ count: booksCount }, { count: usersCount }, { count: ordersCount }, orders] = await Promise.all([
        supabase.from("books").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("orders").select("*", { count: "exact", head: true }),
        supabase.from("orders").select("total, created_at, payment_status").order("created_at", { ascending: false }).limit(500),
      ]);
      const paid = (orders.data ?? []).filter((o: any) => o.payment_status === "paid");
      const revenue = paid.reduce((s: number, o: any) => s + Number(o.total), 0);
      const now = new Date();
      const monthRevenue = paid
        .filter((o: any) => {
          const d = new Date(o.created_at);
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        })
        .reduce((s: number, o: any) => s + Number(o.total), 0);
      const monthSales = paid.filter((o: any) => {
        const d = new Date(o.created_at);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }).length;
      const byDay = new Map<string, number>();
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        byDay.set(d.toISOString().slice(0, 10), 0);
      }
      paid.forEach((o: any) => {
        const k = o.created_at.slice(0, 10);
        if (byDay.has(k)) byDay.set(k, (byDay.get(k) ?? 0) + Number(o.total));
      });
      const chart = Array.from(byDay.entries()).map(([date, total]) => ({
        date: new Date(date).toLocaleDateString(undefined, { weekday: "short" }),
        total,
      }));
      return {
        books: booksCount ?? 0,
        users: usersCount ?? 0,
        orders: ordersCount ?? 0,
        revenue,
        monthRevenue,
        monthSales,
        chart,
      };
    },
  });

  const { data: topBooks = [] } = useQuery({
    queryKey: ["admin-top-books"],
    queryFn: async () => {
      const { data } = await supabase
        .from("books")
        .select("id, title, author, cover_url, sales_count, price")
        .order("sales_count", { ascending: false })
        .limit(5);
      return data ?? [];
    },
  });

  const { data: recent = [] } = useQuery({
    queryKey: ["admin-recent-orders"],
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("id, order_number, total, payment_status, status, created_at")
        .order("created_at", { ascending: false })
        .limit(8);
      return data ?? [];
    },
  });

  return (
    <div className="p-8">
      <div>
        <h1 className="font-display text-3xl">{lang === "en" ? "Dashboard" : "Dashboarka"}</h1>
        <p className="text-sm text-muted-foreground">
          {lang === "en" ? "Real-time overview of your bookstore." : "Aragti guud oo maktabaddaada."}
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={DollarSign} label={lang === "en" ? "Revenue (all)" : "Dakhli"} value={money(stats?.revenue ?? 0)} accent="emerald" />
        <StatCard icon={TrendingUp} label={lang === "en" ? "Revenue (month)" : "Dakhliga bishaan"} value={money(stats?.monthRevenue ?? 0)} accent="emerald" />
        <StatCard icon={ShoppingBag} label={lang === "en" ? "Sales (month)" : "Iibka bishaan"} value={String(stats?.monthSales ?? 0)} />
        <StatCard icon={ShoppingBag} label={lang === "en" ? "Orders" : "Dalabyada"} value={String(stats?.orders ?? 0)} />
        <StatCard icon={BookOpen} label={lang === "en" ? "Books" : "Buugaag"} value={String(stats?.books ?? 0)} />
        <StatCard icon={Users} label={lang === "en" ? "Users" : "Isticmaalayaal"} value={String(stats?.users ?? 0)} />
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        <div className="rounded-lg border bg-card p-6 lg:col-span-2">
          <h3 className="font-display text-xl">{lang === "en" ? "Revenue (last 7 days)" : "Dakhliga (7 maalmood)"}</h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.chart ?? []}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip formatter={(v: number) => money(v)} />
                <Bar dataKey="total" fill="var(--emerald)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-display text-xl">{lang === "en" ? "Recent orders" : "Dalabyadii ugu dambeeyay"}</h3>
          <div className="mt-4 divide-y">
            {recent.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">
                {lang === "en" ? "No orders yet." : "Weli dalab ma jiro."}
              </p>
            ) : (
              recent.map((o: any) => (
                <div key={o.id} className="flex items-center justify-between py-3 text-sm">
                  <div>
                    <div className="font-mono text-xs">{o.order_number}</div>
                    <div className="text-[10px] uppercase text-muted-foreground">{o.payment_status}</div>
                  </div>
                  <div className="font-semibold">{money(o.total)}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="mt-10 rounded-lg border bg-card p-6">
        <h3 className="flex items-center gap-2 font-display text-xl">
          <Trophy className="size-5 text-gold" />
          {lang === "en" ? "Top selling books" : "Buugaagta ugu iibka badan"}
        </h3>
        <div className="mt-4 divide-y">
          {topBooks.length === 0 ? (
            <p className="py-3 text-sm text-muted-foreground">{lang === "en" ? "No sales yet." : "Weli iib ma jiro."}</p>
          ) : (
            topBooks.map((b: any, i: number) => (
              <div key={b.id} className="flex items-center gap-3 py-3 text-sm">
                <span className="grid size-6 place-items-center rounded-full bg-muted text-xs font-bold">{i + 1}</span>
                {b.cover_url && <img src={b.cover_url} alt="" className="h-10 w-8 rounded object-cover" />}
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">{b.title}</div>
                  <div className="text-xs text-muted-foreground">{b.author}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{money(b.price)}</div>
                  <div className="text-xs text-muted-foreground">{b.sales_count} sold</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, accent }: { icon: any; label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-lg border bg-card p-6 transition hover:shadow-elegant">
      <div className="flex items-center gap-3">
        <div className={`grid size-10 place-items-center rounded-md ${accent === "emerald" ? "bg-emerald/10 text-emerald" : "bg-brand/10 text-brand"}`}>
          <Icon className="size-5" />
        </div>
        <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
      </div>
      <div className="mt-4 font-display text-3xl font-semibold">{value}</div>
    </div>
  );
}
