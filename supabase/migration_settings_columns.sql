-- Run this in Supabase SQL Editor

-- 1. Add new profile columns
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS avatar_url      TEXT,
  ADD COLUMN IF NOT EXISTS fitness_goal    TEXT,
  ADD COLUMN IF NOT EXISTS height          TEXT,
  ADD COLUMN IF NOT EXISTS weight          TEXT,
  ADD COLUMN IF NOT EXISTS notify_sms      BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_email    BOOLEAN DEFAULT true;

-- 2. Create avatars storage bucket (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage RLS policies (wrapped in DO block to avoid errors if they already exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'avatars_upload_own'
  ) THEN
    CREATE POLICY "avatars_upload_own"
      ON storage.objects FOR INSERT
      WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'avatars_update_own'
  ) THEN
    CREATE POLICY "avatars_update_own"
      ON storage.objects FOR UPDATE
      USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'avatars_read_public'
  ) THEN
    CREATE POLICY "avatars_read_public"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'avatars');
  END IF;
END $$;
