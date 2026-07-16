# Refactor Plan — Maskax Maal to Two-Role Platform

This is a large refactor. I'll ship it in one coordinated pass, preserving the current brand (emerald / brand tokens, typography, i18n EN/SO), and keeping visual identity intact while tightening architecture.

## 1. Role model → only `admin` and `user`

Database migration:
- Reassign every `superadmin` role in `user_roles` to `admin`.
- Remove `'superadmin'` from the `app_role` enum (recreate enum with only `admin`, `user`).
- Update `has_role` and any RLS policies that reference `superadmin` to reference `admin`.
- Drop the `bookshops` and `bookshop_applications` tables and related policies (they only existed for the superadmin/multi-tenant flow).

Code:
- Remove `isSuperadmin` from `src/lib/auth.tsx`.
- Delete: `src/routes/superadmin-setup.tsx`, `src/routes/admin/bookshops.tsx`, `src/routes/admin/applications.tsx`, `src/routes/register.library.tsx`, `src/lib/superadmin.functions.ts`.
- Strip superadmin branches from `src/routes/admin.tsx` (sidebar), admin index, register flow.

## 2. Library (purchased books) + purchase-gated access

New `library` table:
```
library(id, user_id, book_id, order_id, granted_at)
UNIQUE(user_id, book_id)
```
- RLS: users can SELECT their own rows; service_role manages inserts.
- Trigger on `orders` when `status` transitions to `paid`/`completed`: insert one `library` row per `order_item.book_id` for that user (idempotent via unique).

Server functions in `src/lib/library.functions.ts` (auth-gated):
- `getMyLibrary()` — list library rows joined with books.
- `getBookReadUrl({ bookId })` — verifies library ownership OR `is_free`, returns 1h signed URL from `book-pdfs` bucket.
- `getBookDownloadUrl({ bookId })` — same check, returns signed URL with `download` disposition.

Refactor `src/lib/book-access.functions.ts` to use `requireSupabaseAuth` and check the library table (currently only allows free books).

## 3. Customer dashboard

New pathless layout `src/routes/_authenticated/route.tsx` (integration-managed style, `ssr:false`) — but since we already have `_authenticated`? Confirm: current routes use plain auth checks in components. Introduce a proper `/account` area with sidebar:

Reorganize under `/account`:
- `/account` (Dashboard: welcome, purchase summary, recently purchased)
- `/account/library` (My Library — read + download)
- `/account/orders` (Purchase History — already exists, keep & move)
- `/account/reviews` (My reviews — new, list + edit)
- `/account/profile` (existing, keep)
- `/account/cart` link (points to /cart)

Keep `/books`, `/books/$slug`, `/categories`, `/cart`, `/checkout` as public shopping surfaces (unchanged UX, minor polish).

Book detail page (`/books/$slug`):
- If purchased or free → show **Read online** + **Download PDF** buttons.
- If not purchased → show **Add to cart** / **Buy now** and (if `preview_enabled`) preview only. No download button.

## 4. Admin dashboard cleanup

Sidebar becomes exactly: Dashboard, Books, Categories, Users, Orders, Inventory, Reports, Settings, Profile, Logout.
- Remove Bookshops + Applications nav items.
- Add `/admin/inventory` (stock view — filter/sort books by stock, quick edit).
- Add `/admin/profile` (admin profile edit).
- Admin dashboard index: Total Users, Total Books, Total Orders, Monthly Revenue, Monthly Sales, Top Selling Books, Top Buyers, Recent Activities.
- User management: add activate/suspend/delete actions (add `status` column: active/suspended on `profiles`).
- Order management: confirm/cancel/update-status actions.

## 5. Cleanup

Delete unused files, dead imports, dead i18n strings. Ensure no reference to "superadmin", "bookshop", "application" remains outside migration history.

## 6. UI polish (preserve brand)

Keep emerald/brand tokens and existing fonts. Apply consistently:
- Sidebar layout for **both** admin and customer areas (shared shell component).
- Loading skeletons on list pages.
- Empty states with icon + CTA on Library, Orders, Cart, Reviews.
- Card-based dashboard stats with subtle shadows (existing `shadow-card`).
- Framer-motion micro-animations on nav + cards (already in deps? add if missing).
- Mobile-responsive sidebar (sheet on <md).

## Technical / DB summary (for the technical reviewer)

- Migration 1: drop `bookshops`, `bookshop_applications`; drop policies; drop superadmin roles → admin; recreate `app_role` enum without superadmin; update `has_role`; add `library` table + RLS + grant + trigger on orders → auto-fill library; add `status` to `profiles`.
- Regenerate types after migration is approved; then land the code changes.
- New server fns in `src/lib/library.functions.ts` (auth-gated, load `supabaseAdmin` inside handler for signed URLs).
- Restructure customer routes under `/account/*` with a shared sidebar shell; admin unchanged path (`/admin/*`) but sidebar trimmed and pages added.
- Purchase → library is enforced by DB trigger, not client code, so no bypass path.

## Not doing (out of scope / preserving)

- No brand redesign, no palette change, no font swap.
- No payment provider change (existing checkout flow retained; when an order is marked paid, library trigger fires).
- No i18n language change; strings extended where needed.

Shall I proceed? This is one large multi-file change plus a schema migration you'll need to approve.
