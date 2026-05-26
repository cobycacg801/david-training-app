-- Run this in Supabase SQL Editor
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS avatar_url      TEXT,
  ADD COLUMN IF NOT EXISTS fitness_goal    TEXT,
  ADD COLUMN IF NOT EXISTS height          TEXT,
  ADD COLUMN IF NOT EXISTS weight          TEXT,
  ADD COLUMN IF NOT EXISTS notify_sms      BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_email    BOOLEAN DEFAULT true;

-- Create avatars storage bucket (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- RLS: anyone authenticated can upload their own avatar
CREATE POLICY IF NOT EXISTS "avatars_upload_own"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY IF NOT EXISTS "avatars_update_own"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY IF NOT EXISTS "avatars_read_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');
