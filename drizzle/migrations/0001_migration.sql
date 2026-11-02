
create policy "media read all" on storage.objects for select to anon, authenticated using (bucket_id = 'media');
create policy "media insert own folder" on storage.objects for insert to authenticated with check (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "media update own folder" on storage.objects for update to authenticated using (bucket_id = 'media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "media delete own folder" on storage.objects for delete to authenticated using (bucket_id = 'media' and ((storage.foldername(name))[1] = auth.uid()::text or public.has_role(auth.uid(),'admin')));
