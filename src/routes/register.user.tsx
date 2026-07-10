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
import { UserPlus, ChevronLeft } from "lucide-react";

export const Route = createFileRoute("/register/user")({
  head: () => ({
    meta: [
      { title: "Reader sign up — Maskax Maal" },
      { name: "description", content: "Create your free reader account and start exploring the Somali digital library." },
    ],
  }),
  component: RegisterUser,
});

function RegisterUser() {
  const { user } = useAuth();
  const { lang } = useI18n();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) nav({ to: "/" });
  }, [user, nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/`;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: redirectUrl, data: { full_name: fullName } },
      });
      if (error) throw error;
      if (data.user && phone) {
        await supabase.from("profiles").update({ phone }).eq("id", data.user.id);
      }
      toast.success(lang === "en" ? "Welcome to Maskax Maal!" : "Ku soo dhawoow Maskax Maal!");
      nav({ to: "/" });
    } catch (err: any) {
      const msg = err?.message ?? "Error";
      if (msg.toLowerCase().includes("already registered")) {
        toast.error(lang === "en" ? "Email already registered — try signing in." : "Iimaylkan hore ayaa loo diiwaan geliyay.");
      } else toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="mx-auto grid max-w-5xl gap-12 px-6 py-16 md:grid-cols-2 md:py-24">
        <div>
          <Link to="/register" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-emerald">
            <ChevronLeft className="size-4" /> {lang === "en" ? "Change account type" : "Bedel nooca akoonka"}
          </Link>
          <div className="mt-6 inline-flex items-center gap-2 rounded-md bg-emerald/10 px-3 py-1 text-xs font-semibold text-emerald">
            <UserPlus className="size-3.5" /> {lang === "en" ? "Reader account" : "Akoon akhriye"}
          </div>
          <h1 className="mt-4 font-display text-4xl leading-tight md:text-5xl">
            {lang === "en" ? "Your library, everywhere." : "Maktabaddaada, meel kasta."}
          </h1>
          <p className="mt-4 max-w-md text-muted-foreground">
            {lang === "en"
              ? "Free forever. Buy books, read online, and keep your library on every device."
              : "Bilaash weligaa. Iibso buugag, si toos ah u akhri, maktabadaadana ku hayso qalab kasta."}
          </p>
        </div>
        <div className="rounded-2xl border bg-paper p-8 shadow-card">
          <h2 className="font-display text-2xl">
            {lang === "en" ? "Create your account" : "Samee akoonkaaga"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {lang === "en" ? "Takes less than a minute." : "Ka yar hal daqiiqad."}
          </p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <Label>{lang === "en" ? "Full name" : "Magaca oo dhan"}</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required className="mt-1.5" />
            </div>
            <div>
              <Label>{lang === "en" ? "Email" : "Iimayl"}</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1.5" />
            </div>
            <div>
              <Label>{lang === "en" ? "Phone (optional)" : "Telefoon (ikhtiyaari)"}</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+252 …" className="mt-1.5" />
            </div>
            <div>
              <Label>{lang === "en" ? "Password" : "Furaha sirta"}</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="mt-1.5" />
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-brand text-brand-foreground hover:bg-brand/90">
              {loading ? "…" : lang === "en" ? "Create account" : "Samee akoon"}
            </Button>
            <Link to="/auth" className="block text-center text-xs text-muted-foreground hover:underline">
              {lang === "en" ? "Already have an account? Sign in" : "Akoon ma leedahay? Gal"}
            </Link>
          </form>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
