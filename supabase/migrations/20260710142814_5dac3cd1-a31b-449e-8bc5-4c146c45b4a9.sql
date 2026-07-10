
-- Add cover_type to books (hard/soft)
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS cover_type TEXT NOT NULL DEFAULT 'soft' CHECK (cover_type IN ('hard','soft'));

-- Bookshop registration applications (self-serve by anyone)
CREATE TABLE IF NOT EXISTS public.bookshop_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  city TEXT,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  address TEXT,
  owner_full_name TEXT NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.bookshop_applications TO anon;
GRANT SELECT, INSERT, UPDATE ON public.bookshop_applications TO authenticated;
GRANT ALL ON public.bookshop_applications TO service_role;

ALTER TABLE public.bookshop_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit application"
ON public.bookshop_applications FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Superadmin can view applications"
ON public.bookshop_applications FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'));

CREATE POLICY "Superadmin can update applications"
ON public.bookshop_applications FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'superadmin'));

CREATE TRIGGER update_bookshop_applications_updated_at
BEFORE UPDATE ON public.bookshop_applications
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
