import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { UserCircle2, KeyRound } from "lucide-react";

export const Route = createFileRoute("/admin/profile")({ component: AdminProfile });

function AdminProfile() {
  const { user } = useAuth();
  const { lang } = useI18n();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");

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
    const { error } = await supabase.from("profiles").update({ full_name: fullName, phone }).eq("id", user.id);
    if (error) toast.error(error.message);
    else toast.success(lang === "en" ? "Profile saved" : "Akoonka waa la kaydiyay");
  };

  const changePassword = async () => {
    if (newPassword.length < 8) return toast.error(lang === "en" ? "Password must be at least 8 characters" : "Furaha ha ka yaraanin 8 xaraf");
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) toast.error(error.message);
    else {
      toast.success(lang === "en" ? "Password updated" : "Furaha waa la beddelay");
      setNewPassword("");
    }
  };

  return (
    <div className="p-8">
      <h1 className="flex items-center gap-2 font-display text-3xl">
        <UserCircle2 className="size-7" /> {lang === "en" ? "My profile" : "Akoonkayga"}
      </h1>
      <p className="text-sm text-muted-foreground">
        {lang === "en" ? "Manage your admin account." : "Maamul akoonkaaga."}
      </p>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <section className="rounded-lg border bg-card p-6">
          <h3 className="font-display text-lg">{lang === "en" ? "Profile" : "Akoon"}</h3>
          <div className="mt-4 space-y-4">
            <div>
              <Label>Email</Label>
              <Input value={user?.email ?? ""} disabled className="mt-1.5" />
            </div>
            <div>
              <Label>{lang === "en" ? "Full name" : "Magaca"}</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label>{lang === "en" ? "Phone" : "Telefoon"}</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1.5" />
            </div>
            <Button onClick={saveProfile} className="bg-brand text-brand-foreground hover:bg-brand/90">
              {lang === "en" ? "Save" : "Kaydi"}
            </Button>
          </div>
        </section>

        <section className="rounded-lg border bg-card p-6">
          <h3 className="flex items-center gap-2 font-display text-lg">
            <KeyRound className="size-4" /> {lang === "en" ? "Change password" : "Beddel furaha"}
          </h3>
          <div className="mt-4 space-y-4">
            <div>
              <Label>{lang === "en" ? "New password" : "Furaha cusub"}</Label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="mt-1.5" minLength={8} />
            </div>
            <Button onClick={changePassword} className="bg-brand text-brand-foreground hover:bg-brand/90">
              {lang === "en" ? "Update password" : "Cusboonaysi"}
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
