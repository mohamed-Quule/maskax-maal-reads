
-- Bookshops table
CREATE TABLE IF NOT EXISTS public.bookshops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  phone TEXT,
  city TEXT,
  address TEXT,
  logo_url TEXT,
  owner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookshops TO authenticated;
GRANT ALL ON public.bookshops TO service_role;

ALTER TABLE public.bookshops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Bookshops readable by authenticated"
  ON public.bookshops FOR SELECT TO authenticated USING (true);

CREATE POLICY "Superadmin manage bookshops"
  ON public.bookshops FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'superadmin'))
  WITH CHECK (public.has_role(auth.uid(), 'superadmin'));

CREATE TRIGGER trg_bookshops_updated BEFORE UPDATE ON public.bookshops
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Broaden admin-only policies to also allow superadmin
-- Books
DROP POLICY IF EXISTS "Admins manage books" ON public.books;
CREATE POLICY "Admins manage books" ON public.books FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'superadmin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'superadmin'));

DROP POLICY IF EXISTS "Admins manage categories" ON public.categories;
CREATE POLICY "Admins manage categories" ON public.categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'superadmin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'superadmin'));

DROP POLICY IF EXISTS "Admins view all orders" ON public.orders;
CREATE POLICY "Admins view all orders" ON public.orders FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'superadmin') OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins update orders" ON public.orders;
CREATE POLICY "Admins update orders" ON public.orders FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'superadmin'));

DROP POLICY IF EXISTS "Admins view all order_items" ON public.order_items;
CREATE POLICY "Admins view all order_items" ON public.order_items FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'superadmin') OR EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND o.user_id = auth.uid()));

-- Profiles: allow superadmin to view/manage all
DROP POLICY IF EXISTS "Superadmin manage profiles" ON public.profiles;
CREATE POLICY "Superadmin manage profiles" ON public.profiles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'superadmin'))
  WITH CHECK (public.has_role(auth.uid(),'superadmin'));

-- user_roles: allow superadmin to view/manage
DROP POLICY IF EXISTS "Superadmin manage user_roles" ON public.user_roles;
CREATE POLICY "Superadmin manage user_roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'superadmin'))
  WITH CHECK (public.has_role(auth.uid(),'superadmin'));
