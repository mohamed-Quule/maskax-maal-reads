import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormField } from "@/components/form-field";
import { useFormValidation } from "@/hooks/use-form-validation";
import { profileSchema, changePasswordSchema } from "@/lib/schemas";
import { saveProfile as saveProfileFn } from "@/lib/validated-writes.functions";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { money } from "@/lib/format";
import { User, ShoppingBag, Library as LibraryIcon, BookOpen, Sparkles, KeyRound, Eye, EyeOff } from "lucide-react";


export const Route = createFileRoute("/account/")({ component: Account });

function Account() {
  const { user, loading } = useAuth();
  const { lang } = useI18n();
  const nav = useNavigate();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => { if (!loading && !user) nav({ to: "/auth" }); }, [loading, user, nav]);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: summary } = useQuery({
    queryKey: ["account-summary", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const [{ data: orders }, { count: libCount }, { data: recent }] = await Promise.all([
        supabase.from("orders").select("total, payment_status").eq("user_id", user.id),
        supabase.from("library").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase
          .from("library")
          .select("id, granted_at, books(id, slug, title, author, cover_url)")
          .eq("user_id", user.id)
          .order("granted_at", { ascending: false })
          .limit(4),
      ]);
      const paid = (orders ?? []).filter((o: any) => o.payment_status === "paid");
      const spent = paid.reduce((s: number, o: any) => s + Number(o.total), 0);
      return { ordersCount: paid.length, spent, libraryCount: libCount ?? 0, recent: recent ?? [] };
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (profile) {
      setName(profile.full_name ?? "");
      setPhone(profile.phone ?? "");
    }
  }, [profile]);

  const v = useFormValidation(
    useMemo(() => profileSchema(lang), [lang]),
    useMemo(() => ({ full_name: name, phone }), [name, phone]),
  );
  const persistProfile = useServerFn(saveProfileFn);

  const save = useMutation({
    mutationFn: async () => {
      const parsed = v.validateAll();
      if (!parsed) throw new Error(lang === "en" ? "Please fix the highlighted fields." : "Fadlan hagaaji goobaha calaamadaysan.");
      await persistProfile({ data: { lang, full_name: parsed.full_name, phone: parsed.phone } });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success(lang === "en" ? "Profile updated" : "Akoonka waa la cusbooneysiiyay");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [newPassword, setNewPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const pw = useFormValidation(
    useMemo(() => changePasswordSchema(lang), [lang]),
    useMemo(() => ({ password: newPassword }), [newPassword]),
  );
  const changePassword = async () => {
    const parsed = pw.validateAll();
    if (!parsed) return;
    const { error } = await supabase.auth.updateUser({ password: parsed.password });
    if (error) toast.error(error.message);
    else {
      toast.success(lang === "en" ? "Password updated" : "Furaha waa la beddelay");
      setNewPassword("");
      pw.reset();
    }
  };



  if (!user) return null;

  const navLinks = [
    { to: "/account", icon: User, label: lang === "en" ? "Dashboard" : "Dashboarka" },
    { to: "/books", icon: BookOpen, label: lang === "en" ? "Browse books" : "Fiiri buugaag" },
    { to: "/account/library", icon: LibraryIcon, label: lang === "en" ? "My library" : "Maktabaddayda" },
    { to: "/cart", icon: ShoppingBag, label: lang === "en" ? "Cart" : "Gaariga" },
    { to: "/account/orders", icon: ShoppingBag, label: lang === "en" ? "Purchase history" : "Taariikhda iibka" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="mx-auto grid max-w-6xl gap-8 px-6 py-16 md:grid-cols-[220px_1fr]">
        <aside>
          <nav className="space-y-1 text-sm">
            {navLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                activeProps={{ className: "flex items-center gap-2 rounded-md bg-brand/5 px-3 py-2 font-semibold text-brand" }}
                activeOptions={{ exact: true }}
              >
                <l.icon className="size-4" /> {l.label}
              </Link>
            ))}
          </nav>
        </aside>
        <div>
          <h1 className="font-display text-3xl md:text-4xl">
            {lang === "en" ? `Welcome, ${profile?.full_name ?? "reader"}` : `Ku soo dhawoow, ${profile?.full_name ?? "akhriste"}`}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {lang === "en" ? "Your reading dashboard." : "Dashboarka akhriskaaga."}
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <SummaryCard icon={LibraryIcon} label={lang === "en" ? "In library" : "Maktabadda"} value={String(summary?.libraryCount ?? 0)} />
            <SummaryCard icon={ShoppingBag} label={lang === "en" ? "Orders" : "Dalabyo"} value={String(summary?.ordersCount ?? 0)} />
            <SummaryCard icon={Sparkles} label={lang === "en" ? "Total spent" : "Wadarta"} value={money(summary?.spent ?? 0)} />
          </div>

          <div className="mt-8 rounded-lg border bg-card p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl">
                {lang === "en" ? "Recently purchased" : "Kuwa dhowaan la iibsaday"}
              </h2>
              <Link to="/account/library" className="text-xs font-semibold text-emerald hover:underline">
                {lang === "en" ? "View all" : "Fiiri dhamaan"} →
              </Link>
            </div>
            {(summary?.recent ?? []).length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">
                {lang === "en" ? "No purchases yet." : "Weli iib ma jiro."}
              </p>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                {(summary?.recent ?? []).map((r: any) => (
                  <Link key={r.id} to="/account/library" className="group">
                    {r.books.cover_url && (
                      <img
                        src={r.books.cover_url}
                        alt=""
                        className="aspect-[2/3] w-full rounded-md object-cover shadow-card transition group-hover:shadow-elegant"
                      />
                    )}
                    <div className="mt-2 line-clamp-1 text-sm font-medium">{r.books.title}</div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="mt-8 rounded-lg border bg-paper p-6">
            <h2 className="font-display text-xl">{lang === "en" ? "Profile" : "Akoonka"}</h2>
            <div className="mt-4 max-w-lg space-y-4">
              <div>
                <Label>{lang === "en" ? "Email" : "Iimayl"}</Label>
                <Input value={user.email ?? ""} disabled className="mt-1.5" />
              </div>
              <FormField label={lang === "en" ? "Full name" : "Magaca oo dhan"} required error={v.errors.full_name}>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => v.touch("full_name")}
                  maxLength={80}
                  autoComplete="name"
                />
              </FormField>
              <FormField label={lang === "en" ? "Phone" : "Lambar"} error={v.errors.phone}>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^\d+\s\-()]/g, ""))}
                  onBlur={() => v.touch("phone")}
                  placeholder="+252 …"
                  inputMode="tel"
                  autoComplete="tel"
                  maxLength={20}
                />
              </FormField>

              <Button onClick={() => save.mutate()} disabled={save.isPending} className="bg-brand hover:bg-brand/90">
                {lang === "en" ? "Save changes" : "Kaydi"}
              </Button>
            </div>
          </div>

          <div className="mt-8 rounded-lg border bg-card p-6">
            <h2 className="flex items-center gap-2 font-display text-xl">
              <KeyRound className="size-4" /> {lang === "en" ? "Change password" : "Beddel furaha"}
            </h2>
            <div className="mt-4 max-w-lg space-y-4">
              <FormField label={lang === "en" ? "New password" : "Furaha cusub"} required error={pw.errors.password}>
                <div className="relative">
                  <Input
                    type={showPw ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    onBlur={() => pw.touch("password")}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    aria-label={showPw ? "Hide password" : "Show password"}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
                  >
                    {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </FormField>
              <Button variant="outline" onClick={changePassword}>
                {lang === "en" ? "Update password" : "Cusbooneysii furaha"}
              </Button>
            </div>
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground">
        <Icon className="size-4" /> {label}
      </div>
      <div className="mt-2 font-display text-2xl font-semibold text-brand">{value}</div>
    </div>
  );
}
