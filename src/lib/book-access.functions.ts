import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function makeAnonClient() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export const getBookPdfUrl = createServerFn({ method: "POST" })
  .inputValidator((data: { bookId: string }) => data)
  .handler(async ({ data }) => {
    const anon = makeAnonClient();
    const { data: book, error } = await anon
      .from("books")
      .select("id, pdf_path, is_free")
      .eq("id", data.bookId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!book) throw new Error("Book not found");
    if (!book.pdf_path) throw new Error("No PDF available");
    if (!book.is_free) throw new Error("This book requires purchase");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed, error: sErr } = await supabaseAdmin.storage
      .from("book-pdfs")
      .createSignedUrl(book.pdf_path, 60 * 60);
    if (sErr) throw new Error(sErr.message);
    return { url: signed.signedUrl };
  });
