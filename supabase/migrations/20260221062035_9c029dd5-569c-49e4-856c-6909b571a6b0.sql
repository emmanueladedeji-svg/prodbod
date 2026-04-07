
-- Add storytelling narrative columns to visions table
ALTER TABLE public.visions
  ADD COLUMN IF NOT EXISTS once_upon_a_time text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS every_day text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS one_day text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS because_of_that text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS until_finally text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS generated_story text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS strategic_intent text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS value_proposition text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS success_indicators text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS time_horizon integer NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS target_segment_ids uuid[] NOT NULL DEFAULT '{}';
