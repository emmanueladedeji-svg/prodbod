
-- A. Extend features table
ALTER TABLE public.features
  ADD COLUMN IF NOT EXISTS feature_code text DEFAULT '',
  ADD COLUMN IF NOT EXISTS feature_type text DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS release_id uuid REFERENCES public.releases(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS sprint_id uuid,
  ADD COLUMN IF NOT EXISTS story_points numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS time_estimate numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS assignee_name text DEFAULT '',
  ADD COLUMN IF NOT EXISTS progress numeric DEFAULT 0;

-- B. Extend releases table
ALTER TABLE public.releases
  ADD COLUMN IF NOT EXISTS goal text DEFAULT '',
  ADD COLUMN IF NOT EXISTS release_type text DEFAULT 'minor',
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'planned',
  ADD COLUMN IF NOT EXISTS target_date date,
  ADD COLUMN IF NOT EXISTS progress numeric DEFAULT 0;

-- C. Create sprints table
CREATE TABLE IF NOT EXISTS public.sprints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name text NOT NULL,
  goal text DEFAULT '',
  start_date date,
  end_date date,
  status text DEFAULT 'planned',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.sprints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sprint_select" ON public.sprints FOR SELECT USING (
  EXISTS (SELECT 1 FROM products p JOIN organizations o ON o.id = p.organization_id WHERE p.id = sprints.product_id AND o.user_id = auth.uid())
);
CREATE POLICY "sprint_insert" ON public.sprints FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM products p JOIN organizations o ON o.id = p.organization_id WHERE p.id = sprints.product_id AND o.user_id = auth.uid())
);
CREATE POLICY "sprint_update" ON public.sprints FOR UPDATE USING (
  EXISTS (SELECT 1 FROM products p JOIN organizations o ON o.id = p.organization_id WHERE p.id = sprints.product_id AND o.user_id = auth.uid())
);
CREATE POLICY "sprint_delete" ON public.sprints FOR DELETE USING (
  EXISTS (SELECT 1 FROM products p JOIN organizations o ON o.id = p.organization_id WHERE p.id = sprints.product_id AND o.user_id = auth.uid())
);

-- Add FK from features to sprints
ALTER TABLE public.features
  ADD CONSTRAINT features_sprint_id_fkey FOREIGN KEY (sprint_id) REFERENCES public.sprints(id) ON DELETE SET NULL;

-- Updated_at trigger on sprints
CREATE TRIGGER update_sprints_updated_at BEFORE UPDATE ON public.sprints
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- D. Create feature_comments table
CREATE TABLE IF NOT EXISTS public.feature_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_id uuid NOT NULL REFERENCES public.features(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.feature_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feature_comment_select" ON public.feature_comments FOR SELECT USING (
  EXISTS (SELECT 1 FROM features f JOIN product_objectives po ON po.id = f.product_objective_id JOIN strategies s ON s.id = po.strategy_id JOIN business_objectives bo ON bo.id = s.business_objective_id JOIN products p ON p.id = bo.product_id JOIN organizations o ON o.id = p.organization_id WHERE f.id = feature_comments.feature_id AND o.user_id = auth.uid())
);
CREATE POLICY "feature_comment_insert" ON public.feature_comments FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM features f JOIN product_objectives po ON po.id = f.product_objective_id JOIN strategies s ON s.id = po.strategy_id JOIN business_objectives bo ON bo.id = s.business_objective_id JOIN products p ON p.id = bo.product_id JOIN organizations o ON o.id = p.organization_id WHERE f.id = feature_comments.feature_id AND o.user_id = auth.uid())
);
CREATE POLICY "feature_comment_delete" ON public.feature_comments FOR DELETE USING (
  EXISTS (SELECT 1 FROM features f JOIN product_objectives po ON po.id = f.product_objective_id JOIN strategies s ON s.id = po.strategy_id JOIN business_objectives bo ON bo.id = s.business_objective_id JOIN products p ON p.id = bo.product_id JOIN organizations o ON o.id = p.organization_id WHERE f.id = feature_comments.feature_id AND o.user_id = auth.uid())
);

-- E. Auto-code generation function and trigger
CREATE OR REPLACE FUNCTION public.generate_feature_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_num integer;
BEGIN
  SELECT COUNT(*) + 1 INTO next_num FROM features WHERE product_objective_id = NEW.product_objective_id;
  NEW.feature_code := 'FEAT-' || LPAD(next_num::text, 3, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_feature_code BEFORE INSERT ON public.features
  FOR EACH ROW EXECUTE FUNCTION public.generate_feature_code();

-- Updated_at trigger on features (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_features_updated_at') THEN
    CREATE TRIGGER update_features_updated_at BEFORE UPDATE ON public.features
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END$$;
