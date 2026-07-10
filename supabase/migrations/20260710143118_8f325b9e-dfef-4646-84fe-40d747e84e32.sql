
-- Allow public read of book-covers bucket while keeping bucket officially private
CREATE POLICY "Public read book covers"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'book-covers');

CREATE POLICY "Admins upload book covers"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'book-covers' AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'superadmin')));

CREATE POLICY "Admins update book covers"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'book-covers' AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'superadmin')));

CREATE POLICY "Admins delete book covers"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'book-covers' AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'superadmin')));
