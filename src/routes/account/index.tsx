import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { User, ShoppingBag } from "lucide-react";

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

  useEffect(() => {
    if (profile) {
      setName(profile.full_name ?? "");
      setPhone(profile.phone ?? "");
    }
  }, [profile]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("profiles").update({ full_name: name, phone }).eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success(lang === "en" ? "Profile updated" : "Akoonka waa la cusbooneysiiyay");
    },
  });

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="mx-auto grid max-w-5xl gap-8 px-6 py-16 md:grid-cols-[220px_1fr]">
        <aside>
          <nav className="space-y-1 text-sm">
            <Link to="/account" className="flex items-center gap-2 rounded-md bg-brand/5 px-3 py-2 font-semibold text-brand">
              <User className="size-4" /> {lang === "en" ? "Profile" : "Akoon"}
            </Link>
            <Link to="/account/orders" className="flex items-center gap-2 rounded-md px-3 py-2 text-muted-foreground hover:bg-muted">
              <ShoppingBag className="size-4" /> {lang === "en" ? "Orders" : "Dalabyada"}
            </Link>
          </nav>
        </aside>
        <div>
          <h1 className="font-display text-3xl">{lang === "en" ? "My profile" : "Akoonkayga"}</h1>
          <div className="mt-8 max-w-lg space-y-4 rounded-lg border bg-paper p-6">
            <div>
              <Label>{lang === "en" ? "Email" : "Iimayl"}</Label>
              <Input value={user.email ?? ""} disabled className="mt-1.5" />
            </div>
            <div>
              <Label>{lang === "en" ? "Full name" : "Magaca oo dhan"}</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5" />
            </div>
            <div>
              <Label>{lang === "en" ? "Phone" : "Lambar"}</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1.5" placeholder="+252 …" />
            </div>
            <Button onClick={() => save.mutate()} disabled={save.isPending} className="bg-brand hover:bg-brand/90">
              {lang === "en" ? "Save changes" : "Kaydi"}
            </Button>
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
