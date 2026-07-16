import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function signedUrlForBook(bookId: string, userId: string, download: boolean) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: book, error } = await supabaseAdmin
    .from("books")
    .select("id, slug, pdf_path, is_free")
    .eq("id", bookId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!book) throw new Error("Book not found");
  if (!book.pdf_path) throw new Error("No PDF available for this book");

  if (!book.is_free) {
    const { data: lib, error: lErr } = await supabaseAdmin
      .from("library")
      .select("id")
      .eq("user_id", userId)
      .eq("book_id", bookId)
      .maybeSingle();
    if (lErr) throw new Error(lErr.message);
    if (!lib) throw new Error("You need to purchase this book first");
  }

  const options: { download?: string } = {};
  if (download) options.download = `${book.slug}.pdf`;

  const { data: signed, error: sErr } = await supabaseAdmin.storage
    .from("book-pdfs")
    .createSignedUrl(book.pdf_path, 60 * 60, options);
  if (sErr) throw new Error(sErr.message);
  return { url: signed.signedUrl };
}

export const getBookReadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { bookId: string }) => data)
  .handler(async ({ data, context }) => signedUrlForBook(data.bookId, context.userId, false));

export const getBookDownloadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { bookId: string }) => data)
  .handler(async ({ data, context }) => signedUrlForBook(data.bookId, context.userId, true));

// Free books: readable/downloadable without sign-in (kept for compatibility)
export const getFreeBookUrl = createServerFn({ method: "POST" })
  .inputValidator((data: { bookId: string }) => data)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: book, error } = await supabaseAdmin
      .from("books")
      .select("id, slug, pdf_path, is_free")
      .eq("id", data.bookId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!book || !book.pdf_path) throw new Error("Book not available");
    if (!book.is_free) throw new Error("This book requires purchase");
    const { data: signed, error: sErr } = await supabaseAdmin.storage
      .from("book-pdfs")
      .createSignedUrl(book.pdf_path, 60 * 60);
    if (sErr) throw new Error(sErr.message);
    return { url: signed.signedUrl };
  });
