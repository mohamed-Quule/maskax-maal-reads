import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Inbox, ShieldCheck, Check, X } from "lucide-react";
import { shortDate } from "@/lib/format";

export const Route = createFileRoute("/admin/applications")({ component: AdminApplications });

function AdminApplications() {
  const { isSuperadmin } = useAuth();
  const qc = useQueryClient();

  const { data: apps = [] } = useQuery({
    queryKey: ["bookshop-applications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookshop_applications")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: isSuperadmin,
  });

  const decide = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "approved" | "rejected" }) => {
      const { data: userRes } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("bookshop_applications")
        .update({ status, reviewed_at: new Date().toISOString(), reviewed_by: userRes.user?.id })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, v) => {
      toast.success(v.status === "approved" ? "Approved" : "Rejected");
      qc.invalidateQueries({ queryKey: ["bookshop-applications"] });
      qc.invalidateQueries({ queryKey: ["pending-applications"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!isSuperadmin) {
    return (
      <div className="p-8">
        <div className="rounded-lg border bg-card p-8 text-center">
          <ShieldCheck className="mx-auto size-10 text-muted-foreground" />
          <h2 className="mt-3 font-display text-xl">Superadmin only</h2>
        </div>
      </div>
    );
  }

  const pending = apps.filter((a: any) => a.status === "pending");
  const reviewed = apps.filter((a: any) => a.status !== "pending");

  return (
    <div className="p-8">
      <h1 className="font-display text-3xl">Bookshop Applications</h1>
      <p className="text-sm text-muted-foreground">Review and approve bookshop registration requests.</p>

      <h2 className="mt-8 flex items-center gap-2 font-display text-xl">
        <Inbox className="size-5" /> Pending ({pending.length})
      </h2>
      <div className="mt-4 space-y-4">
        {pending.length === 0 ? (
          <p className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">No pending applications.</p>
        ) : pending.map((a: any) => (
          <div key={a.id} className="rounded-lg border bg-card p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="font-display text-lg">{a.name}</div>
                <div className="text-xs text-muted-foreground">{a.city ?? "—"} • Applied {shortDate(a.created_at)}</div>
                <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                  <div><span className="text-muted-foreground">Owner:</span> {a.owner_full_name}</div>
                  <div><span className="text-muted-foreground">Email:</span> {a.email}</div>
                  <div><span className="text-muted-foreground">Phone:</span> {a.phone}</div>
                  <div><span className="text-muted-foreground">Address:</span> {a.address ?? "—"}</div>
                </div>
                {a.message && <p className="mt-3 rounded bg-muted/50 p-3 text-sm">{a.message}</p>}
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => decide.mutate({ id: a.id, status: "approved" })} className="bg-emerald text-emerald-foreground hover:bg-emerald/90">
                  <Check className="mr-1 size-4" /> Approve
                </Button>
                <Button size="sm" variant="outline" onClick={() => decide.mutate({ id: a.id, status: "rejected" })}>
                  <X className="mr-1 size-4" /> Reject
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <h2 className="mt-10 font-display text-xl">History ({reviewed.length})</h2>
      <div className="mt-4 overflow-hidden rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3">Bookshop</th>
              <th className="p-3">Owner</th>
              <th className="p-3">Contact</th>
              <th className="p-3">Status</th>
              <th className="p-3">Reviewed</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {reviewed.length === 0 ? (
              <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No reviewed applications yet.</td></tr>
            ) : reviewed.map((a: any) => (
              <tr key={a.id}>
                <td className="p-3 font-semibold">{a.name}</td>
                <td className="p-3">{a.owner_full_name}</td>
                <td className="p-3 text-xs text-muted-foreground">{a.email}<br />{a.phone}</td>
                <td className="p-3">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${a.status === "approved" ? "bg-emerald/10 text-emerald" : "bg-destructive/10 text-destructive"}`}>
                    {a.status}
                  </span>
                </td>
                <td className="p-3 text-muted-foreground">{a.reviewed_at ? shortDate(a.reviewed_at) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
