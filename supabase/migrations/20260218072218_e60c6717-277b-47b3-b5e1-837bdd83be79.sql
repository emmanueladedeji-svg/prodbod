
-- Organizations
CREATE TABLE public.organizations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Products
CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  url text,
  description text,
  product_manager_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Teams
CREATE TABLE public.teams (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Team Members
CREATE TABLE public.team_members (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  role text DEFAULT 'member',
  avatar text
);

-- Product-Teams junction
CREATE TABLE public.product_teams (
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, team_id)
);

-- Market Models
CREATE TABLE public.market_models (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL UNIQUE REFERENCES public.products(id) ON DELETE CASCADE,
  total_addressable_market numeric NOT NULL DEFAULT 0,
  serviceable_addressable_market numeric,
  serviceable_obtainable_market numeric,
  time_horizon_years integer NOT NULL DEFAULT 3,
  currency text NOT NULL DEFAULT 'USD',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Market Segments
CREATE TABLE public.market_segments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name text NOT NULL,
  population integer NOT NULL DEFAULT 0,
  size numeric NOT NULL DEFAULT 0,
  notes text,
  assumptions text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Visions
CREATE TABLE public.visions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL UNIQUE REFERENCES public.products(id) ON DELETE CASCADE,
  statement text NOT NULL DEFAULT '',
  target_customer text NOT NULL DEFAULT '',
  core_problem text NOT NULL DEFAULT '',
  long_term_impact text NOT NULL DEFAULT '',
  differentiation text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Business Objectives
CREATE TABLE public.business_objectives (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  statement text NOT NULL,
  quarter text NOT NULL DEFAULT 'Q1',
  year integer NOT NULL DEFAULT 2024,
  target_segment_ids uuid[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Business Metrics
CREATE TABLE public.business_metrics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_objective_id uuid NOT NULL REFERENCES public.business_objectives(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'custom',
  baseline_value numeric NOT NULL DEFAULT 0,
  target_value numeric NOT NULL DEFAULT 0,
  current_value numeric,
  unit text NOT NULL DEFAULT ''
);

-- Strategies
CREATE TABLE public.strategies (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_objective_id uuid NOT NULL REFERENCES public.business_objectives(id) ON DELETE CASCADE,
  statement text NOT NULL,
  rationale text NOT NULL DEFAULT '',
  primary_metrics text[] DEFAULT '{}',
  leading_indicators text[] DEFAULT '{}',
  risk_assumptions text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Product Objectives
CREATE TABLE public.product_objectives (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  strategy_id uuid NOT NULL REFERENCES public.strategies(id) ON DELETE CASCADE,
  statement text NOT NULL,
  success_metrics text[] DEFAULT '{}',
  measurement_method text NOT NULL DEFAULT '',
  timeframe text NOT NULL DEFAULT '',
  priority text NOT NULL DEFAULT 'medium',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Features
CREATE TABLE public.features (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_objective_id uuid NOT NULL REFERENCES public.product_objectives(id) ON DELETE CASCADE,
  parent_feature_id uuid REFERENCES public.features(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'new',
  source text NOT NULL DEFAULT 'internal',
  owner_name text,
  status text NOT NULL DEFAULT 'backlog',
  priority text NOT NULL DEFAULT 'medium',
  expected_outcome text,
  success_metrics text[] DEFAULT '{}',
  due_date timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Tasks
CREATE TABLE public.tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  feature_id uuid NOT NULL REFERENCES public.features(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'todo',
  priority text NOT NULL DEFAULT 'medium',
  start_date timestamptz,
  due_date timestamptz,
  dependencies uuid[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Task Owners junction
CREATE TABLE public.task_owners (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  owner_name text NOT NULL
);

-- Feedback
CREATE TABLE public.feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  feature_ids uuid[] DEFAULT '{}',
  customer text,
  segment_id uuid,
  type text NOT NULL DEFAULT 'request',
  content text NOT NULL DEFAULT '',
  frequency_count integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Releases
CREATE TABLE public.releases (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  version text,
  release_date timestamptz NOT NULL DEFAULT now(),
  feature_ids uuid[] DEFAULT '{}',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Test Cases
CREATE TABLE public.test_cases (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  feature_id uuid NOT NULL REFERENCES public.features(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  preconditions text,
  expected_outcome text NOT NULL DEFAULT '',
  actual_outcome text,
  status text NOT NULL DEFAULT 'not_run',
  environment text NOT NULL DEFAULT 'local',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply updated_at triggers
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_market_models_updated_at BEFORE UPDATE ON public.market_models FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_market_segments_updated_at BEFORE UPDATE ON public.market_segments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_visions_updated_at BEFORE UPDATE ON public.visions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_business_objectives_updated_at BEFORE UPDATE ON public.business_objectives FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_strategies_updated_at BEFORE UPDATE ON public.strategies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_product_objectives_updated_at BEFORE UPDATE ON public.product_objectives FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_features_updated_at BEFORE UPDATE ON public.features FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_feedback_updated_at BEFORE UPDATE ON public.feedback FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_test_cases_updated_at BEFORE UPDATE ON public.test_cases FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS on all tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_cases ENABLE ROW LEVEL SECURITY;

-- Permissive RLS policies (open access for now, will lock down with auth later)
-- Organizations
CREATE POLICY "Allow all select on organizations" ON public.organizations FOR SELECT USING (true);
CREATE POLICY "Allow all insert on organizations" ON public.organizations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on organizations" ON public.organizations FOR UPDATE USING (true);
CREATE POLICY "Allow all delete on organizations" ON public.organizations FOR DELETE USING (true);

-- Products
CREATE POLICY "Allow all select on products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Allow all insert on products" ON public.products FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on products" ON public.products FOR UPDATE USING (true);
CREATE POLICY "Allow all delete on products" ON public.products FOR DELETE USING (true);

-- Teams
CREATE POLICY "Allow all select on teams" ON public.teams FOR SELECT USING (true);
CREATE POLICY "Allow all insert on teams" ON public.teams FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on teams" ON public.teams FOR UPDATE USING (true);
CREATE POLICY "Allow all delete on teams" ON public.teams FOR DELETE USING (true);

-- Team Members
CREATE POLICY "Allow all select on team_members" ON public.team_members FOR SELECT USING (true);
CREATE POLICY "Allow all insert on team_members" ON public.team_members FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on team_members" ON public.team_members FOR UPDATE USING (true);
CREATE POLICY "Allow all delete on team_members" ON public.team_members FOR DELETE USING (true);

-- Product Teams
CREATE POLICY "Allow all select on product_teams" ON public.product_teams FOR SELECT USING (true);
CREATE POLICY "Allow all insert on product_teams" ON public.product_teams FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on product_teams" ON public.product_teams FOR UPDATE USING (true);
CREATE POLICY "Allow all delete on product_teams" ON public.product_teams FOR DELETE USING (true);

-- Market Models
CREATE POLICY "Allow all select on market_models" ON public.market_models FOR SELECT USING (true);
CREATE POLICY "Allow all insert on market_models" ON public.market_models FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on market_models" ON public.market_models FOR UPDATE USING (true);
CREATE POLICY "Allow all delete on market_models" ON public.market_models FOR DELETE USING (true);

-- Market Segments
CREATE POLICY "Allow all select on market_segments" ON public.market_segments FOR SELECT USING (true);
CREATE POLICY "Allow all insert on market_segments" ON public.market_segments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on market_segments" ON public.market_segments FOR UPDATE USING (true);
CREATE POLICY "Allow all delete on market_segments" ON public.market_segments FOR DELETE USING (true);

-- Visions
CREATE POLICY "Allow all select on visions" ON public.visions FOR SELECT USING (true);
CREATE POLICY "Allow all insert on visions" ON public.visions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on visions" ON public.visions FOR UPDATE USING (true);
CREATE POLICY "Allow all delete on visions" ON public.visions FOR DELETE USING (true);

-- Business Objectives
CREATE POLICY "Allow all select on business_objectives" ON public.business_objectives FOR SELECT USING (true);
CREATE POLICY "Allow all insert on business_objectives" ON public.business_objectives FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on business_objectives" ON public.business_objectives FOR UPDATE USING (true);
CREATE POLICY "Allow all delete on business_objectives" ON public.business_objectives FOR DELETE USING (true);

-- Business Metrics
CREATE POLICY "Allow all select on business_metrics" ON public.business_metrics FOR SELECT USING (true);
CREATE POLICY "Allow all insert on business_metrics" ON public.business_metrics FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on business_metrics" ON public.business_metrics FOR UPDATE USING (true);
CREATE POLICY "Allow all delete on business_metrics" ON public.business_metrics FOR DELETE USING (true);

-- Strategies
CREATE POLICY "Allow all select on strategies" ON public.strategies FOR SELECT USING (true);
CREATE POLICY "Allow all insert on strategies" ON public.strategies FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on strategies" ON public.strategies FOR UPDATE USING (true);
CREATE POLICY "Allow all delete on strategies" ON public.strategies FOR DELETE USING (true);

-- Product Objectives
CREATE POLICY "Allow all select on product_objectives" ON public.product_objectives FOR SELECT USING (true);
CREATE POLICY "Allow all insert on product_objectives" ON public.product_objectives FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on product_objectives" ON public.product_objectives FOR UPDATE USING (true);
CREATE POLICY "Allow all delete on product_objectives" ON public.product_objectives FOR DELETE USING (true);

-- Features
CREATE POLICY "Allow all select on features" ON public.features FOR SELECT USING (true);
CREATE POLICY "Allow all insert on features" ON public.features FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on features" ON public.features FOR UPDATE USING (true);
CREATE POLICY "Allow all delete on features" ON public.features FOR DELETE USING (true);

-- Tasks
CREATE POLICY "Allow all select on tasks" ON public.tasks FOR SELECT USING (true);
CREATE POLICY "Allow all insert on tasks" ON public.tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on tasks" ON public.tasks FOR UPDATE USING (true);
CREATE POLICY "Allow all delete on tasks" ON public.tasks FOR DELETE USING (true);

-- Task Owners
CREATE POLICY "Allow all select on task_owners" ON public.task_owners FOR SELECT USING (true);
CREATE POLICY "Allow all insert on task_owners" ON public.task_owners FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on task_owners" ON public.task_owners FOR UPDATE USING (true);
CREATE POLICY "Allow all delete on task_owners" ON public.task_owners FOR DELETE USING (true);

-- Feedback
CREATE POLICY "Allow all select on feedback" ON public.feedback FOR SELECT USING (true);
CREATE POLICY "Allow all insert on feedback" ON public.feedback FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on feedback" ON public.feedback FOR UPDATE USING (true);
CREATE POLICY "Allow all delete on feedback" ON public.feedback FOR DELETE USING (true);

-- Releases
CREATE POLICY "Allow all select on releases" ON public.releases FOR SELECT USING (true);
CREATE POLICY "Allow all insert on releases" ON public.releases FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on releases" ON public.releases FOR UPDATE USING (true);
CREATE POLICY "Allow all delete on releases" ON public.releases FOR DELETE USING (true);

-- Test Cases
CREATE POLICY "Allow all select on test_cases" ON public.test_cases FOR SELECT USING (true);
CREATE POLICY "Allow all insert on test_cases" ON public.test_cases FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update on test_cases" ON public.test_cases FOR UPDATE USING (true);
CREATE POLICY "Allow all delete on test_cases" ON public.test_cases FOR DELETE USING (true);

-- Indexes for common lookups
CREATE INDEX idx_products_organization_id ON public.products(organization_id);
CREATE INDEX idx_market_segments_product_id ON public.market_segments(product_id);
CREATE INDEX idx_business_objectives_product_id ON public.business_objectives(product_id);
CREATE INDEX idx_strategies_business_objective_id ON public.strategies(business_objective_id);
CREATE INDEX idx_product_objectives_strategy_id ON public.product_objectives(strategy_id);
CREATE INDEX idx_features_product_objective_id ON public.features(product_objective_id);
CREATE INDEX idx_tasks_feature_id ON public.tasks(feature_id);
CREATE INDEX idx_feedback_product_id ON public.feedback(product_id);
CREATE INDEX idx_releases_product_id ON public.releases(product_id);
CREATE INDEX idx_test_cases_feature_id ON public.test_cases(feature_id);
CREATE INDEX idx_business_metrics_objective_id ON public.business_metrics(business_objective_id);
