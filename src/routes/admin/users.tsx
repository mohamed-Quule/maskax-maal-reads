import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { shortDate } from "@/lib/format";

export const Route = createFileRoute("/admin/users")({ component: AdminUsers });

function AdminUsers() {
  const { data: users = [] } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const [{ data: profs }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("*"),
      ]);
      const roleMap = new Map<string, string[]>();
      (roles ?? []).forEach((r: any) => {
        const arr = roleMap.get(r.user_id) ?? [];
        arr.push(r.role);
        roleMap.set(r.user_id, arr);
      });
      return (profs ?? []).map((p: any) => ({ ...p, roles: roleMap.get(p.id) ?? ["user"] }));
    },
  });

  return (
    <div className="p-8">
      <h1 className="font-display text-3xl">Users</h1>
      <div className="mt-8 overflow-hidden rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3">User</th>
              <th className="p-3">Phone</th>
              <th className="p-3">Roles</th>
              <th className="p-3">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((u: any) => (
              <tr key={u.id}>
                <td className="p-3">
                  <div className="font-semibold">{u.full_name ?? "—"}</div>
                  <div className="font-mono text-xs text-muted-foreground">{u.id.slice(0, 8)}…</div>
                </td>
                <td className="p-3 font-mono text-xs">{u.phone ?? "—"}</td>
                <td className="p-3">
                  {u.roles.map((r: string) => (
                    <span key={r} className={`mr-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${r === "admin" ? "bg-brand text-brand-foreground" : "bg-muted"}`}>{r}</span>
                  ))}
                </td>
                <td className="p-3 text-muted-foreground">{shortDate(u.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
