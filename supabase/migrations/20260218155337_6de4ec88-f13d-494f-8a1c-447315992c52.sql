
-- Step 1: Add user_id column to organizations (the root ownership anchor)
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 2: Make user_id NOT NULL after adding (existing rows will need to be handled)
-- For now allow nullable since we'll enforce via RLS; existing data is dev data

-- ============================================================
-- DROP ALL PERMISSIVE POLICIES
-- ============================================================
DO $$
DECLARE
  tbl text;
  pol text;
BEGIN
  FOR tbl, pol IN
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol, tbl);
  END LOOP;
END$$;

-- ============================================================
-- ORGANIZATIONS: owner is the user who created it
-- ============================================================
CREATE POLICY "org_select" ON public.organizations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "org_insert" ON public.organizations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "org_update" ON public.organizations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "org_delete" ON public.organizations
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- PRODUCTS: accessible if org belongs to user
-- ============================================================
CREATE POLICY "product_select" ON public.products
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organizations o
      WHERE o.id = products.organization_id AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "product_insert" ON public.products
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organizations o
      WHERE o.id = products.organization_id AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "product_update" ON public.products
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.organizations o
      WHERE o.id = products.organization_id AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "product_delete" ON public.products
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.organizations o
      WHERE o.id = products.organization_id AND o.user_id = auth.uid()
    )
  );

-- ============================================================
-- TEAMS: accessible if org belongs to user
-- ============================================================
CREATE POLICY "team_select" ON public.teams
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organizations o
      WHERE o.id = teams.organization_id AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "team_insert" ON public.teams
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organizations o
      WHERE o.id = teams.organization_id AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "team_update" ON public.teams
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.organizations o
      WHERE o.id = teams.organization_id AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "team_delete" ON public.teams
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.organizations o
      WHERE o.id = teams.organization_id AND o.user_id = auth.uid()
    )
  );

-- ============================================================
-- TEAM_MEMBERS: accessible via team → org → user
-- ============================================================
CREATE POLICY "team_member_select" ON public.team_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.teams t
      JOIN public.organizations o ON o.id = t.organization_id
      WHERE t.id = team_members.team_id AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "team_member_insert" ON public.team_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.teams t
      JOIN public.organizations o ON o.id = t.organization_id
      WHERE t.id = team_members.team_id AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "team_member_update" ON public.team_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.teams t
      JOIN public.organizations o ON o.id = t.organization_id
      WHERE t.id = team_members.team_id AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "team_member_delete" ON public.team_members
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.teams t
      JOIN public.organizations o ON o.id = t.organization_id
      WHERE t.id = team_members.team_id AND o.user_id = auth.uid()
    )
  );

-- ============================================================
-- PRODUCT_TEAMS: junction, via product → org → user
-- ============================================================
CREATE POLICY "product_team_select" ON public.product_teams
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.organizations o ON o.id = p.organization_id
      WHERE p.id = product_teams.product_id AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "product_team_insert" ON public.product_teams
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.organizations o ON o.id = p.organization_id
      WHERE p.id = product_teams.product_id AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "product_team_delete" ON public.product_teams
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.organizations o ON o.id = p.organization_id
      WHERE p.id = product_teams.product_id AND o.user_id = auth.uid()
    )
  );

-- ============================================================
-- MARKET_SEGMENTS: via product → org → user
-- ============================================================
CREATE POLICY "market_segment_select" ON public.market_segments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.organizations o ON o.id = p.organization_id
      WHERE p.id = market_segments.product_id AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "market_segment_insert" ON public.market_segments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.organizations o ON o.id = p.organization_id
      WHERE p.id = market_segments.product_id AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "market_segment_update" ON public.market_segments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.organizations o ON o.id = p.organization_id
      WHERE p.id = market_segments.product_id AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "market_segment_delete" ON public.market_segments
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.organizations o ON o.id = p.organization_id
      WHERE p.id = market_segments.product_id AND o.user_id = auth.uid()
    )
  );

-- ============================================================
-- MARKET_MODELS: via product → org → user
-- ============================================================
CREATE POLICY "market_model_select" ON public.market_models
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.organizations o ON o.id = p.organization_id
      WHERE p.id = market_models.product_id AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "market_model_insert" ON public.market_models
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.organizations o ON o.id = p.organization_id
      WHERE p.id = market_models.product_id AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "market_model_update" ON public.market_models
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.organizations o ON o.id = p.organization_id
      WHERE p.id = market_models.product_id AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "market_model_delete" ON public.market_models
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.organizations o ON o.id = p.organization_id
      WHERE p.id = market_models.product_id AND o.user_id = auth.uid()
    )
  );

-- ============================================================
-- VISIONS: via product → org → user
-- ============================================================
CREATE POLICY "vision_select" ON public.visions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.organizations o ON o.id = p.organization_id
      WHERE p.id = visions.product_id AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "vision_insert" ON public.visions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.organizations o ON o.id = p.organization_id
      WHERE p.id = visions.product_id AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "vision_update" ON public.visions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.organizations o ON o.id = p.organization_id
      WHERE p.id = visions.product_id AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "vision_delete" ON public.visions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.organizations o ON o.id = p.organization_id
      WHERE p.id = visions.product_id AND o.user_id = auth.uid()
    )
  );

-- ============================================================
-- BUSINESS_OBJECTIVES: via product → org → user
-- ============================================================
CREATE POLICY "biz_obj_select" ON public.business_objectives
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.organizations o ON o.id = p.organization_id
      WHERE p.id = business_objectives.product_id AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "biz_obj_insert" ON public.business_objectives
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.organizations o ON o.id = p.organization_id
      WHERE p.id = business_objectives.product_id AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "biz_obj_update" ON public.business_objectives
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.organizations o ON o.id = p.organization_id
      WHERE p.id = business_objectives.product_id AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "biz_obj_delete" ON public.business_objectives
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.organizations o ON o.id = p.organization_id
      WHERE p.id = business_objectives.product_id AND o.user_id = auth.uid()
    )
  );

-- ============================================================
-- BUSINESS_METRICS: via business_objective → product → org → user
-- ============================================================
CREATE POLICY "biz_metric_select" ON public.business_metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.business_objectives bo
      JOIN public.products p ON p.id = bo.product_id
      JOIN public.organizations o ON o.id = p.organization_id
      WHERE bo.id = business_metrics.business_objective_id AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "biz_metric_insert" ON public.business_metrics
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.business_objectives bo
      JOIN public.products p ON p.id = bo.product_id
      JOIN public.organizations o ON o.id = p.organization_id
      WHERE bo.id = business_metrics.business_objective_id AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "biz_metric_update" ON public.business_metrics
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.business_objectives bo
      JOIN public.products p ON p.id = bo.product_id
      JOIN public.organizations o ON o.id = p.organization_id
      WHERE bo.id = business_metrics.business_objective_id AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "biz_metric_delete" ON public.business_metrics
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.business_objectives bo
      JOIN public.products p ON p.id = bo.product_id
      JOIN public.organizations o ON o.id = p.organization_id
      WHERE bo.id = business_metrics.business_objective_id AND o.user_id = auth.uid()
    )
  );

-- ============================================================
-- STRATEGIES: via business_objective → product → org → user
-- ============================================================
CREATE POLICY "strategy_select" ON public.strategies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.business_objectives bo
      JOIN public.products p ON p.id = bo.product_id
      JOIN public.organizations o ON o.id = p.organization_id
      WHERE bo.id = strategies.business_objective_id AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "strategy_insert" ON public.strategies
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.business_objectives bo
      JOIN public.products p ON p.id = bo.product_id
      JOIN public.organizations o ON o.id = p.organization_id
      WHERE bo.id = strategies.business_objective_id AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "strategy_update" ON public.strategies
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.business_objectives bo
      JOIN public.products p ON p.id = bo.product_id
      JOIN public.organizations o ON o.id = p.organization_id
      WHERE bo.id = strategies.business_objective_id AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "strategy_delete" ON public.strategies
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.business_objectives bo
      JOIN public.products p ON p.id = bo.product_id
      JOIN public.organizations o ON o.id = p.organization_id
      WHERE bo.id = strategies.business_objective_id AND o.user_id = auth.uid()
    )
  );

-- ============================================================
-- PRODUCT_OBJECTIVES: via strategy → biz_obj → product → org → user
-- ============================================================
CREATE POLICY "prod_obj_select" ON public.product_objectives
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.strategies s
      JOIN public.business_objectives bo ON bo.id = s.business_objective_id
      JOIN public.products p ON p.id = bo.product_id
      JOIN public.organizations o ON o.id = p.organization_id
      WHERE s.id = product_objectives.strategy_id AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "prod_obj_insert" ON public.product_objectives
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.strategies s
      JOIN public.business_objectives bo ON bo.id = s.business_objective_id
      JOIN public.products p ON p.id = bo.product_id
      JOIN public.organizations o ON o.id = p.organization_id
      WHERE s.id = product_objectives.strategy_id AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "prod_obj_update" ON public.product_objectives
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.strategies s
      JOIN public.business_objectives bo ON bo.id = s.business_objective_id
      JOIN public.products p ON p.id = bo.product_id
      JOIN public.organizations o ON o.id = p.organization_id
      WHERE s.id = product_objectives.strategy_id AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "prod_obj_delete" ON public.product_objectives
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.strategies s
      JOIN public.business_objectives bo ON bo.id = s.business_objective_id
      JOIN public.products p ON p.id = bo.product_id
      JOIN public.organizations o ON o.id = p.organization_id
      WHERE s.id = product_objectives.strategy_id AND o.user_id = auth.uid()
    )
  );

-- ============================================================
-- FEATURES: via product_objective → strategy → biz_obj → product → org → user
-- ============================================================
CREATE POLICY "feature_select" ON public.features
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.product_objectives po
      JOIN public.strategies s ON s.id = po.strategy_id
      JOIN public.business_objectives bo ON bo.id = s.business_objective_id
      JOIN public.products p ON p.id = bo.product_id
      JOIN public.organizations o ON o.id = p.organization_id
      WHERE po.id = features.product_objective_id AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "feature_insert" ON public.features
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.product_objectives po
      JOIN public.strategies s ON s.id = po.strategy_id
      JOIN public.business_objectives bo ON bo.id = s.business_objective_id
      JOIN public.products p ON p.id = bo.product_id
      JOIN public.organizations o ON o.id = p.organization_id
      WHERE po.id = features.product_objective_id AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "feature_update" ON public.features
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.product_objectives po
      JOIN public.strategies s ON s.id = po.strategy_id
      JOIN public.business_objectives bo ON bo.id = s.business_objective_id
      JOIN public.products p ON p.id = bo.product_id
      JOIN public.organizations o ON o.id = p.organization_id
      WHERE po.id = features.product_objective_id AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "feature_delete" ON public.features
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.product_objectives po
      JOIN public.strategies s ON s.id = po.strategy_id
      JOIN public.business_objectives bo ON bo.id = s.business_objective_id
      JOIN public.products p ON p.id = bo.product_id
      JOIN public.organizations o ON o.id = p.organization_id
      WHERE po.id = features.product_objective_id AND o.user_id = auth.uid()
    )
  );

-- ============================================================
-- TASKS: via feature → product_objective → ... → org → user
-- ============================================================
CREATE POLICY "task_select" ON public.tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.features f
      JOIN public.product_objectives po ON po.id = f.product_objective_id
      JOIN public.strategies s ON s.id = po.strategy_id
      JOIN public.business_objectives bo ON bo.id = s.business_objective_id
      JOIN public.products p ON p.id = bo.product_id
      JOIN public.organizations o ON o.id = p.organization_id
      WHERE f.id = tasks.feature_id AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "task_insert" ON public.tasks
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.features f
      JOIN public.product_objectives po ON po.id = f.product_objective_id
      JOIN public.strategies s ON s.id = po.strategy_id
      JOIN public.business_objectives bo ON bo.id = s.business_objective_id
      JOIN public.products p ON p.id = bo.product_id
      JOIN public.organizations o ON o.id = p.organization_id
      WHERE f.id = tasks.feature_id AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "task_update" ON public.tasks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.features f
      JOIN public.product_objectives po ON po.id = f.product_objective_id
      JOIN public.strategies s ON s.id = po.strategy_id
      JOIN public.business_objectives bo ON bo.id = s.business_objective_id
      JOIN public.products p ON p.id = bo.product_id
      JOIN public.organizations o ON o.id = p.organization_id
      WHERE f.id = tasks.feature_id AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "task_delete" ON public.tasks
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.features f
      JOIN public.product_objectives po ON po.id = f.product_objective_id
      JOIN public.strategies s ON s.id = po.strategy_id
      JOIN public.business_objectives bo ON bo.id = s.business_objective_id
      JOIN public.products p ON p.id = bo.product_id
      JOIN public.organizations o ON o.id = p.organization_id
      WHERE f.id = tasks.feature_id AND o.user_id = auth.uid()
    )
  );

-- ============================================================
-- TASK_OWNERS: via task → feature → ... → org → user
-- ============================================================
CREATE POLICY "task_owner_select" ON public.task_owners
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      JOIN public.features f ON f.id = t.feature_id
      JOIN public.product_objectives po ON po.id = f.product_objective_id
      JOIN public.strategies s ON s.id = po.strategy_id
      JOIN public.business_objectives bo ON bo.id = s.business_objective_id
      JOIN public.products p ON p.id = bo.product_id
      JOIN public.organizations o ON o.id = p.organization_id
      WHERE t.id = task_owners.task_id AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "task_owner_insert" ON public.task_owners
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tasks t
      JOIN public.features f ON f.id = t.feature_id
      JOIN public.product_objectives po ON po.id = f.product_objective_id
      JOIN public.strategies s ON s.id = po.strategy_id
      JOIN public.business_objectives bo ON bo.id = s.business_objective_id
      JOIN public.products p ON p.id = bo.product_id
      JOIN public.organizations o ON o.id = p.organization_id
      WHERE t.id = task_owners.task_id AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "task_owner_delete" ON public.task_owners
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.tasks t
      JOIN public.features f ON f.id = t.feature_id
      JOIN public.product_objectives po ON po.id = f.product_objective_id
      JOIN public.strategies s ON s.id = po.strategy_id
      JOIN public.business_objectives bo ON bo.id = s.business_objective_id
      JOIN public.products p ON p.id = bo.product_id
      JOIN public.organizations o ON o.id = p.organization_id
      WHERE t.id = task_owners.task_id AND o.user_id = auth.uid()
    )
  );

-- ============================================================
-- FEEDBACK: via product → org → user
-- ============================================================
CREATE POLICY "feedback_select" ON public.feedback
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.organizations o ON o.id = p.organization_id
      WHERE p.id = feedback.product_id AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "feedback_insert" ON public.feedback
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.organizations o ON o.id = p.organization_id
      WHERE p.id = feedback.product_id AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "feedback_update" ON public.feedback
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.organizations o ON o.id = p.organization_id
      WHERE p.id = feedback.product_id AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "feedback_delete" ON public.feedback
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.organizations o ON o.id = p.organization_id
      WHERE p.id = feedback.product_id AND o.user_id = auth.uid()
    )
  );

-- ============================================================
-- RELEASES: via product → org → user
-- ============================================================
CREATE POLICY "release_select" ON public.releases
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.organizations o ON o.id = p.organization_id
      WHERE p.id = releases.product_id AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "release_insert" ON public.releases
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.organizations o ON o.id = p.organization_id
      WHERE p.id = releases.product_id AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "release_update" ON public.releases
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.organizations o ON o.id = p.organization_id
      WHERE p.id = releases.product_id AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "release_delete" ON public.releases
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.products p
      JOIN public.organizations o ON o.id = p.organization_id
      WHERE p.id = releases.product_id AND o.user_id = auth.uid()
    )
  );

-- ============================================================
-- TEST_CASES: via feature → product_objective → ... → org → user
-- ============================================================
CREATE POLICY "test_case_select" ON public.test_cases
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.features f
      JOIN public.product_objectives po ON po.id = f.product_objective_id
      JOIN public.strategies s ON s.id = po.strategy_id
      JOIN public.business_objectives bo ON bo.id = s.business_objective_id
      JOIN public.products p ON p.id = bo.product_id
      JOIN public.organizations o ON o.id = p.organization_id
      WHERE f.id = test_cases.feature_id AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "test_case_insert" ON public.test_cases
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.features f
      JOIN public.product_objectives po ON po.id = f.product_objective_id
      JOIN public.strategies s ON s.id = po.strategy_id
      JOIN public.business_objectives bo ON bo.id = s.business_objective_id
      JOIN public.products p ON p.id = bo.product_id
      JOIN public.organizations o ON o.id = p.organization_id
      WHERE f.id = test_cases.feature_id AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "test_case_update" ON public.test_cases
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.features f
      JOIN public.product_objectives po ON po.id = f.product_objective_id
      JOIN public.strategies s ON s.id = po.strategy_id
      JOIN public.business_objectives bo ON bo.id = s.business_objective_id
      JOIN public.products p ON p.id = bo.product_id
      JOIN public.organizations o ON o.id = p.organization_id
      WHERE f.id = test_cases.feature_id AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "test_case_delete" ON public.test_cases
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.features f
      JOIN public.product_objectives po ON po.id = f.product_objective_id
      JOIN public.strategies s ON s.id = po.strategy_id
      JOIN public.business_objectives bo ON bo.id = s.business_objective_id
      JOIN public.products p ON p.id = bo.product_id
      JOIN public.organizations o ON o.id = p.organization_id
      WHERE f.id = test_cases.feature_id AND o.user_id = auth.uid()
    )
  );
