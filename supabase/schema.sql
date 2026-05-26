-- ─────────────────────────────────────────────────────────────
-- DAVID TRAINING APP — Database Schema
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ─────────────────────────────────────────────────────────────

-- PROFILES (extends Supabase auth.users)
CREATE TABLE profiles (
  id          UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email       TEXT,
  full_name   TEXT,
  avatar_url  TEXT,
  role        TEXT DEFAULT 'member', -- 'member' | 'admin'
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- MEMBERSHIPS
CREATE TABLE memberships (
  id                       UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id                  UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  plan                     TEXT NOT NULL, -- 'base' | 'pro' | 'elite'
  status                   TEXT NOT NULL DEFAULT 'active', -- 'active' | 'cancelled' | 'past_due'
  stripe_customer_id       TEXT,
  stripe_subscription_id   TEXT,
  stripe_price_id          TEXT,
  current_period_end       TIMESTAMPTZ,
  created_at               TIMESTAMPTZ DEFAULT NOW(),
  updated_at               TIMESTAMPTZ DEFAULT NOW()
);

-- VIDEOS
CREATE TABLE videos (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title         TEXT NOT NULL,
  description   TEXT,
  duration      TEXT,           -- e.g. "12:30"
  category      TEXT,           -- 'strength' | 'hiit' | 'mobility' | 'cardio' | 'recovery'
  thumbnail_url TEXT,
  video_url     TEXT,
  calories      INTEGER,
  min_plan      TEXT DEFAULT 'base', -- minimum plan to access: 'base' | 'pro' | 'elite'
  published     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- RECIPES
CREATE TABLE recipes (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title         TEXT NOT NULL,
  description   TEXT,
  category      TEXT,           -- 'high-protein' | 'recovery' | 'pre-workout' | 'meal-plan'
  calories      INTEGER,
  prep_time     TEXT,
  ingredients   TEXT[],
  instructions  TEXT[],
  image_url     TEXT,
  min_plan      TEXT DEFAULT 'base',
  published     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- GROUP CHAT MESSAGES
CREATE TABLE group_messages (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- PRIVATE MESSAGES (1:1 with David)
CREATE TABLE private_messages (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id   UUID REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  read        BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- PROGRESS UPLOADS
CREATE TABLE progress_uploads (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  file_url    TEXT NOT NULL,
  file_type   TEXT,   -- 'image' | 'video'
  note        TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- BOOKINGS
CREATE TABLE bookings (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID REFERENCES profiles(id) ON DELETE CASCADE,
  session_type  TEXT,   -- 'online' | 'in-person'
  scheduled_at  TIMESTAMPTZ,
  status        TEXT DEFAULT 'pending', -- 'pending' | 'confirmed' | 'cancelled'
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- AUTO-CREATE PROFILE ON SIGNUP
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    )
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW; -- never block user creation, even if profile insert fails
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────
ALTER TABLE profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships      ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos           ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_messages   ENABLE ROW LEVEL SECURITY;
ALTER TABLE private_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings         ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update their own
CREATE POLICY "profiles_read_own"   ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Memberships: users can read their own; success page can insert/update
CREATE POLICY "memberships_read_own"   ON memberships FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "memberships_insert_own" ON memberships FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "memberships_update_own" ON memberships FOR UPDATE USING (auth.uid() = user_id);

-- Videos: any logged-in member can read published videos
CREATE POLICY "videos_read_members" ON videos FOR SELECT USING (auth.role() = 'authenticated' AND published = TRUE);

-- Recipes: any logged-in member can read published recipes
CREATE POLICY "recipes_read_members" ON recipes FOR SELECT USING (auth.role() = 'authenticated' AND published = TRUE);

-- Group messages: any logged-in member can read and insert
CREATE POLICY "group_msg_read"   ON group_messages FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "group_msg_insert" ON group_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Private messages: sender or receiver can read
CREATE POLICY "private_msg_read" ON private_messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "private_msg_insert" ON private_messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Progress uploads: users can read/insert their own
CREATE POLICY "progress_read_own"   ON progress_uploads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "progress_insert_own" ON progress_uploads FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Bookings: users can read/insert their own
CREATE POLICY "bookings_read_own"   ON bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "bookings_insert_own" ON bookings FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admin full access (set role = 'admin' in profiles for David)
CREATE POLICY "admin_all_videos"    ON videos           FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "admin_all_recipes"   ON recipes          FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "admin_all_members"   ON memberships      FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "admin_all_bookings"  ON bookings         FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "admin_all_profiles"  ON profiles         FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
