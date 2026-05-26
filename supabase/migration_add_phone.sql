-- ──────────────────────────────────────────────────────────────
-- Migration: Add phone column to profiles table
-- Run this ONCE in your Supabase SQL Editor
-- ──────────────────────────────────────────────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS phone TEXT;

-- Verify
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'profiles' ORDER BY ordinal_position;
