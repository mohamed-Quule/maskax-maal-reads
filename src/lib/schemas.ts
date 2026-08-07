import { z } from "zod";
import {
  bookTitleSchema,
  categoryNameSchema,
  emailSchema,
  messages,
  nameSchema,
  optionalTextSchema,
  optionalUrlSchema,
  passwordSchema,
  phoneSchema,
  priceSchema,
  ratingSchema,
  requiredPasswordSchema,
  reviewCommentSchema,
  slugSchema,
  stockSchema,
  type Lang,
} from "@/lib/validation";

/* --------------------------------- account -------------------------------- */

export const signInSchema = (lang: Lang) =>
  z.object({ email: emailSchema(lang), password: requiredPasswordSchema(lang) });

export const signUpSchema = (lang: Lang) =>
  z.object({ fullName: nameSchema(lang), email: emailSchema(lang), password: passwordSchema(lang) });

export const forgotSchema = (lang: Lang) => z.object({ email: emailSchema(lang) });

export const newPasswordSchema = (lang: Lang) =>
  z
    .object({ password: passwordSchema(lang), confirm: z.string() })
    .refine((v) => v.password === v.confirm, { path: ["confirm"], message: messages.passwordMismatch(lang) });

export const profileSchema = (lang: Lang) =>
  z.object({ full_name: nameSchema(lang), phone: phoneSchema(lang, { required: false }) });

export const changePasswordSchema = (lang: Lang) => z.object({ password: passwordSchema(lang) });

/* -------------------------------- storefront ------------------------------- */

export const checkoutSchema = (lang: Lang) =>
  z.object({
    phone: phoneSchema(lang, { required: true }),
    method: z.enum(["evc_plus", "zaad", "sahal"], { errorMap: () => ({ message: messages.required(lang) }) }),
  });

export const reviewSchema = (lang: Lang) =>
  z.object({ rating: ratingSchema(lang), comment: reviewCommentSchema(lang) });

/* ---------------------------------- admin --------------------------------- */

export const bookSchema = (lang: Lang) =>
  z.object({
    id: z.string().uuid().optional(),
    title: bookTitleSchema(lang),
    author: nameSchema(lang, { min: 2, max: 100 }),
    slug: slugSchema(lang),
    language: z.enum(["so", "en", "ar"]),
    price: priceSchema(lang),
    stock: stockSchema(lang),
    category_id: z.string().uuid().or(z.literal("")),
    cover_url: optionalUrlSchema(lang),
    cover_type: z.enum(["hard", "soft"]),
    pdf_path: optionalTextSchema(lang, 300),
    is_free: z.boolean(),
    description_en: optionalTextSchema(lang, 4000),
    description_so: optionalTextSchema(lang, 4000),
    is_featured: z.boolean(),
    is_editor_pick: z.boolean(),
  });

export const categorySchema = (lang: Lang) =>
  z.object({
    id: z.string().uuid().optional(),
    slug: slugSchema(lang),
    name_en: categoryNameSchema(lang),
    name_so: categoryNameSchema(lang),
    sort_order: z
      .number({ invalid_type_error: messages.quantity(lang) })
      .int(messages.quantity(lang))
      .min(0, messages.quantity(lang))
      .max(9999, messages.quantity(lang)),
  });

export const orderStatusSchema = () =>
  z.object({
    id: z.string().uuid(),
    payment_status: z.enum(["pending", "paid", "failed", "refunded"]),
    status: z.enum(["pending", "confirmed", "cancelled", "delivered"]).optional(),
  });

/* --------------------------------- helpers -------------------------------- */

/** Server-side guard: parses or throws a clean, user-facing error. */
export function parseOrThrow<T extends z.ZodTypeAny>(schema: T, data: unknown): z.infer<T> {
  const r = schema.safeParse(data);
  if (!r.success) {
    const first = r.error.issues[0];
    throw new Error(first ? `${String(first.path[0] ?? "input")}: ${first.message}` : "Invalid input");
  }
  return r.data;
}

export const toSlug = (v: string) =>
  v
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
