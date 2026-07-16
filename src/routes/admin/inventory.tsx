import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { money } from "@/lib/format";
import { Boxes, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/admin/inventory")({ component: Inventory });

function Inventory() {
  const { lang } = useI18n();

  const { data: books = [], isLoading } = useQuery({
    queryKey: ["admin-inventory"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("books")
        .select("id, title, author, price, stock, sales_count, is_published, cover_url")
        .order("stock", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const lowStock = books.filter((b: any) => b.stock <= 3).length;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 font-display text-3xl">
            <Boxes className="size-7" /> {lang === "en" ? "Inventory" : "Kaydka"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {lang === "en" ? "Stock levels for every book." : "Xaaladda kaydka buug walba."}
          </p>
        </div>
        {lowStock > 0 && (
          <div className="flex items-center gap-2 rounded-full bg-destructive/10 px-3 py-1.5 text-xs font-bold text-destructive">
            <AlertTriangle className="size-3.5" />
            {lowStock} {lang === "en" ? "low-stock" : "kayd yar"}
          </div>
        )}
      </div>

      <div className="mt-8 overflow-hidden rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3">{lang === "en" ? "Book" : "Buug"}</th>
              <th className="p-3">{lang === "en" ? "Price" : "Qiimo"}</th>
              <th className="p-3">{lang === "en" ? "Stock" : "Kayd"}</th>
              <th className="p-3">{lang === "en" ? "Sold" : "La iibiyay"}</th>
              <th className="p-3">{lang === "en" ? "Status" : "Xaalad"}</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {isLoading ? (
              <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Loading…</td></tr>
            ) : books.map((b: any) => (
              <tr key={b.id} className={b.stock <= 3 ? "bg-destructive/5" : ""}>
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    {b.cover_url && <img src={b.cover_url} alt="" className="h-10 w-8 rounded object-cover" />}
                    <div>
                      <div className="font-semibold">{b.title}</div>
                      <div className="text-xs text-muted-foreground">{b.author}</div>
                    </div>
                  </div>
                </td>
                <td className="p-3">{money(b.price)}</td>
                <td className="p-3 font-mono">
                  <span className={b.stock === 0 ? "text-destructive font-bold" : b.stock <= 3 ? "text-gold font-bold" : ""}>
                    {b.stock}
                  </span>
                </td>
                <td className="p-3">{b.sales_count}</td>
                <td className="p-3">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${b.is_published ? "bg-emerald/10 text-emerald" : "bg-muted text-muted-foreground"}`}>
                    {b.is_published ? (lang === "en" ? "Live" : "Firfircoon") : (lang === "en" ? "Draft" : "Qabyo")}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
