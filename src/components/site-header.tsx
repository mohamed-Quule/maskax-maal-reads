import { Link, useRouterState } from "@tanstack/react-router";
import { ShoppingCart, User, LogOut, Search, Shield, Menu, X, Library } from "lucide-react";
import logoAsset from "@/assets/maskax-logo.png.asset.json";
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
  const { user, isAdmin, signOut } = useAuth();
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
          <img
            src={logoAsset.url}
            alt="Maskax Maal logo"
            className="size-9 rounded-md object-contain"
            width={36}
            height={36}
          />
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
          {user && (
            <>
              <Link to="/account/library" className={`text-sm font-medium transition-colors hover:text-emerald ${isActive("/account/library") ? "text-foreground" : "text-muted-foreground"}`}>
                {lang === "en" ? "My library" : "Maktabaddayda"}
              </Link>
              <Link to="/account/orders" className={`text-sm font-medium transition-colors hover:text-emerald ${isActive("/account/orders") ? "text-foreground" : "text-muted-foreground"}`}>
                {t("nav_orders")}
              </Link>
            </>
          )}
          {isAdmin && (
            <Link to="/admin" className={`inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-emerald ${path.startsWith("/admin") ? "text-foreground" : "text-muted-foreground"}`}>
              <Shield className="size-3.5" /> {t("nav_admin")}
            </Link>
          )}
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
              <DropdownMenuContent align="end" sideOffset={8} className="w-60 rounded-xl p-1.5 shadow-elegant">
                <DropdownMenuLabel className="truncate px-2 py-1.5 text-xs font-normal text-muted-foreground">
                  {user.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-2 py-2 text-sm">
                  <Link to="/account"><User className="mr-2 size-4" />{t("nav_account")}</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuItem
                  onClick={signOut}
                  className="cursor-pointer rounded-lg px-2 py-2 text-sm text-destructive focus:bg-destructive/10 focus:text-destructive"
                >
                  <LogOut className="mr-2 size-4" />{t("nav_signout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Button asChild size="sm" variant="ghost">
                <Link to="/auth">{t("nav_signin")}</Link>
              </Button>
              <Button asChild size="sm" className="bg-brand text-brand-foreground hover:bg-brand/90">
                <Link to="/auth">{t("nav_signup")}</Link>
              </Button>
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
            {user && (
              <>
                <div className="my-2 border-t" />
                <Link to="/account/library" onClick={() => setMobileOpen(false)} className="block rounded px-3 py-2 text-sm hover:bg-muted">{lang === "en" ? "My library" : "Maktabaddayda"}</Link>
                <Link to="/account/orders" onClick={() => setMobileOpen(false)} className="block rounded px-3 py-2 text-sm hover:bg-muted">{t("nav_orders")}</Link>
                {isAdmin && (
                  <Link to="/admin" onClick={() => setMobileOpen(false)} className="block rounded px-3 py-2 text-sm font-semibold text-emerald hover:bg-muted">{t("nav_admin")}</Link>
                )}
              </>
            )}
            {!user && (
              <>
                <div className="my-2 border-t" />
                <Link to="/auth" onClick={() => setMobileOpen(false)} className="block rounded px-3 py-2 text-sm hover:bg-muted">{t("nav_signin")}</Link>
                <Link to="/auth" onClick={() => setMobileOpen(false)} className="block rounded px-3 py-2 text-sm hover:bg-muted">{t("nav_signup")}</Link>
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
