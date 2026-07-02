import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { money, shortDate } from "@/lib/format";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/orders")({ component: AdminOrders });

function AdminOrders() {
  const qc = useQueryClient();
  const { data: orders = [] } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => (await supabase
      .from("orders")
      .select("*, order_items(quantity)")
      .order("created_at", { ascending: false })
      .limit(100)).data ?? [],
  });

  const setPayment = useMutation({
    mutationFn: async ({ id, payment_status, status }: { id: string; payment_status: "paid" | "failed" | "pending" | "refunded"; status?: "pending" | "confirmed" | "cancelled" | "delivered" }) => {
      const update: any = { payment_status };
      if (status) update.status = status;
      const { error } = await supabase.from("orders").update(update).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("Updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="p-8">
      <h1 className="font-display text-3xl">Orders</h1>
      <p className="text-sm text-muted-foreground">Confirm mobile money payments and manage fulfillment.</p>

      <div className="mt-8 overflow-hidden rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3">Order</th>
              <th className="p-3">Date</th>
              <th className="p-3">Payment</th>
              <th className="p-3">Phone</th>
              <th className="p-3">Items</th>
              <th className="p-3">Total</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {orders.map((o: any) => {
              const qty = (o.order_items ?? []).reduce((s: number, i: any) => s + i.quantity, 0);
              return (
                <tr key={o.id}>
                  <td className="p-3 font-mono text-xs">{o.order_number}</td>
                  <td className="p-3 text-muted-foreground">{shortDate(o.created_at)}</td>
                  <td className="p-3 uppercase text-xs">{o.payment_method}</td>
                  <td className="p-3 font-mono text-xs">{o.phone ?? "—"}</td>
                  <td className="p-3">{qty}</td>
                  <td className="p-3 font-semibold">{money(o.total)}</td>
                  <td className="p-3">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                      o.payment_status === "paid" ? "bg-emerald/15 text-emerald" :
                      o.payment_status === "failed" ? "bg-red-100 text-red-700" :
                      "bg-yellow-100 text-yellow-800"
                    }`}>{o.payment_status}</span>
                  </td>
                  <td className="p-3">
                    <div className="flex justify-end gap-2">
                      {o.payment_status !== "paid" && (
                        <Button size="sm" className="h-7 bg-emerald hover:bg-emerald/90" onClick={() => setPayment.mutate({ id: o.id, payment_status: "paid", status: "confirmed" })}>
                          Confirm
                        </Button>
                      )}
                      {o.payment_status === "pending" && (
                        <Button size="sm" variant="outline" className="h-7" onClick={() => setPayment.mutate({ id: o.id, payment_status: "failed", status: "cancelled" })}>
                          Reject
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
