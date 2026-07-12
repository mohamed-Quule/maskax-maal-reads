import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Trash2, Pencil, X, Check } from "lucide-react";

export const Route = createFileRoute("/admin/categories")({ component: AdminCats });

function AdminCats() {
  const qc = useQueryClient();
  const [slug, setSlug] = useState("");
  const [en, setEn] = useState("");
  const [so, setSo] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [eSlug, setESlug] = useState("");
  const [eEn, setEEn] = useState("");
  const [eSo, setESo] = useState("");
  const [eSort, setESort] = useState<number>(0);

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

  const update = useMutation({
    mutationFn: async () => {
      if (!editingId) return;
      const { error } = await supabase
        .from("categories")
        .update({ slug: eSlug, name_en: eEn, name_so: eSo, sort_order: eSort })
        .eq("id", editingId);
      if (error) throw error;
    },
    onSuccess: () => {
      setEditingId(null);
      qc.invalidateQueries({ queryKey: ["admin-cats"] });
      toast.success("Updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-cats"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const startEdit = (c: any) => {
    setEditingId(c.id);
    setESlug(c.slug);
    setEEn(c.name_en);
    setESo(c.name_so);
    setESort(c.sort_order ?? 0);
  };

  return (
    <div className="p-8">
      <h1 className="font-display text-3xl">Categories</h1>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="overflow-hidden rounded-lg border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3">Sort</th>
                <th className="p-3">Slug</th>
                <th className="p-3">English</th>
                <th className="p-3">Somali</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {cats.map((c: any) => {
                const isEditing = editingId === c.id;
                return (
                  <tr key={c.id}>
                    <td className="p-3 w-20">
                      {isEditing ? (
                        <Input type="number" value={eSort} onChange={(e) => setESort(Number(e.target.value))} className="h-8" />
                      ) : (
                        <span className="font-mono text-xs">{c.sort_order ?? 0}</span>
                      )}
                    </td>
                    <td className="p-3">
                      {isEditing ? (
                        <Input value={eSlug} onChange={(e) => setESlug(e.target.value)} className="h-8" />
                      ) : (
                        <span className="font-mono text-xs">{c.slug}</span>
                      )}
                    </td>
                    <td className="p-3">
                      {isEditing ? (
                        <Input value={eEn} onChange={(e) => setEEn(e.target.value)} className="h-8" />
                      ) : (
                        c.name_en
                      )}
                    </td>
                    <td className="p-3">
                      {isEditing ? (
                        <Input value={eSo} onChange={(e) => setESo(e.target.value)} className="h-8" />
                      ) : (
                        c.name_so
                      )}
                    </td>
                    <td className="p-3 text-right">
                      {isEditing ? (
                        <div className="inline-flex gap-1">
                          <button
                            onClick={() => update.mutate()}
                            disabled={update.isPending}
                            className="rounded p-1.5 text-emerald hover:bg-emerald/10"
                            title="Save"
                          >
                            <Check className="size-4" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="rounded p-1.5 text-muted-foreground hover:bg-muted"
                            title="Cancel"
                          >
                            <X className="size-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="inline-flex gap-1">
                          <button
                            onClick={() => startEdit(c)}
                            className="rounded p-1.5 text-brand hover:bg-brand/10"
                            title="Edit"
                          >
                            <Pencil className="size-4" />
                          </button>
                          <button
                            onClick={() => confirm("Delete?") && remove.mutate(c.id)}
                            className="rounded p-1.5 text-destructive hover:bg-destructive/10"
                            title="Delete"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
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

