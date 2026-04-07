
-- Extend strategies table with new columns
ALTER TABLE public.strategies
  ADD COLUMN IF NOT EXISTS name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS description text DEFAULT '',
  ADD COLUMN IF NOT EXISTS problem_statement text DEFAULT '',
  ADD COLUMN IF NOT EXISTS approach text DEFAULT '',
  ADD COLUMN IF NOT EXISTS value_lever text DEFAULT 'acquisition',
  ADD COLUMN IF NOT EXISTS hypothesis text DEFAULT '',
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS end_date date,
  ADD COLUMN IF NOT EXISTS health_score numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'not_started',
  ADD COLUMN IF NOT EXISTS partial_threshold numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS failure_threshold numeric DEFAULT 0;

-- Create strategy_metrics table
CREATE TABLE IF NOT EXISTS public.strategy_metrics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  strategy_id uuid NOT NULL REFERENCES public.strategies(id) ON DELETE CASCADE,
  metric_name text NOT NULL,
  baseline_value numeric NOT NULL DEFAULT 0,
  target_value numeric NOT NULL DEFAULT 0,
  current_value numeric NOT NULL DEFAULT 0,
  measurement_frequency text DEFAULT 'monthly',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on strategy_metrics
ALTER TABLE public.strategy_metrics ENABLE ROW LEVEL SECURITY;

-- RLS policies for strategy_metrics (mirror strategy chain)
CREATE POLICY "strategy_metric_select" ON public.strategy_metrics
  AS RESTRICTIVE FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM strategies s
    JOIN business_objectives bo ON bo.id = s.business_objective_id
    JOIN products p ON p.id = bo.product_id
    JOIN organizations o ON o.id = p.organization_id
    WHERE s.id = strategy_metrics.strategy_id AND o.user_id = auth.uid()
  ));

CREATE POLICY "strategy_metric_insert" ON public.strategy_metrics
  AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM strategies s
    JOIN business_objectives bo ON bo.id = s.business_objective_id
    JOIN products p ON p.id = bo.product_id
    JOIN organizations o ON o.id = p.organization_id
    WHERE s.id = strategy_metrics.strategy_id AND o.user_id = auth.uid()
  ));

CREATE POLICY "strategy_metric_update" ON public.strategy_metrics
  AS RESTRICTIVE FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM strategies s
    JOIN business_objectives bo ON bo.id = s.business_objective_id
    JOIN products p ON p.id = bo.product_id
    JOIN organizations o ON o.id = p.organization_id
    WHERE s.id = strategy_metrics.strategy_id AND o.user_id = auth.uid()
  ));

CREATE POLICY "strategy_metric_delete" ON public.strategy_metrics
  AS RESTRICTIVE FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM strategies s
    JOIN business_objectives bo ON bo.id = s.business_objective_id
    JOIN products p ON p.id = bo.product_id
    JOIN organizations o ON o.id = p.organization_id
    WHERE s.id = strategy_metrics.strategy_id AND o.user_id = auth.uid()
  ));

-- Add updated_at trigger
CREATE TRIGGER update_strategy_metrics_updated_at
  BEFORE UPDATE ON public.strategy_metrics
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
