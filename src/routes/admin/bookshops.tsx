import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { createBookshopWithAdmin, getPlatformStats } from "@/lib/superadmin.functions";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Store, Plus, Users, ShieldCheck } from "lucide-react";
import { shortDate } from "@/lib/format";

export const Route = createFileRoute("/admin/bookshops")({ component: AdminBookshops });

function AdminBookshops() {
  const { isSuperadmin } = useAuth();
  const qc = useQueryClient();
  const createFn = useServerFn(createBookshopWithAdmin);
  const statsFn = useServerFn(getPlatformStats);

  const { data: shops = [] } = useQuery({
    queryKey: ["bookshops"],
    queryFn: async () => {
      const { data, error } = await supabase.from("bookshops").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["platform-stats"],
    queryFn: () => statsFn(),
    enabled: isSuperadmin,
  });

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    city: "",
    phone: "",
    address: "",
    adminFullName: "",
    adminEmail: "",
    adminPassword: "",
  });
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await createFn({ data: form });
      toast.success("Bookshop and admin created");
      setOpen(false);
      setForm({ name: "", slug: "", city: "", phone: "", address: "", adminFullName: "", adminEmail: "", adminPassword: "" });
      qc.invalidateQueries({ queryKey: ["bookshops"] });
      qc.invalidateQueries({ queryKey: ["platform-stats"] });
    } catch (err: any) {
      toast.error(err?.message ?? "Failed");
    } finally {
      setBusy(false);
    }
  };

  if (!isSuperadmin) {
    return (
      <div className="p-8">
        <div className="rounded-lg border bg-card p-8 text-center">
          <ShieldCheck className="mx-auto size-10 text-muted-foreground" />
          <h2 className="mt-3 font-display text-xl">Superadmin only</h2>
          <p className="text-sm text-muted-foreground">This section is restricted to the platform superadmin.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">Bookshops (Maktabadaha)</h1>
          <p className="text-sm text-muted-foreground">Register bookshops and create their admin accounts.</p>
        </div>
        <Button onClick={() => setOpen((v) => !v)} className="bg-emerald text-emerald-foreground hover:bg-emerald/90">
          <Plus className="mr-1 size-4" /> {open ? "Close" : "New bookshop"}
        </Button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard icon={Store} label="Registered bookshops" value={String(stats?.bookshops ?? 0)} />
        <StatCard icon={Users} label="Total users" value={String(stats?.totalUsers ?? 0)} />
        <StatCard icon={ShieldCheck} label="Admins" value={String((stats?.byRole?.admin ?? 0) + (stats?.byRole?.superadmin ?? 0))} />
      </div>

      {open && (
        <form onSubmit={submit} className="mt-6 grid gap-4 rounded-lg border bg-card p-6 md:grid-cols-2">
          <div className="md:col-span-2 font-display text-lg">Bookshop details</div>
          <Field label="Name" v={form.name} on={(v) => setForm({ ...form, name: v })} required />
          <Field label="Slug (url)" v={form.slug} on={(v) => setForm({ ...form, slug: v.toLowerCase().replace(/[^a-z0-9-]/g, "-") })} required />
          <Field label="City" v={form.city} on={(v) => setForm({ ...form, city: v })} />
          <Field label="Phone" v={form.phone} on={(v) => setForm({ ...form, phone: v })} />
          <Field label="Address" v={form.address} on={(v) => setForm({ ...form, address: v })} cls="md:col-span-2" />

          <div className="md:col-span-2 mt-2 border-t pt-4 font-display text-lg">Admin account</div>
          <Field label="Admin full name" v={form.adminFullName} on={(v) => setForm({ ...form, adminFullName: v })} required />
          <Field label="Admin email" type="email" v={form.adminEmail} on={(v) => setForm({ ...form, adminEmail: v })} required />
          <Field label="Admin password" type="password" v={form.adminPassword} on={(v) => setForm({ ...form, adminPassword: v })} required />

          <div className="md:col-span-2 flex justify-end">
            <Button type="submit" disabled={busy} className="bg-brand text-brand-foreground hover:bg-brand/90">
              {busy ? "Creating…" : "Create bookshop"}
            </Button>
          </div>
        </form>
      )}

      <div className="mt-8 overflow-hidden rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3">Bookshop</th>
              <th className="p-3">City</th>
              <th className="p-3">Phone</th>
              <th className="p-3">Status</th>
              <th className="p-3">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {shops.length === 0 ? (
              <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No bookshops yet.</td></tr>
            ) : shops.map((s: any) => (
              <tr key={s.id}>
                <td className="p-3">
                  <div className="font-semibold">{s.name}</div>
                  <div className="text-xs text-muted-foreground">/{s.slug}</div>
                </td>
                <td className="p-3">{s.city ?? "—"}</td>
                <td className="p-3 font-mono text-xs">{s.phone ?? "—"}</td>
                <td className="p-3">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${s.is_active ? "bg-emerald/10 text-emerald" : "bg-muted"}`}>
                    {s.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="p-3 text-muted-foreground">{shortDate(s.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Field({ label, v, on, type = "text", required, cls }: { label: string; v: string; on: (s: string) => void; type?: string; required?: boolean; cls?: string }) {
  return (
    <div className={cls}>
      <Label>{label}</Label>
      <Input type={type} value={v} onChange={(e) => on(e.target.value)} required={required} className="mt-1.5" />
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="flex items-center gap-3">
        <div className="grid size-10 place-items-center rounded-md bg-brand/10 text-brand">
          <Icon className="size-5" />
        </div>
        <div className="text-xs uppercase tracking-widest text-muted-foreground">{label}</div>
      </div>
      <div className="mt-3 font-display text-3xl font-semibold">{value}</div>
    </div>
  );
}
