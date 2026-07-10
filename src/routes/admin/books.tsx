import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Pencil, Plus, Trash2, Upload, Loader2 } from "lucide-react";
import { money } from "@/lib/format";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/admin/books")({ component: AdminBooks });

type BookForm = {
  id?: string;
  slug: string;
  title: string;
  author: string;
  language: string;
  price: string;
  stock: string;
  category_id: string;
  cover_url: string;
  cover_type: "hard" | "soft";
  description_en: string;
  description_so: string;
  is_featured: boolean;
  is_editor_pick: boolean;
};

const empty: BookForm = {
  slug: "", title: "", author: "", language: "so", price: "10", stock: "10",
  category_id: "", cover_url: "", cover_type: "soft",
  description_en: "", description_so: "",
  is_featured: false, is_editor_pick: false,
};

function AdminBooks() {
  const { lang } = useI18n();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [coverFilter, setCoverFilter] = useState<"all" | "hard" | "soft">("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<BookForm>(empty);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: books = [] } = useQuery({
    queryKey: ["admin-books", q, coverFilter],
    queryFn: async () => {
      let qb = supabase.from("books").select("*, categories(name_en)").order("created_at", { ascending: false });
      if (q) qb = qb.or(`title.ilike.%${q}%,author.ilike.%${q}%`);
      if (coverFilter !== "all") qb = qb.eq("cover_type", coverFilter);
      return (await qb).data ?? [];
    },
  });

  const { data: cats = [] } = useQuery({
    queryKey: ["cats"],
    queryFn: async () => (await supabase.from("categories").select("*").order("sort_order")).data ?? [],
  });

  const uploadCover = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `covers/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("book-covers").upload(path, file, {
        cacheControl: "31536000",
        upsert: false,
        contentType: file.type,
      });
      if (upErr) throw upErr;
      const { data: signed, error: sErr } = await supabase.storage.from("book-covers").createSignedUrl(path, 60 * 60 * 24 * 365 * 5);
      if (sErr) throw sErr;
      setForm((f) => ({ ...f, cover_url: signed.signedUrl }));
      toast.success(lang === "en" ? "Cover uploaded" : "Jaldigii waa la soo geliyay");
    } catch (e: any) {
      toast.error(e?.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        slug: form.slug || form.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        title: form.title,
        author: form.author,
        language: form.language,
        price: Number(form.price),
        stock: Number(form.stock),
        category_id: form.category_id || null,
        cover_url: form.cover_url || null,
        cover_type: form.cover_type,
        description_en: form.description_en || null,
        description_so: form.description_so || null,
        is_featured: form.is_featured,
        is_editor_pick: form.is_editor_pick,
      };
      if (form.id) {
        const { error } = await supabase.from("books").update(payload).eq("id", form.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("books").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Saved");
      setOpen(false);
      setForm(empty);
      qc.invalidateQueries({ queryKey: ["admin-books"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("books").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-books"] });
      toast.success("Deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openEdit = (b: any) => {
    setForm({
      id: b.id, slug: b.slug, title: b.title, author: b.author,
      language: b.language, price: String(b.price), stock: String(b.stock),
      category_id: b.category_id ?? "", cover_url: b.cover_url ?? "",
      cover_type: (b.cover_type ?? "soft") as "hard" | "soft",
      description_en: b.description_en ?? "", description_so: b.description_so ?? "",
      is_featured: b.is_featured, is_editor_pick: b.is_editor_pick,
    });
    setOpen(true);
  };

  return (
    <div className="p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">{lang === "en" ? "Books" : "Buugaag"}</h1>
          <p className="text-sm text-muted-foreground">{lang === "en" ? "Manage your catalog." : "Maamul ururintaada."}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="inline-flex rounded-md border p-0.5 text-xs font-semibold">
            {(["all","hard","soft"] as const).map((k) => (
              <button
                key={k}
                onClick={() => setCoverFilter(k)}
                className={`rounded px-3 py-1.5 transition ${coverFilter === k ? "bg-brand text-brand-foreground" : "text-muted-foreground"}`}
              >
                {k === "all" ? (lang === "en" ? "All" : "Dhammaan") : k === "hard" ? (lang === "en" ? "Hard cover" : "Jaldi adag") : (lang === "en" ? "Soft cover" : "Jaldi jilicsan")}
              </button>
            ))}
          </div>
          <Input placeholder={lang === "en" ? "Search…" : "Raadi…"} value={q} onChange={(e) => setQ(e.target.value)} className="w-56" />
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setForm(empty); }}>
            <DialogTrigger asChild>
              <Button className="bg-brand hover:bg-brand/90"><Plus className="mr-1 size-4" /> {lang === "en" ? "New book" : "Buug cusub"}</Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{form.id ? (lang === "en" ? "Edit book" : "Wax ka beddel") : (lang === "en" ? "New book" : "Buug cusub")}</DialogTitle>
              </DialogHeader>

              <div className="grid gap-6 sm:grid-cols-[160px_1fr]">
                <div>
                  <Label className="mb-1.5 block text-xs">{lang === "en" ? "Cover" : "Jaldi"}</Label>
                  <div className="aspect-[2/3] w-full overflow-hidden rounded-md border bg-muted">
                    {form.cover_url ? (
                      <img src={form.cover_url} className="h-full w-full object-cover" />
                    ) : (
                      <div className="grid h-full place-items-center text-xs text-muted-foreground">
                        {lang === "en" ? "No cover" : "Ma jiro"}
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadCover(f); }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="mt-2 w-full"
                  >
                    {uploading ? <Loader2 className="mr-1 size-4 animate-spin" /> : <Upload className="mr-1 size-4" />}
                    {lang === "en" ? "Upload cover" : "Soo geli jaldi"}
                  </Button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Title"><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
                  <Field label="Author"><Input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} /></Field>
                  <Field label="Slug"><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto" /></Field>
                  <Field label={lang === "en" ? "Cover type" : "Nooca jaldi"}>
                    <div className="inline-flex w-full rounded-md border p-0.5">
                      <button type="button" onClick={() => setForm({ ...form, cover_type: "hard" })} className={`flex-1 rounded px-3 py-1.5 text-sm font-semibold ${form.cover_type === "hard" ? "bg-brand text-brand-foreground" : "text-muted-foreground"}`}>
                        {lang === "en" ? "Hard cover" : "Jaldi adag"}
                      </button>
                      <button type="button" onClick={() => setForm({ ...form, cover_type: "soft" })} className={`flex-1 rounded px-3 py-1.5 text-sm font-semibold ${form.cover_type === "soft" ? "bg-brand text-brand-foreground" : "text-muted-foreground"}`}>
                        {lang === "en" ? "Soft cover" : "Jaldi jilicsan"}
                      </button>
                    </div>
                  </Field>
                  <Field label="Language">
                    <select value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                      <option value="so">Somali</option>
                      <option value="en">English</option>
                      <option value="ar">Arabic</option>
                    </select>
                  </Field>
                  <Field label="Price ($)"><Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></Field>
                  <Field label="Stock"><Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></Field>
                  <Field label="Category">
                    <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} className="w-full rounded-md border bg-background px-3 py-2 text-sm">
                      <option value="">—</option>
                      {cats.map((c: any) => <option key={c.id} value={c.id}>{c.name_en}</option>)}
                    </select>
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label="Cover URL (or upload above)">
                      <Input value={form.cover_url} onChange={(e) => setForm({ ...form, cover_url: e.target.value })} />
                    </Field>
                  </div>
                  <div className="sm:col-span-2">
                    <Field label="Description (EN)">
                      <Textarea rows={2} value={form.description_en} onChange={(e) => setForm({ ...form, description_en: e.target.value })} />
                    </Field>
                  </div>
                  <div className="sm:col-span-2">
                    <Field label="Description (SO)">
                      <Textarea rows={2} value={form.description_so} onChange={(e) => setForm({ ...form, description_so: e.target.value })} />
                    </Field>
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} />
                    Featured
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={form.is_editor_pick} onChange={(e) => setForm({ ...form, is_editor_pick: e.target.checked })} />
                    Editor's pick
                  </label>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={() => save.mutate()} disabled={save.isPending} className="bg-brand hover:bg-brand/90">Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="mt-8 overflow-hidden rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="p-3">Book</th>
              <th className="p-3">Category</th>
              <th className="p-3">Cover</th>
              <th className="p-3">Price</th>
              <th className="p-3">Stock</th>
              <th className="p-3">Sales</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {books.map((b: any) => (
              <tr key={b.id} className="hover:bg-muted/30">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    {b.cover_url && <img src={b.cover_url} className="h-12 w-9 rounded object-cover" />}
                    <div>
                      <div className="font-semibold">{b.title}</div>
                      <div className="text-xs text-muted-foreground">{b.author}</div>
                    </div>
                  </div>
                </td>
                <td className="p-3 text-muted-foreground">{b.categories?.name_en ?? "—"}</td>
                <td className="p-3">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${b.cover_type === "hard" ? "bg-brand/10 text-brand" : "bg-emerald/10 text-emerald"}`}>
                    {b.cover_type === "hard" ? "Hard" : "Soft"}
                  </span>
                </td>
                <td className="p-3 font-medium">{money(b.price)}</td>
                <td className="p-3">{b.stock}</td>
                <td className="p-3">{b.sales_count}</td>
                <td className="p-3">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => openEdit(b)} className="rounded p-1.5 hover:bg-muted"><Pencil className="size-4" /></button>
                    <button onClick={() => confirm("Delete?") && remove.mutate(b.id)} className="rounded p-1.5 text-destructive hover:bg-destructive/10"><Trash2 className="size-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1.5 block text-xs">{label}</Label>
      {children}
    </div>
  );
}
