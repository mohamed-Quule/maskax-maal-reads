import { Link, useRouterState } from "@tanstack/react-router";
import { BookOpen, ShoppingCart, User, LogOut, Search, Shield, Menu, X, UserPlus, Store } from "lucide-react";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function SiteHeader() {
  const { t, lang, setLang } = useI18n();
  const { user, isAdmin, isSuperadmin, signOut } = useAuth();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: cartCount = 0 } = useQuery({
    queryKey: ["cart-count", user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count } = await supabase
        .from("cart_items")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      return count ?? 0;
    },
    enabled: !!user,
  });

  const isActive = (to: string) => path === to;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid size-8 place-items-center rounded-md bg-brand text-brand-foreground">
            <BookOpen className="size-4" />
          </div>
          <span className="font-display text-xl font-semibold tracking-tight text-brand">
            Maskax Maal
          </span>
        </Link>

        <nav className="ml-6 hidden gap-6 md:flex">
          <Link to="/books" className={`text-sm font-medium transition-colors hover:text-emerald ${isActive("/books") ? "text-foreground" : "text-muted-foreground"}`}>
            {t("nav_library")}
          </Link>
          <Link to="/categories" className={`text-sm font-medium transition-colors hover:text-emerald ${isActive("/categories") ? "text-foreground" : "text-muted-foreground"}`}>
            {t("nav_categories")}
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <div className="hidden items-center rounded-full border p-0.5 text-xs font-semibold sm:flex">
            <button
              onClick={() => setLang("en")}
              className={`rounded-full px-3 py-1 transition-colors ${lang === "en" ? "bg-brand text-brand-foreground" : "text-muted-foreground"}`}
            >EN</button>
            <button
              onClick={() => setLang("so")}
              className={`rounded-full px-3 py-1 transition-colors ${lang === "so" ? "bg-brand text-brand-foreground" : "text-muted-foreground"}`}
            >SO</button>
          </div>

          <Button asChild variant="ghost" size="icon" aria-label="Search" className="hidden sm:inline-flex">
            <Link to="/books"><Search className="size-4" /></Link>
          </Button>

          <Button asChild variant="ghost" size="icon" aria-label={t("nav_cart")} className="relative">
            <Link to="/cart">
              <ShoppingCart className="size-4" />
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-emerald text-[10px] font-bold text-emerald-foreground">
                  {cartCount}
                </span>
              )}
            </Link>
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Account">
                  <User className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate">
                  {user.email}
                  {isSuperadmin && <div className="mt-0.5 text-[10px] font-bold uppercase text-emerald">Superadmin</div>}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/account"><User className="mr-2 size-4" />{t("nav_account")}</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/account/orders"><ShoppingCart className="mr-2 size-4" />{t("nav_orders")}</Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin"><Shield className="mr-2 size-4" />{t("nav_admin")}</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="mr-2 size-4" />{t("nav_signout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Button asChild size="sm" variant="ghost">
                <Link to="/auth">{t("nav_signin")}</Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" className="bg-brand text-brand-foreground hover:bg-brand/90">
                    {t("nav_signup")}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link to="/register/user"><UserPlus className="mr-2 size-4" />{lang === "en" ? "As a reader" : "Sida akhriye"}</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/register/library"><Store className="mr-2 size-4" />{lang === "en" ? "As a bookshop" : "Sida maktabadda"}</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Menu"
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t bg-background md:hidden">
          <div className="mx-auto max-w-7xl space-y-1 px-4 py-3">
            <Link to="/books" onClick={() => setMobileOpen(false)} className="block rounded px-3 py-2 text-sm hover:bg-muted">{t("nav_library")}</Link>
            <Link to="/categories" onClick={() => setMobileOpen(false)} className="block rounded px-3 py-2 text-sm hover:bg-muted">{t("nav_categories")}</Link>
            {!user && (
              <>
                <div className="my-2 border-t" />
                <Link to="/auth" onClick={() => setMobileOpen(false)} className="block rounded px-3 py-2 text-sm hover:bg-muted">{t("nav_signin")}</Link>
                <Link to="/register/user" onClick={() => setMobileOpen(false)} className="block rounded px-3 py-2 text-sm hover:bg-muted">
                  {lang === "en" ? "Sign up as reader" : "Iska diiwaan geli sida akhriye"}
                </Link>
                <Link to="/register/library" onClick={() => setMobileOpen(false)} className="block rounded px-3 py-2 text-sm hover:bg-muted">
                  {lang === "en" ? "Register bookshop" : "Diiwaan geli maktabad"}
                </Link>
              </>
            )}
            <div className="my-2 flex gap-2 border-t pt-3">
              <button onClick={() => setLang("en")} className={`flex-1 rounded px-3 py-1.5 text-xs font-semibold ${lang === "en" ? "bg-brand text-brand-foreground" : "border"}`}>EN</button>
              <button onClick={() => setLang("so")} className={`flex-1 rounded px-3 py-1.5 text-xs font-semibold ${lang === "so" ? "bg-brand text-brand-foreground" : "border"}`}>SO</button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
