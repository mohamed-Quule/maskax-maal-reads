import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { BookOpen } from "lucide-react";

export const Route = createFileRoute("/auth")({ component: AuthPage });

function AuthPage() {
  const { user } = useAuth();
  const { lang } = useI18n();
  const nav = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) nav({ to: "/" });
  }, [user, nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const redirectUrl = `${window.location.origin}/`;
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        toast.success(lang === "en" ? "Welcome! You're signed in." : "Soo dhawoow!");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      const msg = err?.message ?? "Error";
      if (msg.toLowerCase().includes("invalid login")) {
        toast.error(lang === "en" ? "Invalid email or password" : "Iimayl ama furaha khaldan");
      } else if (msg.toLowerCase().includes("already registered")) {
        toast.error(lang === "en" ? "Email already registered — try signing in." : "Iimaylkan hore ayaa loo diiwaan geliyay.");
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="mx-auto grid max-w-5xl gap-12 px-6 py-16 md:grid-cols-2 md:py-24">
        <div className="hidden md:block">
          <div className="inline-flex items-center gap-2 rounded-md bg-brand/5 px-3 py-1 text-xs font-semibold text-brand">
            <BookOpen className="size-3.5" /> Maskax Maal
          </div>
          <h1 className="mt-6 font-display text-5xl leading-tight">
            {mode === "signin"
              ? lang === "en" ? "Welcome back to your library." : "Ku soo dhawoow maktabadaada."
              : lang === "en" ? "Start your reading journey." : "Bilow safarkaaga akhriska."}
          </h1>
          <p className="mt-4 max-w-md text-muted-foreground">
            {lang === "en"
              ? "Sync your library across devices, save favorites, and support Somali authors."
              : "La wadaag maktabadaada qalabkaaga, kaydso kuwa aad jeceshahay, oo taageer qorayaasha Soomaalida."}
          </p>
        </div>
        <div className="rounded-2xl border bg-paper p-8 shadow-card">
          <div className="mb-6 flex rounded-md bg-muted p-1 text-sm font-semibold">
            <button
              onClick={() => setMode("signin")}
              className={`flex-1 rounded px-3 py-2 ${mode === "signin" ? "bg-background shadow-sm" : "text-muted-foreground"}`}
            >
              {lang === "en" ? "Sign in" : "Gal"}
            </button>
            <button
              onClick={() => setMode("signup")}
              className={`flex-1 rounded px-3 py-2 ${mode === "signup" ? "bg-background shadow-sm" : "text-muted-foreground"}`}
            >
              {lang === "en" ? "Create account" : "Samee akoon"}
            </button>
          </div>
          <form onSubmit={submit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <Label>{lang === "en" ? "Full name" : "Magaca oo dhan"}</Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required className="mt-1.5" />
              </div>
            )}
            <div>
              <Label>{lang === "en" ? "Email" : "Iimayl"}</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1.5" />
            </div>
            <div>
              <Label>{lang === "en" ? "Password" : "Furaha sirta"}</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="mt-1.5" />
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-brand text-brand-foreground hover:bg-brand/90">
              {loading ? "…" : mode === "signin" ? (lang === "en" ? "Sign in" : "Gal") : (lang === "en" ? "Create account" : "Samee akoon")}
            </Button>
          </form>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
