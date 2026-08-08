import { z } from "zod";

export type Lang = "en" | "so";

const t = (lang: Lang, en: string, so: string) => (lang === "en" ? en : so);

/** Shared, user-friendly messages (bilingual). */
export const messages = {
  required: (lang: Lang) => t(lang, "This field is required.", "Goobtan waa lagama maarmaan."),
  nameLetters: (lang: Lang) => t(lang, "Name must contain letters only.", "Magacu waa inuu xarfo keliya ka koobnaadaa."),
  nameShort: (lang: Lang) => t(lang, "Name is too short.", "Magacu aad buu u gaaban yahay."),
  nameLong: (lang: Lang) => t(lang, "Name is too long.", "Magacu aad buu u dheer yahay."),
  phone: (lang: Lang) => t(lang, "Please enter a valid phone number.", "Fadlan geli lambar taleefan sax ah."),
  price: (lang: Lang) => t(lang, "Price must be a valid number.", "Qiimuhu waa inuu noqdaa lambar sax ah."),
  priceRange: (lang: Lang) => t(lang, "Price must be between 0 and 10,000.", "Qiimuhu waa inuu u dhexeeyaa 0 iyo 10,000."),
  quantity: (lang: Lang) => t(lang, "Quantity must be a positive whole number.", "Tirada waa inay tahay lambar buuxa oo togan."),
  email: (lang: Lang) => t(lang, "Please enter a valid email address.", "Fadlan geli cinwaan iimayl sax ah."),
  passwordShort: (lang: Lang) => t(lang, "Password must be at least 8 characters.", "Furuhu waa inuu ugu yaraan 8 xaraf noqdaa."),
  passwordWeak: (lang: Lang) =>
    t(lang, "Password must include at least one letter and one number.", "Furuhu waa inuu ku jiro ugu yaraan hal xaraf iyo hal lambar."),
  passwordMismatch: (lang: Lang) => t(lang, "Passwords do not match.", "Furayaashu isma laha."),
  titleShort: (lang: Lang) => t(lang, "Title must be at least 2 characters.", "Cinwaanku waa inuu ugu yaraan 2 xaraf noqdaa."),
  titleLong: (lang: Lang) => t(lang, "Title is too long (max 200 characters).", "Cinwaanku aad buu u dheer yahay (ugu badnaan 200)."),
  titleInvalid: (lang: Lang) => t(lang, "Please enter a meaningful title.", "Fadlan geli cinwaan macno leh."),
  slug: (lang: Lang) =>
    t(lang, "Use lowercase letters, numbers and dashes only.", "Isticmaal xarfo yaryar, lambaro iyo jaranjaro (-) kaliya."),
  textLong: (lang: Lang) => t(lang, "This text is too long.", "Qoraalkani aad buu u dheer yahay."),
  rating: (lang: Lang) => t(lang, "Please select a rating from 1 to 5.", "Fadlan dooro qiimayn 1 ilaa 5."),
  url: (lang: Lang) => t(lang, "Please enter a valid URL.", "Fadlan geli URL sax ah."),
  authorLetters: (lang: Lang) =>
    t(lang, "Author name must contain letters and spaces only.", "Magaca qoraagu waa inuu ka koobnaadaa xarfo iyo meelo bannaan oo keliya."),
  category: (lang: Lang) => t(lang, "Please select a category.", "Fadlan dooro qayb."),
  bookType: (lang: Lang) => t(lang, "Please select a valid book type.", "Fadlan dooro nooc buug sax ah."),
  file: (lang: Lang) => t(lang, "Please upload a supported book file.", "Fadlan soo geli fayl buug oo la taageero."),
  fileSize: (lang: Lang) => t(lang, "File is too large.", "Faylku aad buu u weyn yahay."),
};

/** Author names: letters, spaces, apostrophes, hyphens and dots — never digits. */
export const AUTHOR_RE = /^[\p{L}\p{M}][\p{L}\p{M}'’.\- ]*$/u;

export const authorNameSchema = (lang: Lang) =>
  z
    .string({ required_error: messages.required(lang) })
    .transform((v) => sanitizeText(v ?? ""))
    .pipe(
      z
        .string()
        .min(1, messages.required(lang))
        .min(2, messages.nameShort(lang))
        .max(100, messages.nameLong(lang))
        .regex(AUTHOR_RE, messages.authorLetters(lang))
        .refine((v) => !/\d/.test(v), messages.authorLetters(lang)),
    );

/* ---------------------------------- regex --------------------------------- */

// Letters (any script), marks, spaces, apostrophes, hyphens, dots.
export const NAME_RE = /^[\p{L}\p{M}][\p{L}\p{M}'’.\- ]*$/u;
export const LETTERS_SPACES_RE = /^[\p{L}\p{M}][\p{L}\p{M}'’\- ]*$/u;
export const DIGITS_ONLY_RE = /^[0-9]+$/;
export const DECIMAL_RE = /^\d{1,7}(\.\d{1,2})?$/;
export const INT_RE = /^\d{1,7}$/;
export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Removes spaces, dashes, dots and parentheses from a phone string. */
export const normalizePhone = (v: string) => v.replace(/[\s\-().]/g, "");

/** Strips control chars and collapses whitespace — basic input sanitisation. */
export const sanitizeText = (v: string) =>
  // eslint-disable-next-line no-control-regex
  v.replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim();

/* --------------------------------- schemas -------------------------------- */

export const nameSchema = (lang: Lang, { min = 2, max = 80 } = {}) =>
  z
    .string({ required_error: messages.required(lang) })
    .transform((v) => sanitizeText(v))
    .pipe(
      z
        .string()
        .min(1, messages.required(lang))
        .min(min, messages.nameShort(lang))
        .max(max, messages.nameLong(lang))
        .regex(NAME_RE, messages.nameLetters(lang)),
    );

export const categoryNameSchema = (lang: Lang) =>
  z
    .string({ required_error: messages.required(lang) })
    .transform((v) => sanitizeText(v))
    .pipe(
      z
        .string()
        .min(1, messages.required(lang))
        .min(2, messages.nameShort(lang))
        .max(60, messages.nameLong(lang))
        .regex(LETTERS_SPACES_RE, t(lang, "Category name must contain letters only.", "Magaca qaybtu waa inuu xarfo kaliya ka koobnaadaa.")),
    );

export const emailSchema = (lang: Lang) =>
  z
    .string({ required_error: messages.required(lang) })
    .transform((v) => v.trim().toLowerCase())
    .pipe(z.string().min(1, messages.required(lang)).email(messages.email(lang)).max(254, messages.textLong(lang)));

/** Somali mobile money numbers: 7–15 digits, optional leading +. */
export const phoneSchema = (lang: Lang, { required = true } = {}) =>
  z
    .string()
    .transform((v) => normalizePhone(v ?? ""))
    .pipe(
      z
        .string()
        .refine((v) => (required ? v.length > 0 : true), messages.required(lang))
        .refine((v) => v === "" || /^\+?[0-9]+$/.test(v), messages.phone(lang))
        .refine((v) => v === "" || DIGITS_ONLY_RE.test(v.replace(/^\+/, "")), messages.phone(lang))
        .refine((v) => v === "" || (v.replace(/^\+/, "").length >= 7 && v.replace(/^\+/, "").length <= 15), messages.phone(lang)),
    );

export const priceSchema = (lang: Lang) =>
  z
    .string({ required_error: messages.required(lang) })
    .transform((v) => (v ?? "").trim())
    .pipe(
      z
        .string()
        .min(1, messages.required(lang))
        .regex(DECIMAL_RE, messages.price(lang))
        .refine((v) => Number(v) >= 0 && Number(v) <= 10000, messages.priceRange(lang)),
    );

export const stockSchema = (lang: Lang) =>
  z
    .string({ required_error: messages.required(lang) })
    .transform((v) => (v ?? "").trim())
    .pipe(
      z
        .string()
        .min(1, messages.required(lang))
        .regex(INT_RE, messages.quantity(lang))
        .refine((v) => Number(v) >= 0 && Number(v) <= 1000000, messages.quantity(lang)),
    );

export const passwordSchema = (lang: Lang) =>
  z
    .string({ required_error: messages.required(lang) })
    .min(1, messages.required(lang))
    .min(8, messages.passwordShort(lang))
    .max(72, messages.textLong(lang))
    .refine((v) => /[A-Za-z\p{L}]/u.test(v) && /[0-9]/.test(v), messages.passwordWeak(lang));

/** Sign-in only needs a non-empty password (legacy accounts may be shorter). */
export const requiredPasswordSchema = (lang: Lang) =>
  z.string({ required_error: messages.required(lang) }).min(1, messages.required(lang));

export const bookTitleSchema = (lang: Lang) =>
  z
    .string({ required_error: messages.required(lang) })
    .transform((v) => sanitizeText(v))
    .pipe(
      z
        .string()
        .min(1, messages.required(lang))
        .min(2, messages.titleShort(lang))
        .max(200, messages.titleLong(lang))
        .refine((v) => (v.match(/\p{L}/gu) ?? []).length >= 2, messages.titleInvalid(lang)),
    );

export const slugSchema = (lang: Lang) =>
  z
    .string()
    .transform((v) => (v ?? "").trim().toLowerCase())
    .pipe(z.string().max(120, messages.textLong(lang)).refine((v) => v === "" || SLUG_RE.test(v), messages.slug(lang)));

export const optionalTextSchema = (lang: Lang, max = 2000) =>
  z
    .string()
    .transform((v) => sanitizeText(v ?? ""))
    .pipe(z.string().max(max, messages.textLong(lang)));

export const optionalUrlSchema = (lang: Lang) =>
  z
    .string()
    .transform((v) => (v ?? "").trim())
    .pipe(
      z.string().refine((v) => {
        if (v === "") return true;
        try {
          const u = new URL(v);
          return u.protocol === "http:" || u.protocol === "https:";
        } catch {
          return false;
        }
      }, messages.url(lang)),
    );

export const ratingSchema = (lang: Lang) => z.number().int().min(1, messages.rating(lang)).max(5, messages.rating(lang));

export const reviewCommentSchema = (lang: Lang) => optionalTextSchema(lang, 1000);

/* --------------------------------- helpers -------------------------------- */

export type FieldErrors<T> = Partial<Record<keyof T & string, string>>;

/** Flattens a zod result into `{ field: message }`. */
export function toFieldErrors<T>(result: z.SafeParseReturnType<unknown, T>): FieldErrors<T> {
  if (result.success) return {};
  const out: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = String(issue.path[0] ?? "_");
    if (!out[key]) out[key] = issue.message;
  }
  return out as FieldErrors<T>;
}
