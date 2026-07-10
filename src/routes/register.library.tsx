import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";
import { Store, ChevronLeft, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/register/library")({
  head: () => ({
    meta: [
      { title: "Register your bookshop — Maskax Maal" },
      { name: "description", content: "Apply to register your bookshop or library on the Maskax Maal platform." },
    ],
  }),
  component: RegisterLibrary,
});

function RegisterLibrary() {
  const { lang } = useI18n();
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    name: "",
    city: "",
    phone: "",
    email: "",
    address: "",
    owner_full_name: "",
    message: "",
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from("bookshop_applications").insert(form);
      if (error) throw error;
      setDone(true);
      toast.success(lang === "en" ? "Application submitted!" : "Codsigaaga waa la diray!");
    } catch (err: any) {
      toast.error(err?.message ?? "Error");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <section className="mx-auto max-w-2xl px-6 py-24 text-center">
          <div className="mx-auto grid size-16 place-items-center rounded-full bg-emerald/10 text-emerald">
            <CheckCircle2 className="size-8" />
          </div>
          <h1 className="mt-6 font-display text-3xl">
            {lang === "en" ? "Application received" : "Codsigaaga waa la helay"}
          </h1>
          <p className="mt-3 text-muted-foreground">
            {lang === "en"
              ? "Our team will review your bookshop application and contact you within 2 business days at the email or phone you provided."
              : "Kooxdayadu way dib u eegi doontaa codsigaaga, waxaanan kula soo xiriiri doonaa 2 maalmood gudahood."}
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Button onClick={() => nav({ to: "/" })} className="bg-brand text-brand-foreground hover:bg-brand/90">
              {lang === "en" ? "Back home" : "Ku noqo bogga hore"}
            </Button>
          </div>
        </section>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="mx-auto grid max-w-6xl gap-12 px-6 py-16 md:grid-cols-[1fr_1.2fr] md:py-24">
        <div>
          <Link to="/register" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-emerald">
            <ChevronLeft className="size-4" /> {lang === "en" ? "Change account type" : "Bedel nooca akoonka"}
          </Link>
          <div className="mt-6 inline-flex items-center gap-2 rounded-md bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
            <Store className="size-3.5" /> {lang === "en" ? "Bookshop application" : "Codsi maktabadeed"}
          </div>
          <h1 className="mt-4 font-display text-4xl leading-tight md:text-5xl">
            {lang === "en" ? "Sell on Maskax Maal." : "Ku iibi Maskax Maal."}
          </h1>
          <p className="mt-4 max-w-md text-muted-foreground">
            {lang === "en"
              ? "Register your bookshop and get a dedicated admin dashboard, sales analytics, and access to thousands of readers across the Horn of Africa."
              : "Isdiiwaan geli maktabaddaada, hel dashboard maamul gaar ah, warbixin iib, iyo kumanaan akhriste."}
          </p>
          <ul className="mt-8 space-y-3 text-sm">
            <li className="flex gap-3"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald" /> {lang === "en" ? "Own inventory & pricing" : "Kayd iyo qiimo iskaa"}</li>
            <li className="flex gap-3"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald" /> {lang === "en" ? "Weekly settlement via EVC / Zaad" : "Bixin toddobaadle EVC / Zaad"}</li>
            <li className="flex gap-3"><CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald" /> {lang === "en" ? "Bilingual product pages" : "Bogag alaab labo-luqadeed"}</li>
          </ul>
        </div>

        <div className="rounded-2xl border bg-paper p-8 shadow-card">
          <h2 className="font-display text-2xl">
            {lang === "en" ? "Register your bookshop" : "Diiwaan geli maktabadaada"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {lang === "en" ? "We'll review and reply within 2 business days." : "Waxaan kaa jawaabi doonaa 2 maalmood gudahood."}
          </p>
          <form onSubmit={submit} className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>{lang === "en" ? "Bookshop name" : "Magaca maktabadda"}</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="mt-1.5" />
            </div>
            <div>
              <Label>{lang === "en" ? "City" : "Magaalada"}</Label>
              <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="mt-1.5" />
            </div>
            <div>
              <Label>{lang === "en" ? "Phone" : "Telefoon"}</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required className="mt-1.5" placeholder="+252 …" />
            </div>
            <div className="sm:col-span-2">
              <Label>{lang === "en" ? "Address" : "Cinwaanka"}</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="mt-1.5" />
            </div>
            <div>
              <Label>{lang === "en" ? "Owner full name" : "Magaca milkiilaha"}</Label>
              <Input value={form.owner_full_name} onChange={(e) => setForm({ ...form, owner_full_name: e.target.value })} required className="mt-1.5" />
            </div>
            <div>
              <Label>{lang === "en" ? "Contact email" : "Iimaylka xiriirka"}</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="mt-1.5" />
            </div>
            <div className="sm:col-span-2">
              <Label>{lang === "en" ? "Tell us about your shop (optional)" : "Nooga sheeg dukaankaaga (ikhtiyaari)"}</Label>
              <Textarea rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="mt-1.5" />
            </div>
            <Button type="submit" disabled={loading} className="sm:col-span-2 w-full bg-brand text-brand-foreground hover:bg-brand/90">
              {loading ? "…" : lang === "en" ? "Submit application" : "Dir codsiga"}
            </Button>
          </form>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
