import { Link, useRouterState } from "@tanstack/react-router";
import { BookOpen, ShoppingCart, User, LogOut, Search, Shield } from "lucide-react";
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

  const navLink = (to: string, label: string) => (
    <Link
      to={to}
      className={`text-sm font-medium transition-colors hover:text-emerald ${
        path === to ? "text-foreground" : "text-muted-foreground"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid size-8 place-items-center rounded-md bg-brand text-brand-foreground">
              <BookOpen className="size-4" />
            </div>
            <span className="font-display text-xl font-semibold tracking-tight text-brand">
              Maskax Maal
            </span>
          </Link>
          <nav className="hidden gap-6 md:flex">
            {navLink("/books", t("nav_library"))}
            {navLink("/categories", t("nav_categories"))}
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden items-center rounded-full border p-0.5 text-xs font-semibold sm:flex">
            <button
              onClick={() => setLang("en")}
              className={`rounded-full px-3 py-1 transition-colors ${
                lang === "en" ? "bg-brand text-brand-foreground" : "text-muted-foreground"
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLang("so")}
              className={`rounded-full px-3 py-1 transition-colors ${
                lang === "so" ? "bg-brand text-brand-foreground" : "text-muted-foreground"
              }`}
            >
              SO
            </button>
          </div>

          <Button asChild variant="ghost" size="icon" aria-label="Search">
            <Link to="/books">
              <Search className="size-4" />
            </Link>
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
                <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
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
            <Button asChild size="sm" className="bg-brand text-brand-foreground hover:bg-brand/90">
              <Link to="/auth">{t("nav_signin")}</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
