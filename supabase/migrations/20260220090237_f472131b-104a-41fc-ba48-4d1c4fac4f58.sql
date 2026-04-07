
-- Extend market_segments with rich profiling fields
ALTER TABLE public.market_segments
  ADD COLUMN IF NOT EXISTS customer_type text,
  ADD COLUMN IF NOT EXISTS industry text,
  ADD COLUMN IF NOT EXISTS geography text,
  ADD COLUMN IF NOT EXISTS competitive_intensity text DEFAULT 'Medium',
  ADD COLUMN IF NOT EXISTS strategic_importance text DEFAULT 'Medium',
  ADD COLUMN IF NOT EXISTS purchasing_power text,
  ADD COLUMN IF NOT EXISTS tam numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS sam numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS som numeric,
  ADD COLUMN IF NOT EXISTS measurement_type text DEFAULT 'revenue',
  ADD COLUMN IF NOT EXISTS current_customers integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_revenue numeric DEFAULT 0;

-- Create market_targets table
CREATE TABLE IF NOT EXISTS public.market_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_id uuid NOT NULL REFERENCES public.market_segments(id) ON DELETE CASCADE,
  name text NOT NULL,
  metric_type text NOT NULL DEFAULT 'revenue',
  target_value numeric NOT NULL DEFAULT 0,
  current_value numeric,
  start_date date,
  deadline date,
  priority text NOT NULL DEFAULT 'medium',
  owner text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on market_targets
ALTER TABLE public.market_targets ENABLE ROW LEVEL SECURITY;

-- RLS policies for market_targets (via segment → product → org → user)
CREATE POLICY "market_target_select" ON public.market_targets
  FOR SELECT
  USING (EXISTS (
    SELECT 1
    FROM public.market_segments ms
    JOIN public.products p ON p.id = ms.product_id
    JOIN public.organizations o ON o.id = p.organization_id
    WHERE ms.id = market_targets.segment_id
      AND o.user_id = auth.uid()
  ));

CREATE POLICY "market_target_insert" ON public.market_targets
  FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1
    FROM public.market_segments ms
    JOIN public.products p ON p.id = ms.product_id
    JOIN public.organizations o ON o.id = p.organization_id
    WHERE ms.id = market_targets.segment_id
      AND o.user_id = auth.uid()
  ));

CREATE POLICY "market_target_update" ON public.market_targets
  FOR UPDATE
  USING (EXISTS (
    SELECT 1
    FROM public.market_segments ms
    JOIN public.products p ON p.id = ms.product_id
    JOIN public.organizations o ON o.id = p.organization_id
    WHERE ms.id = market_targets.segment_id
      AND o.user_id = auth.uid()
  ));

CREATE POLICY "market_target_delete" ON public.market_targets
  FOR DELETE
  USING (EXISTS (
    SELECT 1
    FROM public.market_segments ms
    JOIN public.products p ON p.id = ms.product_id
    JOIN public.organizations o ON o.id = p.organization_id
    WHERE ms.id = market_targets.segment_id
      AND o.user_id = auth.uid()
  ));

-- Trigger for updated_at on market_targets
CREATE TRIGGER update_market_targets_updated_at
  BEFORE UPDATE ON public.market_targets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
