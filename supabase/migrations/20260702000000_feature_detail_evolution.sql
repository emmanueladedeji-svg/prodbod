-- ─────────────────────────────────────────────────────────────────────────────
-- Feature Detail Evolution
-- Run each numbered block ONE AT A TIME in the Supabase SQL editor.
-- Verify the SELECT at the end of each block before moving to the next.
-- Every block is idempotent — safe to re-run if something goes wrong.
-- ─────────────────────────────────────────────────────────────────────────────


-- ═══════════════════════════════════════════════════════════════════════════
-- BLOCK 1a — Baseline counts (record these numbers; re-run at the very end)
-- ═══════════════════════════════════════════════════════════════════════════
SELECT
  (SELECT COUNT(*) FROM public.features)          AS features_count,
  (SELECT COUNT(*) FROM public.tasks)             AS tasks_count,
  (SELECT COUNT(*) FROM public.feature_comments)  AS feature_comments_count,
  (SELECT COUNT(*) FROM auth.users)               AS auth_users_count,
  (SELECT COUNT(*) FROM public.organization_members) AS org_members_count;


-- ═══════════════════════════════════════════════════════════════════════════
-- BLOCK 1b — feature_assignees junction table
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.feature_assignees (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_id  UUID NOT NULL,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE (feature_id, user_id)
);

-- FK to features (separate statement so IF NOT EXISTS works cleanly)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_feature_assignees_feature'
  ) THEN
    ALTER TABLE public.feature_assignees
      ADD CONSTRAINT fk_feature_assignees_feature
      FOREIGN KEY (feature_id)
      REFERENCES public.features(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Index for fast feature-centric lookups
CREATE INDEX IF NOT EXISTS idx_feature_assignees_feature_id
  ON public.feature_assignees(feature_id);

-- Verify
SELECT COUNT(*) AS feature_assignees_rows FROM public.feature_assignees;


-- ═══════════════════════════════════════════════════════════════════════════
-- BLOCK 1c — New columns on the features table
-- ═══════════════════════════════════════════════════════════════════════════

-- effort_size: XS / S / M / L / XL
ALTER TABLE public.features
  ADD COLUMN IF NOT EXISTS effort_size TEXT
    CHECK (effort_size IS NULL OR effort_size IN ('XS', 'S', 'M', 'L', 'XL'));

-- objective_id: soft link to product_objectives (nullable FK, no hard constraint
-- so it doesn't break if product_objectives rows are deleted during product work)
ALTER TABLE public.features
  ADD COLUMN IF NOT EXISTS objective_id UUID;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'product_objectives'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_features_objective_id'
  ) THEN
    ALTER TABLE public.features
      ADD CONSTRAINT fk_features_objective_id
      FOREIGN KEY (objective_id)
      REFERENCES public.product_objectives(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Verify the new columns exist
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'features'
  AND column_name IN ('effort_size', 'objective_id', 'start_date', 'story_points', 'sprint_id')
ORDER BY column_name;


-- ═══════════════════════════════════════════════════════════════════════════
-- BLOCK 1d — feature_activity table
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.feature_activity (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_id          UUID NOT NULL,
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type                TEXT NOT NULL CHECK (
    type IN (
      'comment',
      'status_change',
      'assignee_change',
      'field_change',
      'created',
      'sub_feature_added',
      'task_added',
      'feedback_linked'
    )
  ),
  -- comment fields
  body                TEXT,
  -- change record fields
  field_name          TEXT,
  old_value           TEXT,
  new_value           TEXT,
  -- @mention support (array of user IDs mentioned in a comment body)
  mentioned_user_ids  UUID[],
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now(),
  is_deleted          BOOLEAN NOT NULL DEFAULT false
);

-- FK to features
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_feature_activity_feature'
  ) THEN
    ALTER TABLE public.feature_activity
      ADD CONSTRAINT fk_feature_activity_feature
      FOREIGN KEY (feature_id)
      REFERENCES public.features(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Index for fast feed queries (newest first per feature)
CREATE INDEX IF NOT EXISTS idx_feature_activity_feature_created
  ON public.feature_activity(feature_id, created_at DESC);

-- Seed a 'created' event for every existing feature that doesn't have one yet.
-- Uses the feature's own created_at as the event timestamp.
-- Falls back to the first auth.users row if created_by is not a column (it isn't
-- in this schema — owner_name is free text). We use the org owner as author.
INSERT INTO public.feature_activity (feature_id, user_id, type, created_at)
SELECT
  f.id,
  COALESCE(
    -- Try to resolve a real user from organization_members via the product chain
    (
      SELECT om.member_user_id
      FROM public.product_objectives po
      JOIN public.strategies st ON st.id = po.strategy_id
      JOIN public.business_objectives bo ON bo.id = st.business_objective_id
      JOIN public.products pr ON pr.id = bo.product_id
      JOIN public.organization_members om
        ON om.organization_id = COALESCE(pr.organization_id, pr.org_id)
        AND om.status = 'Active'
        AND om.member_user_id IS NOT NULL
      WHERE po.id = f.product_objective_id
      LIMIT 1
    ),
    -- Hard fallback: any active auth user
    (SELECT id FROM auth.users ORDER BY created_at LIMIT 1)
  ),
  'created',
  COALESCE(f.created_at, now())
FROM public.features f
WHERE NOT EXISTS (
  SELECT 1 FROM public.feature_activity a
  WHERE a.feature_id = f.id AND a.type = 'created'
);

-- Verify
SELECT type, COUNT(*) FROM public.feature_activity GROUP BY type ORDER BY type;


-- ═══════════════════════════════════════════════════════════════════════════
-- BLOCK 1e — RLS policies
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.feature_assignees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_activity  ENABLE ROW LEVEL SECURITY;

-- Helper: is a given feature visible to the current user?
-- A feature is visible if it belongs to a product in the user's org(s).
-- We define this inline in each policy rather than a function so the policy
-- is self-contained and easy to audit.

-- ── feature_assignees ────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE POLICY "fa_select_org_member"
  ON public.feature_assignees FOR SELECT
  USING (
    feature_id IN (
      SELECT f.id FROM public.features f
      JOIN public.product_objectives po ON po.id = f.product_objective_id
      JOIN public.strategies st ON st.id = po.strategy_id
      JOIN public.business_objectives bo ON bo.id = st.business_objective_id
      JOIN public.products pr ON pr.id = bo.product_id
      JOIN public.organization_members om
        ON om.organization_id = COALESCE(pr.organization_id, pr.org_id)
       AND om.member_user_id = auth.uid()
       AND om.status = 'Active'
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "fa_insert_org_member"
  ON public.feature_assignees FOR INSERT
  WITH CHECK (
    feature_id IN (
      SELECT f.id FROM public.features f
      JOIN public.product_objectives po ON po.id = f.product_objective_id
      JOIN public.strategies st ON st.id = po.strategy_id
      JOIN public.business_objectives bo ON bo.id = st.business_objective_id
      JOIN public.products pr ON pr.id = bo.product_id
      JOIN public.organization_members om
        ON om.organization_id = COALESCE(pr.organization_id, pr.org_id)
       AND om.member_user_id = auth.uid()
       AND om.status = 'Active'
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "fa_delete_org_member"
  ON public.feature_assignees FOR DELETE
  USING (
    feature_id IN (
      SELECT f.id FROM public.features f
      JOIN public.product_objectives po ON po.id = f.product_objective_id
      JOIN public.strategies st ON st.id = po.strategy_id
      JOIN public.business_objectives bo ON bo.id = st.business_objective_id
      JOIN public.products pr ON pr.id = bo.product_id
      JOIN public.organization_members om
        ON om.organization_id = COALESCE(pr.organization_id, pr.org_id)
       AND om.member_user_id = auth.uid()
       AND om.status = 'Active'
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── feature_activity ─────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE POLICY "fact_select_org_member"
  ON public.feature_activity FOR SELECT
  USING (
    is_deleted = false
    AND feature_id IN (
      SELECT f.id FROM public.features f
      JOIN public.product_objectives po ON po.id = f.product_objective_id
      JOIN public.strategies st ON st.id = po.strategy_id
      JOIN public.business_objectives bo ON bo.id = st.business_objective_id
      JOIN public.products pr ON pr.id = bo.product_id
      JOIN public.organization_members om
        ON om.organization_id = COALESCE(pr.organization_id, pr.org_id)
       AND om.member_user_id = auth.uid()
       AND om.status = 'Active'
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "fact_insert_own"
  ON public.feature_activity FOR INSERT
  WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "fact_update_own_comment"
  ON public.feature_activity FOR UPDATE
  USING (user_id = auth.uid() AND type = 'comment');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Verify policies
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('feature_assignees', 'feature_activity')
ORDER BY tablename, policyname;


-- ═══════════════════════════════════════════════════════════════════════════
-- BLOCK 1f — updated_at trigger on feature_activity
-- ═══════════════════════════════════════════════════════════════════════════

-- The update_updated_at_column() function already exists in this DB
-- (created by a prior migration). We just wire it to feature_activity.
DROP TRIGGER IF EXISTS feature_activity_updated_at ON public.feature_activity;
CREATE TRIGGER feature_activity_updated_at
  BEFORE UPDATE ON public.feature_activity
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Also ensure features itself has the trigger (safe to re-create)
DROP TRIGGER IF EXISTS features_updated_at ON public.features;
CREATE TRIGGER features_updated_at
  BEFORE UPDATE ON public.features
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Verify triggers
SELECT trigger_name, event_object_table, event_manipulation
FROM information_schema.triggers
WHERE trigger_name IN ('features_updated_at', 'feature_activity_updated_at')
ORDER BY event_object_table;


-- ═══════════════════════════════════════════════════════════════════════════
-- BLOCK 1g (MANUAL — cannot be done via SQL)
-- ═══════════════════════════════════════════════════════════════════════════
-- In the Supabase dashboard:
--   Database → Replication → Tables
--   Enable realtime for: feature_activity, feature_assignees
-- ─────────────────────────────────────────────────────────────────────────────


-- ═══════════════════════════════════════════════════════════════════════════
-- FINAL — Re-run baseline counts; all numbers must match BLOCK 1a exactly
-- ═══════════════════════════════════════════════════════════════════════════
SELECT
  (SELECT COUNT(*) FROM public.features)          AS features_count,
  (SELECT COUNT(*) FROM public.tasks)             AS tasks_count,
  (SELECT COUNT(*) FROM public.feature_comments)  AS feature_comments_count,
  (SELECT COUNT(*) FROM auth.users)               AS auth_users_count,
  (SELECT COUNT(*) FROM public.organization_members) AS org_members_count;
