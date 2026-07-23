-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: ProdBod requirements database schema definition
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Create product_lines table
CREATE TABLE IF NOT EXISTS public.product_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS for product_lines
ALTER TABLE public.product_lines ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "pl_select" ON public.product_lines FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "pl_insert" ON public.product_lines FOR INSERT WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "pl_update" ON public.product_lines FOR UPDATE USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "pl_delete" ON public.product_lines FOR DELETE USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Create backlogs table
CREATE TABLE IF NOT EXISTS public.backlogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_line_id UUID UNIQUE REFERENCES public.product_lines(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Backlog',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS for backlogs
ALTER TABLE public.backlogs ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "bl_select" ON public.backlogs FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "bl_insert" ON public.backlogs FOR INSERT WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "bl_update" ON public.backlogs FOR UPDATE USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "bl_delete" ON public.backlogs FOR DELETE USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. Create objectives table
CREATE TABLE IF NOT EXISTS public.objectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  target_date DATE,
  status TEXT NOT NULL DEFAULT 'on_track', -- on_track, at_risk, off_track, achieved
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS for objectives
ALTER TABLE public.objectives ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "obj_select" ON public.objectives FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "obj_insert" ON public.objectives FOR INSERT WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "obj_update" ON public.objectives FOR UPDATE USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "obj_delete" ON public.objectives FOR DELETE USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 4. Create objective_features junction table
CREATE TABLE IF NOT EXISTS public.objective_features (
  objective_id UUID REFERENCES public.objectives(id) ON DELETE CASCADE,
  feature_id UUID REFERENCES public.workspace_features(id) ON DELETE CASCADE,
  PRIMARY KEY (objective_id, feature_id)
);

-- Enable RLS for objective_features
ALTER TABLE public.objective_features ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "obj_feat_select" ON public.objective_features FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "obj_feat_insert" ON public.objective_features FOR INSERT WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "obj_feat_delete" ON public.objective_features FOR DELETE USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 5. Create sprint_objectives junction table
CREATE TABLE IF NOT EXISTS public.sprint_objectives (
  sprint_id UUID REFERENCES public.sprints(id) ON DELETE CASCADE,
  objective_id UUID REFERENCES public.objectives(id) ON DELETE CASCADE,
  PRIMARY KEY (sprint_id, objective_id)
);

-- Enable RLS for sprint_objectives
ALTER TABLE public.sprint_objectives ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "so_select" ON public.sprint_objectives FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "so_insert" ON public.sprint_objectives FOR INSERT WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "so_delete" ON public.sprint_objectives FOR DELETE USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 6. Add columns to workspace_features
ALTER TABLE public.workspace_features ADD COLUMN IF NOT EXISTS product_line_id UUID REFERENCES public.product_lines(id) ON DELETE SET NULL;
ALTER TABLE public.workspace_features ADD COLUMN IF NOT EXISTS sprint_id UUID REFERENCES public.sprints(id) ON DELETE SET NULL;
ALTER TABLE public.workspace_features ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE public.workspace_features ADD COLUMN IF NOT EXISTS story_points INTEGER DEFAULT 0;
ALTER TABLE public.workspace_features ADD COLUMN IF NOT EXISTS time_estimate INTEGER DEFAULT 0;
ALTER TABLE public.workspace_features ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT FALSE;
ALTER TABLE public.workspace_features ADD COLUMN IF NOT EXISTS blocked_reason TEXT;
ALTER TABLE public.workspace_features ADD COLUMN IF NOT EXISTS in_progress_since TIMESTAMPTZ;
ALTER TABLE public.workspace_features ADD COLUMN IF NOT EXISTS phase_entered_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.workspace_features ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0;

-- 7. Create workspace_feature_assignees junction table (multiple assignees support)
CREATE TABLE IF NOT EXISTS public.workspace_feature_assignees (
  feature_id UUID REFERENCES public.workspace_features(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  PRIMARY KEY (feature_id, user_id)
);

-- Enable RLS for workspace_feature_assignees
ALTER TABLE public.workspace_feature_assignees ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "fa_select" ON public.workspace_feature_assignees FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "fa_insert" ON public.workspace_feature_assignees FOR INSERT WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "fa_delete" ON public.workspace_feature_assignees FOR DELETE USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 8. Create workspace_feature_checklists table
CREATE TABLE IF NOT EXISTS public.workspace_feature_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_id UUID NOT NULL REFERENCES public.workspace_features(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS for checklists
ALTER TABLE public.workspace_feature_checklists ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "chk_select" ON public.workspace_feature_checklists FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "chk_insert" ON public.workspace_feature_checklists FOR INSERT WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "chk_update" ON public.workspace_feature_checklists FOR UPDATE USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "chk_delete" ON public.workspace_feature_checklists FOR DELETE USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 9. Create workspace_feature_user_stories table
CREATE TABLE IF NOT EXISTS public.workspace_feature_user_stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_id UUID NOT NULL REFERENCES public.workspace_features(id) ON DELETE CASCADE,
  story_text TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS for user_stories
ALTER TABLE public.workspace_feature_user_stories ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "us_select" ON public.workspace_feature_user_stories FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "us_insert" ON public.workspace_feature_user_stories FOR INSERT WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "us_update" ON public.workspace_feature_user_stories FOR UPDATE USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "us_delete" ON public.workspace_feature_user_stories FOR DELETE USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 10. Create workspace_feature_comments table
CREATE TABLE IF NOT EXISTS public.workspace_feature_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_id UUID NOT NULL REFERENCES public.workspace_features(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.workspace_feature_comments(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS for comments
ALTER TABLE public.workspace_feature_comments ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "comm_select" ON public.workspace_feature_comments FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "comm_insert" ON public.workspace_feature_comments FOR INSERT WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "comm_update" ON public.workspace_feature_comments FOR UPDATE USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "comm_delete" ON public.workspace_feature_comments FOR DELETE USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 11. Create workspace_feature_activities table (immutable activity logs)
CREATE TABLE IF NOT EXISTS public.workspace_feature_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_id UUID NOT NULL REFERENCES public.workspace_features(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name TEXT,
  action_type TEXT NOT NULL, -- 'phase', 'priority', 'sprint', 'assignee', 'dates', 'task_add', 'task_remove', 'sub_feature_add', 'sub_feature_remove'
  description TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS for activities (read-only for security, inserts allowed)
ALTER TABLE public.workspace_feature_activities ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "act_select" ON public.workspace_feature_activities FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "act_insert" ON public.workspace_feature_activities FOR INSERT WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 12. Create sprint_snapshots table
CREATE TABLE IF NOT EXISTS public.sprint_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sprint_id UUID NOT NULL REFERENCES public.sprints(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  completed_points INTEGER NOT NULL DEFAULT 0,
  completed_features INTEGER NOT NULL DEFAULT 0,
  features_per_phase JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_sprint_snapshot_date UNIQUE (sprint_id, snapshot_date)
);

-- Enable RLS for sprint_snapshots
ALTER TABLE public.sprint_snapshots ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "snap_select" ON public.sprint_snapshots FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "snap_insert" ON public.sprint_snapshots FOR INSERT WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "snap_update" ON public.sprint_snapshots FOR UPDATE USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 13. Backfill status "Ready for Prod" to product_statuses table if not exists
INSERT INTO public.product_statuses (product_id, org_id, name, color, category, position, is_default, is_closed)
SELECT p.id, COALESCE(p.org_id, p.organization_id), 'Ready for Prod', '#3b82f6', 'done', 4, FALSE, FALSE
FROM public.products p
WHERE NOT EXISTS (
  SELECT 1 FROM public.product_statuses ps WHERE ps.product_id = p.id AND ps.name = 'Ready for Prod'
);

-- Modify the create_default_product_statuses() trigger function to include Ready for Prod
CREATE OR REPLACE FUNCTION public.create_default_product_statuses()
RETURNS TRIGGER AS $$
DECLARE v_org_id UUID;
BEGIN
  v_org_id := COALESCE(NEW.org_id, NEW.organization_id);
  INSERT INTO public.product_statuses (product_id, org_id, name, color, category, position, is_default, is_closed) VALUES
    (NEW.id, v_org_id, 'Idea or Problem', '#8b5cf6', 'not_started', 0, TRUE,  FALSE),
    (NEW.id, v_org_id, 'Discovery',       '#0891b2', 'active',      0, FALSE, FALSE),
    (NEW.id, v_org_id, 'Prototyping',     '#d97706', 'active',      1, FALSE, FALSE),
    (NEW.id, v_org_id, 'In Development',  '#2563eb', 'active',      2, FALSE, FALSE),
    (NEW.id, v_org_id, 'In Testing',      '#dc2626', 'active',      3, FALSE, FALSE),
    (NEW.id, v_org_id, 'Ready for Prod',  '#3b82f6', 'done',        4, FALSE, FALSE),
    (NEW.id, v_org_id, 'Live',            '#16a34a', 'done',        5, FALSE, FALSE),
    (NEW.id, v_org_id, 'Closed',          '#0f766e', 'closed',      0, FALSE, TRUE);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 8. Add pm_user_id and lead_engineer_user_id columns to products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS pm_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS lead_engineer_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
