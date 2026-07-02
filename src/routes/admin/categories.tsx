import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin/categories")({ component: AdminCats });

function AdminCats() {
  const qc = useQueryClient();
  const [slug, setSlug] = useState("");
  const [en, setEn] = useState("");
  const [so, setSo] = useState("");

  const { data: cats = [] } = useQuery({
    queryKey: ["admin-cats"],
    queryFn: async () => (await supabase.from("categories").select("*").order("sort_order")).data ?? [],
  });

  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("categories").insert({
        slug: slug || en.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        name_en: en,
        name_so: so,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setSlug(""); setEn(""); setSo("");
      qc.invalidateQueries({ queryKey: ["admin-cats"] });
      toast.success("Added");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-cats"] }),
  });

  return (
    <div className="p-8">
      <h1 className="font-display text-3xl">Categories</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="overflow-hidden rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3">Slug</th>
                <th className="p-3">English</th>
                <th className="p-3">Somali</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {cats.map((c: any) => (
                <tr key={c.id}>
                  <td className="p-3 font-mono text-xs">{c.slug}</td>
                  <td className="p-3">{c.name_en}</td>
                  <td className="p-3">{c.name_so}</td>
                  <td className="p-3 text-right">
                    <button onClick={() => confirm("Delete?") && remove.mutate(c.id)} className="rounded p-1.5 text-destructive hover:bg-destructive/10">
                      <Trash2 className="size-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="h-fit rounded-lg border bg-card p-6">
          <h3 className="font-display text-xl">Add category</h3>
          <div className="mt-4 space-y-3">
            <Input placeholder="Slug (auto)" value={slug} onChange={(e) => setSlug(e.target.value)} />
            <Input placeholder="English name" value={en} onChange={(e) => setEn(e.target.value)} />
            <Input placeholder="Somali name" value={so} onChange={(e) => setSo(e.target.value)} />
            <Button onClick={() => add.mutate()} disabled={!en || !so || add.isPending} className="w-full bg-brand hover:bg-brand/90">Add</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
