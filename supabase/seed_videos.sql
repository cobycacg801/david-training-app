-- Sample videos for David Training App
-- Run in Supabase SQL Editor to populate the video library

INSERT INTO videos (title, description, duration, category, calories, min_plan, published) VALUES
  ('Full Body Warm-Up', 'Dynamic warm-up routine to activate your muscles and prep your joints before any workout.', '12:30', 'mobility', 90, 'base', true),
  ('Core Strength Circuit', 'Intense core workout targeting abs, obliques and lower back for a bulletproof midsection.', '18:45', 'strength', 250, 'base', true),
  ('HIIT Sprint Session', 'High intensity interval sprints designed to torch calories and boost your metabolism.', '22:00', 'hiit', 420, 'base', true),
  ('Upper Body Power', 'Push and pull supersets for chest, back, shoulders and arms. Build real functional strength.', '30:15', 'strength', 380, 'base', true),
  ('Leg Day Burn', 'Squats, lunges, and explosive movements to build powerful legs and glutes.', '28:40', 'strength', 440, 'base', true),
  ('Mobility & Recovery', 'Full-body stretching and mobility flow. Essential for recovery and injury prevention.', '15:20', 'recovery', 90, 'base', true),
  ('Cardio Endurance Run', 'Steady-state cardio session designed to build your aerobic base and heart health.', '35:00', 'cardio', 480, 'pro', true),
  ('Advanced HIIT Tabata', 'Pro-level Tabata intervals — 20 seconds on, 10 seconds off. Maximum fat burn.', '25:00', 'hiit', 520, 'pro', true),
  ('Shoulder Sculpt', 'Isolation and compound movements for 3D shoulder development and definition.', '24:30', 'strength', 310, 'pro', true),
  ('Hip Mobility Flow', 'Deep hip flexor and glute stretches to open tight hips and improve squat depth.', '18:00', 'mobility', 100, 'base', true),
  ('Elite Push Protocol', 'Advanced push day programming for experienced athletes. Serious chest and tricep volume.', '40:00', 'strength', 460, 'elite', true),
  ('Sprint & Strength Combo', 'David''s signature workout — alternating strength circuits with sprint intervals.', '45:00', 'hiit', 600, 'elite', true);
