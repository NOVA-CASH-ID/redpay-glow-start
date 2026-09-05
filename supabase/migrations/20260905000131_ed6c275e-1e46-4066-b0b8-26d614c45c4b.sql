CREATE POLICY "Signed-in users can read announcement images"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'announcements');

CREATE POLICY "Admins upload announcement images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'announcements' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins update announcement images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'announcements' AND public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (bucket_id = 'announcements' AND public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins delete announcement images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'announcements' AND public.has_role(auth.uid(), 'admin'::app_role));