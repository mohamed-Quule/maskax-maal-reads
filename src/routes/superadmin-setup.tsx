import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { bootstrapSuperadmin } from "@/lib/superadmin.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/superadmin-setup")({ component: SetupPage });

function SetupPage() {
  const bootstrap = useServerFn(bootstrapSuperadmin);
  const nav = useNavigate();
  const [email, setEmail] = useState("superadmin@maskaxmaal.com");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("Super Administrator");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await bootstrap({ data: { email, password, fullName } });
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("Superadmin created. You are signed in.");
      nav({ to: "/admin" });
    } catch (err: any) {
      toast.error(err?.message ?? "Setup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-brand p-6 text-brand-foreground">
      <div className="w-full max-w-md rounded-2xl bg-background p-8 text-foreground shadow-elegant">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-lg bg-emerald/10 text-emerald">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl">Superadmin Setup</h1>
            <p className="text-xs text-muted-foreground">One-time bootstrap. Refuses after first use.</p>
          </div>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label>Full name</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1.5" required />
          </div>
          <div>
            <Label>Email (username)</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1.5" required />
          </div>
          <div>
            <Label>Password</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1.5" minLength={8} required />
            <p className="mt-1 text-xs text-muted-foreground">Use at least 8 characters, mix letters & numbers.</p>
          </div>
          <Button type="submit" disabled={loading} className="w-full bg-brand text-brand-foreground hover:bg-brand/90">
            {loading ? "Creating…" : "Create Superadmin & Sign in"}
          </Button>
          <Link to="/auth" className="block text-center text-xs text-muted-foreground hover:underline">
            Already have an account? Sign in
          </Link>
        </form>
      </div>
    </div>
  );
}
