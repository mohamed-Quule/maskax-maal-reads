
DROP TABLE IF EXISTS public.bookshop_applications CASCADE;
DROP TABLE IF EXISTS public.bookshops CASCADE;

-- Drop all policies that reference the old enum
DROP POLICY IF EXISTS "Admins manage books" ON public.books;
DROP POLICY IF EXISTS "Books public read published" ON public.books;
DROP POLICY IF EXISTS "Admins manage categories" ON public.categories;
DROP POLICY IF EXISTS "Admins view all order_items" ON public.order_items;
DROP POLICY IF EXISTS "Users view own order items" ON public.order_items;
DROP POLICY IF EXISTS "Admins update orders" ON public.orders;
DROP POLICY IF EXISTS "Admins view all orders" ON public.orders;
DROP POLICY IF EXISTS "Users view own orders" ON public.orders;
DROP POLICY IF EXISTS "Superadmin manage profiles" ON public.profiles;
DROP POLICY IF EXISTS "Superadmin manage user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admin manage covers" ON storage.objects;
DROP POLICY IF EXISTS "Admin manage pdfs" ON storage.objects;
DROP POLICY IF EXISTS "Admins delete book covers" ON storage.objects;
DROP POLICY IF EXISTS "Admins update book covers" ON storage.objects;
DROP POLICY IF EXISTS "Admins upload book covers" ON storage.objects;

-- Migrate any superadmin rows to admin and dedupe
UPDATE public.user_roles SET role = 'admin' WHERE role::text = 'superadmin';
DELETE FROM public.user_roles a USING public.user_roles b
  WHERE a.ctid < b.ctid AND a.user_id = b.user_id AND a.role = b.role;

-- Rebuild enum: drop dependent function first, recreate after
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);
ALTER TYPE public.app_role RENAME TO app_role_old;
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
ALTER TABLE public.user_roles
  ALTER COLUMN role TYPE public.app_role USING role::text::public.app_role;
DROP TYPE public.app_role_old;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- Recreate public policies (admin only, no superadmin)
CREATE POLICY "Admins manage books" ON public.books
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Books public read published" ON public.books
  FOR SELECT
  USING (is_published OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage categories" ON public.categories
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users view own order items" ON public.order_items
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id
      AND (o.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  ));

CREATE POLICY "Users view own orders" ON public.orders
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update orders" ON public.orders
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage profiles" ON public.profiles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage user_roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Recreate storage policies (admin only)
CREATE POLICY "Admin manage covers" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'book-covers' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'book-covers' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin manage pdfs" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'book-pdfs' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'book-pdfs' AND public.has_role(auth.uid(), 'admin'));

-- Library table
CREATE TABLE public.library (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, book_id)
);
CREATE INDEX library_user_idx ON public.library(user_id);

GRANT SELECT ON public.library TO authenticated;
GRANT ALL ON public.library TO service_role;

ALTER TABLE public.library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own library" ON public.library
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage library" ON public.library
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Trigger: on order paid/completed, grant library entries
CREATE OR REPLACE FUNCTION public.grant_library_on_paid()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF (NEW.payment_status::text = 'paid' OR NEW.status::text = 'completed')
     AND (TG_OP = 'INSERT'
          OR OLD.payment_status IS DISTINCT FROM NEW.payment_status
          OR OLD.status IS DISTINCT FROM NEW.status)
  THEN
    INSERT INTO public.library (user_id, book_id, order_id)
    SELECT NEW.user_id, oi.book_id, NEW.id
    FROM public.order_items oi
    WHERE oi.order_id = NEW.id
    ON CONFLICT (user_id, book_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_grant_library ON public.orders;
CREATE TRIGGER orders_grant_library
AFTER INSERT OR UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.grant_library_on_paid();

-- Backfill from paid orders
INSERT INTO public.library (user_id, book_id, order_id)
SELECT o.user_id, oi.book_id, o.id
FROM public.orders o
JOIN public.order_items oi ON oi.order_id = o.id
WHERE o.payment_status::text = 'paid' OR o.status::text = 'completed'
ON CONFLICT (user_id, book_id) DO NOTHING;
