import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { money } from "@/lib/format";
import { ShieldCheck, TrendingUp, BookOpen, ShoppingBag } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export const Route = createFileRoute("/admin/reports")({ component: AdminReports });

function AdminReports() {
  const { isAdmin, isSuperadmin } = useAuth();
  const { lang } = useI18n();

  const { data } = useQuery({
    queryKey: ["reports"],
    queryFn: async () => {
      const [ordersRes, booksRes] = await Promise.all([
        supabase.from("orders").select("total, created_at, payment_status, status").order("created_at", { ascending: false }).limit(500),
        supabase.from("books").select("title, sales_count, price").order("sales_count", { ascending: false }).limit(10),
      ]);
      const orders = ordersRes.data ?? [];
      const books = booksRes.data ?? [];

      const byMonth = new Map<string, { revenue: number; orders: number }>();
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        byMonth.set(d.toISOString().slice(0, 7), { revenue: 0, orders: 0 });
      }
      orders.forEach((o: any) => {
        const k = o.created_at.slice(0, 7);
        const cur = byMonth.get(k);
        if (cur) {
          cur.orders += 1;
          if (o.payment_status === "paid") cur.revenue += Number(o.total);
        }
      });
      const monthly = Array.from(byMonth.entries()).map(([m, v]) => ({
        month: new Date(m + "-01").toLocaleDateString(undefined, { month: "short" }),
        ...v,
      }));

      const paid = orders.filter((o: any) => o.payment_status === "paid");
      const totalRevenue = paid.reduce((s: number, o: any) => s + Number(o.total), 0);
      const aov = paid.length ? totalRevenue / paid.length : 0;
      const conversion = orders.length ? (paid.length / orders.length) * 100 : 0;

      return { monthly, books, totalRevenue, aov, conversion, ordersCount: orders.length };
    },
    enabled: isAdmin,
  });

  if (!isAdmin) {
    return (
      <div className="p-8"><div className="rounded-lg border bg-card p-8 text-center">
        <ShieldCheck className="mx-auto size-10 text-muted-foreground" />
        <h2 className="mt-3 font-display text-xl">Admins only</h2>
      </div></div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl">{lang === "en" ? "Reports & Analytics" : "Warbixin iyo Falanqayn"}</h1>
          <p className="text-sm text-muted-foreground">
            {lang === "en" ? "Track platform performance and top titles." : "La soco waxqabadka shabakadda iyo buugaagta ugu iibsanaya."}
          </p>
        </div>
        {isSuperadmin && <span className="rounded-full bg-emerald/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald">Superadmin</span>}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-4">
        <MetricCard icon={TrendingUp} label={lang === "en" ? "Total revenue" : "Wadarta dakhliga"} value={money(data?.totalRevenue ?? 0)} />
        <MetricCard icon={ShoppingBag} label={lang === "en" ? "Orders" : "Dalabyada"} value={String(data?.ordersCount ?? 0)} />
        <MetricCard icon={TrendingUp} label={lang === "en" ? "Avg order value" : "Celceliska dalabka"} value={money(data?.aov ?? 0)} />
        <MetricCard icon={TrendingUp} label={lang === "en" ? "Conversion" : "Guulaystay"} value={`${(data?.conversion ?? 0).toFixed(1)}%`} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-display text-lg">{lang === "en" ? "Monthly revenue (6 months)" : "Dakhliga bille (6 bilood)"}</h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.monthly ?? []}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip formatter={(v: number) => money(v)} />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="var(--emerald)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-display text-lg">{lang === "en" ? "Orders per month" : "Dalabyada bishii"}</h3>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.monthly ?? []}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="orders" fill="var(--brand)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-lg border bg-card p-6">
        <h3 className="flex items-center gap-2 font-display text-lg">
          <BookOpen className="size-5" /> {lang === "en" ? "Top selling books" : "Buugaagta ugu iibsanaya"}
        </h3>
        <div className="mt-4 divide-y">
          {(data?.books ?? []).map((b: any, i: number) => (
            <div key={i} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <span className="grid size-7 place-items-center rounded-full bg-muted text-xs font-bold">{i + 1}</span>
                <span className="text-sm font-medium">{b.title}</span>
              </div>
              <div className="text-sm">
                <b>{b.sales_count}</b> <span className="text-muted-foreground">{lang === "en" ? "sold" : "la iibiyay"}</span>
              </div>
            </div>
          ))}
          {(data?.books ?? []).length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">{lang === "en" ? "No sales data yet." : "Weli xog iibinta ma jiro."}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
        <Icon className="size-4" /> {label}
      </div>
      <div className="mt-3 font-display text-2xl font-semibold">{value}</div>
    </div>
  );
}
