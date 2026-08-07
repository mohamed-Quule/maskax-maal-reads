import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormField } from "@/components/form-field";
import { useFormValidation } from "@/hooks/use-form-validation";
import { changePasswordSchema, profileSchema } from "@/lib/schemas";
import { saveProfile as saveProfileFn } from "@/lib/validated-writes.functions";
import { toast } from "sonner";
import { UserCircle2, KeyRound, Eye, EyeOff } from "lucide-react";

export const Route = createFileRoute("/admin/profile")({ component: AdminProfile });

function AdminProfile() {
  const { user } = useAuth();
  const { lang } = useI18n();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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

  const pv = useFormValidation(
    useMemo(() => profileSchema(lang), [lang]),
    useMemo(() => ({ full_name: fullName, phone }), [fullName, phone]),
  );
  const wv = useFormValidation(
    useMemo(() => changePasswordSchema(lang), [lang]),
    useMemo(() => ({ password: newPassword }), [newPassword]),
  );
  const persistProfile = useServerFn(saveProfileFn);

  const saveProfile = async () => {
    const parsed = pv.validateAll();
    if (!parsed) return;
    setSaving(true);
    try {
      await persistProfile({ data: { lang, full_name: parsed.full_name, phone: parsed.phone } });
      toast.success(lang === "en" ? "Profile saved" : "Akoonka waa la kaydiyay");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    const parsed = wv.validateAll();
    if (!parsed) return;
    const { error } = await supabase.auth.updateUser({ password: parsed.password });
    if (error) toast.error(error.message);
    else {
      toast.success(lang === "en" ? "Password updated" : "Furaha waa la beddelay");
      setNewPassword("");
      wv.reset();
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
            <FormField label={lang === "en" ? "Full name" : "Magaca"} required error={pv.errors.full_name}>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                onBlur={() => pv.touch("full_name")}
                maxLength={80}
              />
            </FormField>
            <FormField label={lang === "en" ? "Phone" : "Telefoon"} error={pv.errors.phone}>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^\d+\s\-()]/g, ""))}
                onBlur={() => pv.touch("phone")}
                inputMode="tel"
                placeholder="+252 …"
                maxLength={20}
              />
            </FormField>
            <Button onClick={saveProfile} disabled={saving} className="bg-brand text-brand-foreground hover:bg-brand/90">
              {lang === "en" ? "Save" : "Kaydi"}
            </Button>
          </div>
        </section>

        <section className="rounded-lg border bg-card p-6">
          <h3 className="flex items-center gap-2 font-display text-lg">
            <KeyRound className="size-4" /> {lang === "en" ? "Change password" : "Beddel furaha"}
          </h3>
          <div className="mt-4 space-y-4">
            <FormField
              label={lang === "en" ? "New password" : "Furaha cusub"}
              required
              error={wv.errors.password}
              hint={
                lang === "en"
                  ? "At least 8 characters, with a letter and a number."
                  : "Ugu yaraan 8 xaraf, oo leh xaraf iyo lambar."
              }
            >
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  onBlur={() => wv.touch("password")}
                  autoComplete="new-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </FormField>
            <Button onClick={changePassword} className="bg-brand text-brand-foreground hover:bg-brand/90">
              {lang === "en" ? "Update password" : "Cusboonaysi"}
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
