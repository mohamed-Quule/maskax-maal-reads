import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";
import { Eye, EyeOff, KeyRound } from "lucide-react";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
  head: () => ({
    meta: [
      { title: "Reset password — Maskax Maal" },
      { name: "description", content: "Set a new password for your Maskax Maal reading account." },
      { property: "og:title", content: "Reset password — Maskax Maal" },
      { property: "og:description", content: "Set a new password for your Maskax Maal reading account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function ResetPasswordPage() {
  const { lang } = useI18n();
  const nav = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((evt, sess) => {
      if (evt === "PASSWORD_RECOVERY" || sess) setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      return toast.error(lang === "en" ? "Password must be at least 6 characters" : "Furaha ha ka yaraanin 6 xaraf");
    }
    if (password !== confirm) {
      return toast.error(lang === "en" ? "Passwords do not match" : "Furayaashu isma laha");
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success(lang === "en" ? "Password updated" : "Furaha waa la beddelay");
    nav({ to: "/" });
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="mx-auto max-w-md px-6 py-20">
        <div className="rounded-2xl border bg-paper p-8 shadow-card">
          <div className="inline-flex items-center gap-2 rounded-md bg-brand/5 px-3 py-1 text-xs font-semibold text-brand">
            <KeyRound className="size-3.5" /> {lang === "en" ? "New password" : "Furaha cusub"}
          </div>
          <h1 className="mt-4 font-display text-3xl">
            {lang === "en" ? "Set a new password" : "Deji furaha cusub"}
          </h1>
          {!ready ? (
            <p className="mt-4 text-sm text-muted-foreground">
              {lang === "en"
                ? "Open this page from the reset link we emailed you."
                : "Fadlan ka fur boggan linkiga aan iimaylka kuugu dirnay."}
            </p>
          ) : (
            <form onSubmit={submit} className="mt-6 space-y-4">
              <div>
                <Label>{lang === "en" ? "New password" : "Furaha cusub"}</Label>
                <div className="relative mt-1.5">
                  <Input
                    type={show ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShow((s) => !s)}
                    aria-label={show ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground"
                  >
                    {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
              <div>
                <Label>{lang === "en" ? "Confirm password" : "Xaqiiji furaha"}</Label>
                <Input
                  type={show ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  minLength={6}
                  className="mt-1.5"
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-brand text-brand-foreground hover:bg-brand/90">
                {loading ? "…" : lang === "en" ? "Update password" : "Cusboonaysi furaha"}
              </Button>
            </form>
          )}
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
