import { createFileRoute, Link, useNavigate, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { BookOpen, LayoutDashboard, Library, ShoppingBag, Tag, Users, LogOut, Store, BarChart3, Settings as SettingsIcon, Inbox } from "lucide-react";

export const Route = createFileRoute("/admin")({ component: AdminLayout });

function AdminLayout() {
  const { user, isAdmin, isSuperadmin, loading, signOut } = useAuth();
  const { lang } = useI18n();
  const nav = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (loading) return;
    if (!user) nav({ to: "/auth" });
    else if (!isAdmin) nav({ to: "/" });
  }, [user, isAdmin, loading, nav]);

  if (!user || !isAdmin) {
    return <div className="grid min-h-screen place-items-center text-muted-foreground">Checking access…</div>;
  }

  const links = [
    { to: "/admin", icon: LayoutDashboard, label: lang === "en" ? "Dashboard" : "Dashboarka" },
    { to: "/admin/books", icon: Library, label: lang === "en" ? "Books" : "Buugaag" },
    { to: "/admin/categories", icon: Tag, label: lang === "en" ? "Categories" : "Qaybaha" },
    { to: "/admin/orders", icon: ShoppingBag, label: lang === "en" ? "Orders" : "Dalabyada" },
    { to: "/admin/users", icon: Users, label: lang === "en" ? "Users" : "Isticmaalayaal" },
    { to: "/admin/reports", icon: BarChart3, label: lang === "en" ? "Reports" : "Warbixin" },
    ...(isSuperadmin
      ? [
          { to: "/admin/bookshops", icon: Store, label: lang === "en" ? "Bookshops" : "Maktabadaha" },
          { to: "/admin/applications", icon: Inbox, label: lang === "en" ? "Applications" : "Codsiyada" },
        ]
      : []),
    { to: "/admin/settings", icon: SettingsIcon, label: lang === "en" ? "Settings" : "Habaynta" },
  ];

  return (
    <div className="grid min-h-screen bg-background md:grid-cols-[240px_1fr]">
      <aside className="border-r bg-brand text-brand-foreground md:sticky md:top-0 md:h-screen">
        <div className="flex h-16 items-center gap-2 px-5">
          <div className="grid size-8 place-items-center rounded-md bg-emerald text-emerald-foreground">
            <BookOpen className="size-4" />
          </div>
          <div>
            <div className="text-sm font-semibold">Maskax Maal</div>
            <div className="text-[10px] uppercase tracking-widest text-white/50">{isSuperadmin ? "Superadmin" : "Admin"}</div>
          </div>
        </div>
        <nav className="mt-4 space-y-1 px-3 text-sm">
          {links.map((l) => {
            const active = path === l.to || (l.to !== "/admin" && path.startsWith(l.to));
            return (
              <Link
                key={l.to}
                to={l.to}
                className={`flex items-center gap-3 rounded-md px-3 py-2 transition ${
                  active ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                <l.icon className="size-4" /> {l.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-8 border-t border-white/10 p-3">
          <Link to="/" className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-white/70 hover:bg-white/5 hover:text-white">
            <BookOpen className="size-4" /> {lang === "en" ? "Back to store" : "Ku noqo dukaanka"}
          </Link>
          <button onClick={signOut} className="mt-1 flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-white/70 hover:bg-white/5 hover:text-white">
            <LogOut className="size-4" /> {lang === "en" ? "Sign out" : "Ka bax"}
          </button>
        </div>
      </aside>
      <main className="min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
