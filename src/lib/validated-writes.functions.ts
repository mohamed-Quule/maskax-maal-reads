import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  bookSchema,
  categorySchema,
  checkoutSchema,
  orderStatusSchema,
  parseOrThrow,
  profileSchema,
  reviewSchema,
  toSlug,
} from "@/lib/schemas";
import type { Lang } from "@/lib/validation";

/** Update the signed-in user's profile (server-side validated + sanitised). */
export const saveProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { lang: Lang; full_name: string; phone: string }) => data)
  .handler(async ({ data, context }) => {
    const parsed = parseOrThrow(profileSchema(data.lang), { full_name: data.full_name, phone: data.phone });
    const { error } = await context.supabase
      .from("profiles")
      .update({ full_name: parsed.full_name, phone: parsed.phone || null })
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Create or update a book. Admin-only, fully validated. */
export const saveBook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { lang: Lang; book: Record<string, unknown> }) => data)
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");

    const b = parseOrThrow(bookSchema(data.lang), data.book);
    const payload = {
      slug: b.slug || toSlug(b.title),
      title: b.title,
      author: b.author,
      language: b.language,
      price: Number(b.price),
      stock: Number(b.stock),
      category_id: b.category_id || null,
      cover_url: b.cover_url || null,
      cover_type: b.cover_type,
      pdf_path: b.pdf_path || null,
      is_free: b.is_free,
      description_en: b.description_en || null,
      description_so: b.description_so || null,
      is_featured: b.is_featured,
      is_editor_pick: b.is_editor_pick,
    };

    if (b.id) {
      const { error } = await context.supabase.from("books").update(payload).eq("id", b.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase.from("books").insert(payload);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

/** Create or update a category. Admin-only, fully validated. */
export const saveCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { lang: Lang; category: Record<string, unknown> }) => data)
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");

    const c = parseOrThrow(categorySchema(data.lang), data.category);
    const payload = {
      slug: c.slug || toSlug(c.name_en),
      name_en: c.name_en,
      name_so: c.name_so,
      sort_order: c.sort_order,
    };
    if (c.id) {
      const { error } = await context.supabase.from("categories").update(payload).eq("id", c.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await context.supabase.from("categories").insert(payload);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

/** Post or update a review for a book. */
export const submitReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { lang: Lang; bookId: string; rating: number; comment: string }) => data)
  .handler(async ({ data, context }) => {
    const r = parseOrThrow(reviewSchema(data.lang), { rating: data.rating, comment: data.comment });
    if (!/^[0-9a-f-]{36}$/i.test(data.bookId)) throw new Error("Invalid book");

    const { error } = await context.supabase
      .from("reviews")
      .upsert(
        { book_id: data.bookId, user_id: context.userId, rating: r.rating, comment: r.comment || null },
        { onConflict: "book_id,user_id" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Place an order from the server-side cart. Totals are recomputed from the DB. */
export const placeOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { lang: Lang; phone: string; method: string }) => data)
  .handler(async ({ data, context }) => {
    const parsed = parseOrThrow(checkoutSchema(data.lang), { phone: data.phone, method: data.method });

    const { data: items, error: cErr } = await context.supabase
      .from("cart_items")
      .select("quantity, books(id, title, price)")
      .eq("user_id", context.userId);
    if (cErr) throw new Error(cErr.message);
    if (!items || items.length === 0) throw new Error("Your cart is empty.");

    const rows = items
      .map((i) => {
        const book = i.books as unknown as { id: string; title: string; price: number } | null;
        const qty = Number(i.quantity);
        if (!book || !Number.isInteger(qty) || qty < 1) return null;
        return { book_id: book.id, title: book.title, unit_price: Number(book.price), quantity: qty };
      })
      .filter((r): r is { book_id: string; title: string; unit_price: number; quantity: number } => r !== null);
    if (rows.length === 0) throw new Error("Your cart is empty.");

    const total = rows.reduce((s, r) => s + r.unit_price * r.quantity, 0);

    const { data: order, error } = await context.supabase
      .from("orders")
      .insert({
        user_id: context.userId,
        total,
        payment_method: parsed.method,
        phone: parsed.phone,
        status: "pending" as const,
        payment_status: "pending" as const,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    const { error: oiErr } = await context.supabase
      .from("order_items")
      .insert(rows.map((r) => ({ ...r, order_id: order.id })));
    if (oiErr) throw new Error(oiErr.message);

    await context.supabase.from("cart_items").delete().eq("user_id", context.userId);
    return { orderId: order.id as string };
  });

/** Admin: change payment/fulfilment status of an order. */
export const updateOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string; payment_status: string; status?: string }) => data)
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");

    const parsed = parseOrThrow(orderStatusSchema(), data);
    const update: { payment_status: typeof parsed.payment_status; status?: NonNullable<typeof parsed.status> } = {
      payment_status: parsed.payment_status,
    };
    if (parsed.status) update.status = parsed.status;
    const { error } = await context.supabase.from("orders").update(update).eq("id", parsed.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
