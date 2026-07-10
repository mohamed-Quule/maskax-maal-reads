import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Settings as SettingsIcon, ShieldCheck, KeyRound, Globe, Palette } from "lucide-react";

export const Route = createFileRoute("/admin/settings")({ component: AdminSettings });

function AdminSettings() {
  const { user, isAdmin, isSuperadmin } = useAuth();
  const { lang, setLang } = useI18n();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("full_name, phone").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (data) {
        setFullName(data.full_name ?? "");
        setPhone(data.phone ?? "");
      }
    });
  }, [user]);

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ full_name: fullName, phone }).eq("id", user.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Profile saved");
  };

  const changePassword = async () => {
    if (newPassword.length < 8) return toast.error("Password must be at least 8 characters");
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) toast.error(error.message);
    else {
      toast.success("Password updated");
      setNewPassword("");
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-8"><div className="rounded-lg border bg-card p-8 text-center">
        <ShieldCheck className="mx-auto size-10 text-muted-foreground" />
        <h2 className="mt-3 font-display text-xl">Admins only</h2>
      </div></div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl flex items-center gap-2"><SettingsIcon className="size-7" /> {lang === "en" ? "Settings" : "Habaynta"}</h1>
          <p className="text-sm text-muted-foreground">
            {lang === "en" ? "Manage your account and platform preferences." : "Maamul akoonkaaga iyo doorashada shabakadda."}
          </p>
        </div>
        {isSuperadmin && <span className="rounded-full bg-emerald/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald">Superadmin</span>}
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <section className="rounded-lg border bg-card p-6">
          <h3 className="flex items-center gap-2 font-display text-lg"><SettingsIcon className="size-4" /> {lang === "en" ? "Profile" : "Astaanta"}</h3>
          <div className="mt-4 space-y-4">
            <div>
              <Label>Email</Label>
              <Input value={user?.email ?? ""} disabled className="mt-1.5" />
            </div>
            <div>
              <Label>{lang === "en" ? "Full name" : "Magaca oo dhan"}</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label>{lang === "en" ? "Phone" : "Telefoon"}</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1.5" />
            </div>
            <Button onClick={saveProfile} disabled={saving} className="bg-brand text-brand-foreground hover:bg-brand/90">
              {saving ? "Saving…" : lang === "en" ? "Save profile" : "Kaydi astaanta"}
            </Button>
          </div>
        </section>

        <section className="rounded-lg border bg-card p-6">
          <h3 className="flex items-center gap-2 font-display text-lg"><KeyRound className="size-4" /> {lang === "en" ? "Security" : "Sireed"}</h3>
          <div className="mt-4 space-y-4">
            <div>
              <Label>{lang === "en" ? "New password" : "Furaha cusub"}</Label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="mt-1.5" minLength={8} />
              <p className="mt-1 text-xs text-muted-foreground">{lang === "en" ? "Minimum 8 characters." : "Ugu yaraan 8 xaraf."}</p>
            </div>
            <Button onClick={changePassword} className="bg-brand text-brand-foreground hover:bg-brand/90">
              {lang === "en" ? "Update password" : "Cusboonaysi furaha"}
            </Button>
          </div>
        </section>

        <section className="rounded-lg border bg-card p-6">
          <h3 className="flex items-center gap-2 font-display text-lg"><Globe className="size-4" /> {lang === "en" ? "Language" : "Luuqadda"}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{lang === "en" ? "Interface language for your dashboard." : "Luuqadda dashboarkaaga."}</p>
          <div className="mt-4 inline-flex rounded-md border p-1">
            <button onClick={() => setLang("en")} className={`rounded px-4 py-1.5 text-sm font-semibold ${lang === "en" ? "bg-brand text-brand-foreground" : "text-muted-foreground"}`}>English</button>
            <button onClick={() => setLang("so")} className={`rounded px-4 py-1.5 text-sm font-semibold ${lang === "so" ? "bg-brand text-brand-foreground" : "text-muted-foreground"}`}>Soomaali</button>
          </div>
        </section>

        <section className="rounded-lg border bg-card p-6">
          <h3 className="flex items-center gap-2 font-display text-lg"><Palette className="size-4" /> {lang === "en" ? "Platform" : "Shabakadda"}</h3>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">{lang === "en" ? "Brand" : "Astaanta"}</span><b>Maskax Maal</b></div>
            <div className="flex justify-between"><span className="text-muted-foreground">{lang === "en" ? "Currency" : "Lacagta"}</span><b>USD ($)</b></div>
            <div className="flex justify-between"><span className="text-muted-foreground">{lang === "en" ? "Payment" : "Lacag bixin"}</span><b>EVC / Zaad / Sahal</b></div>
            <div className="flex justify-between"><span className="text-muted-foreground">{lang === "en" ? "Your role" : "Doorkaaga"}</span>
              <b className="uppercase">{isSuperadmin ? "Superadmin" : "Admin"}</b>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
