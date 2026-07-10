import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getPlatformStats } from "@/lib/superadmin.functions";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { money } from "@/lib/format";
import { BookOpen, DollarSign, ShoppingBag, Users, Store, ShieldCheck, Inbox } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export const Route = createFileRoute("/admin/")({ component: AdminDashboard });

function AdminDashboard() {
  const { lang } = useI18n();
  const { isSuperadmin } = useAuth();
  const statsFn = useServerFn(getPlatformStats);

  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [{ count: booksCount }, { count: usersCount }, { count: ordersCount }, orders] = await Promise.all([
        supabase.from("books").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("orders").select("*", { count: "exact", head: true }),
        supabase.from("orders").select("total, created_at, payment_status").order("created_at", { ascending: false }).limit(200),
      ]);
      const paid = (orders.data ?? []).filter((o: any) => o.payment_status === "paid");
      const revenue = paid.reduce((s: number, o: any) => s + Number(o.total), 0);
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
      return { books: booksCount ?? 0, users: usersCount ?? 0, orders: ordersCount ?? 0, revenue, chart };
    },
  });

  const { data: platform } = useQuery({
    queryKey: ["platform-stats"],
    queryFn: () => statsFn(),
    enabled: isSuperadmin,
  });

  const { data: pendingApps = 0 } = useQuery({
    queryKey: ["pending-applications"],
    queryFn: async () => {
      const { count } = await supabase
        .from("bookshop_applications")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");
      return count ?? 0;
    },
    enabled: isSuperadmin,
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
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">{lang === "en" ? "Dashboard" : "Dashboarka"}</h1>
          <p className="text-sm text-muted-foreground">
            {lang === "en" ? "Real-time overview of your platform." : "Aragti guud oo shabakadda."}
          </p>
        </div>
        {isSuperadmin && (
          <span className="rounded-full bg-emerald/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald">
            Superadmin
          </span>
        )}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={DollarSign} label={lang === "en" ? "Revenue" : "Dakhli"} value={money(stats?.revenue ?? 0)} accent="emerald" />
        <StatCard icon={ShoppingBag} label={lang === "en" ? "Orders" : "Dalabyada"} value={String(stats?.orders ?? 0)} />
        <StatCard icon={BookOpen} label={lang === "en" ? "Books" : "Buugaag"} value={String(stats?.books ?? 0)} />
        <StatCard icon={Users} label={lang === "en" ? "Users" : "Isticmaalayaal"} value={String(stats?.users ?? 0)} />
      </div>

      {isSuperadmin && (
        <>
          <h2 className="mt-10 font-display text-xl">{lang === "en" ? "Platform status" : "Xaaladda shabakadda"}</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={Store} label={lang === "en" ? "Bookshops" : "Maktabadaha"} value={String(platform?.bookshops ?? 0)} />
            <StatCard icon={ShieldCheck} label={lang === "en" ? "Admins" : "Maamulayaal"} value={String((platform?.byRole?.admin ?? 0) + (platform?.byRole?.superadmin ?? 0))} />
            <StatCard icon={Users} label={lang === "en" ? "Readers" : "Akhristayaal"} value={String(platform?.byRole?.user ?? 0)} />
            <Link to="/admin/applications" className="rounded-lg border bg-card p-6 transition hover:border-emerald hover:shadow-elegant">
              <div className="flex items-center gap-3">
                <div className={`grid size-10 place-items-center rounded-md ${pendingApps > 0 ? "bg-gold/20 text-gold" : "bg-brand/10 text-brand"}`}>
                  <Inbox className="size-5" />
                </div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground">
                  {lang === "en" ? "Pending applications" : "Codsi sugaya"}
                </div>
              </div>
              <div className="mt-4 font-display text-3xl font-semibold">{pendingApps}</div>
            </Link>
          </div>
        </>
      )}

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
    </div>
  );
}

function StatCard({ icon: Icon, label, value, accent }: { icon: any; label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-lg border bg-card p-6">
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
