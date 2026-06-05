
-- Anyone authenticated can read avatars/covers (profiles are visible to logged-in users)
CREATE POLICY "auth read avatars" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id IN ('avatars','covers'));

-- Users manage files in their own folder (path starts with their uid)
CREATE POLICY "users upload own avatar" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('avatars','covers') AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "users update own avatar" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id IN ('avatars','covers') AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "users delete own avatar" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id IN ('avatars','covers') AND (storage.foldername(name))[1] = auth.uid()::text);
