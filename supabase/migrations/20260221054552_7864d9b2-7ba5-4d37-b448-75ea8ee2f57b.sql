
-- Add ARPU-based columns to market_segments
ALTER TABLE public.market_segments
  ADD COLUMN IF NOT EXISTS tam_customers integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tam_arpu numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sam_customers integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sam_arpu numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS som_capture_pct numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'USD';

-- Add targeting columns to business_objectives
ALTER TABLE public.business_objectives
  ADD COLUMN IF NOT EXISTS objective_type text DEFAULT 'increase',
  ADD COLUMN IF NOT EXISTS target_type text DEFAULT 'revenue',
  ADD COLUMN IF NOT EXISTS target_segment_id uuid REFERENCES public.market_segments(id),
  ADD COLUMN IF NOT EXISTS target_percentage numeric,
  ADD COLUMN IF NOT EXISTS target_customers integer,
  ADD COLUMN IF NOT EXISTS target_revenue numeric,
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS end_date date,
  ADD COLUMN IF NOT EXISTS owner_name text,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'not_started';
