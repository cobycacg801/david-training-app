-- ──────────────────────────────────────────────────────────────
-- Migration: Add zoom_link and david_note to bookings table
-- Run this ONCE in your Supabase SQL Editor
-- ──────────────────────────────────────────────────────────────

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS zoom_link  TEXT,
  ADD COLUMN IF NOT EXISTS david_note TEXT;

-- Verify
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'bookings' ORDER BY ordinal_position;
