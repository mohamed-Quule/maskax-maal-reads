
-- Book covers: anyone reads (bucket is private but we allow SELECT via policy for signed URLs / list)
CREATE POLICY "Covers public read" ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'book-covers');
CREATE POLICY "Admin manage covers" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'book-covers' AND public.has_role(auth.uid(),'admin'))
  WITH CHECK (bucket_id = 'book-covers' AND public.has_role(auth.uid(),'admin'));

-- Book PDFs: only admins upload; only users with a paid order for the book can read
CREATE POLICY "Admin manage pdfs" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'book-pdfs' AND public.has_role(auth.uid(),'admin'))
  WITH CHECK (bucket_id = 'book-pdfs' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "Buyers read pdfs" ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'book-pdfs' AND EXISTS (
      SELECT 1 FROM public.orders o
      JOIN public.order_items oi ON oi.order_id = o.id
      JOIN public.books b ON b.id = oi.book_id
      WHERE o.user_id = auth.uid() AND o.payment_status = 'paid' AND b.pdf_path = name
    )
  );
