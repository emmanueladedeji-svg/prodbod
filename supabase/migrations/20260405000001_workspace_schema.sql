-- Workspace schema: lists, workspace_features, enums, and slug column

-- Add slug to organizations if not present
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS slug TEXT;

-- Add org_id column to products for workspace system
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Backfill org_id from organization_id
UPDATE public.products SET org_id = organization_id WHERE org_id IS NULL;

-- Item level enum
DO $$ BEGIN
  CREATE TYPE item_level AS ENUM ('feature', 'sub_feature', 'task');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Item status enum
DO $$ BEGIN
  CREATE TYPE item_status AS ENUM (
    'idea_or_problem',
    'discovery',
    'prototyping',
    'in_development',
    'in_testing',
    'live'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Item priority enum
DO $$ BEGIN
  CREATE TYPE item_priority AS ENUM ('none', 'low', 'medium', 'high', 'urgent');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Lists table (product has many lists)
CREATE TABLE IF NOT EXISTS public.lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Workspace features table (separate from legacy features table)
CREATE TABLE IF NOT EXISTS public.workspace_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES public.lists(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.workspace_features(id) ON DELETE CASCADE,
  level item_level NOT NULL DEFAULT 'feature',
  title TEXT NOT NULL,
  description TEXT,
  status item_status NOT NULL DEFAULT 'idea_or_problem',
  priority item_priority NOT NULL DEFAULT 'none',
  assignee_id UUID REFERENCES auth.users(id),
  due_date DATE,
  position INTEGER NOT NULL DEFAULT 0,
  is_collapsed BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_features ENABLE ROW LEVEL SECURITY;

-- Permissive RLS policies for lists
DO $$ BEGIN
  CREATE POLICY "Allow all select on lists" ON public.lists FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Allow all insert on lists" ON public.lists FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Allow all update on lists" ON public.lists FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Allow all delete on lists" ON public.lists FOR DELETE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Permissive RLS policies for workspace_features
DO $$ BEGIN
  CREATE POLICY "Allow all select on workspace_features" ON public.workspace_features FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Allow all insert on workspace_features" ON public.workspace_features FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Allow all update on workspace_features" ON public.workspace_features FOR UPDATE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE POLICY "Allow all delete on workspace_features" ON public.workspace_features FOR DELETE USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Updated_at triggers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_lists_updated_at'
  ) THEN
    CREATE TRIGGER update_lists_updated_at
      BEFORE UPDATE ON public.lists
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_workspace_features_updated_at'
  ) THEN
    CREATE TRIGGER update_workspace_features_updated_at
      BEFORE UPDATE ON public.workspace_features
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_lists_product_id ON public.lists(product_id);
CREATE INDEX IF NOT EXISTS idx_workspace_features_list_id ON public.workspace_features(list_id);
CREATE INDEX IF NOT EXISTS idx_workspace_features_product_id ON public.workspace_features(product_id);
CREATE INDEX IF NOT EXISTS idx_workspace_features_parent_id ON public.workspace_features(parent_id);
CREATE INDEX IF NOT EXISTS idx_workspace_features_status ON public.workspace_features(status);

-- Function to auto-create Backlog list when a product is created
CREATE OR REPLACE FUNCTION public.create_default_backlog_list()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.lists (product_id, org_id, name, is_default, position)
  VALUES (NEW.id, COALESCE(NEW.org_id, NEW.organization_id), 'Backlog', TRUE, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger to auto-create Backlog on product insert
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'create_backlog_on_product_insert'
  ) THEN
    CREATE TRIGGER create_backlog_on_product_insert
      AFTER INSERT ON public.products
      FOR EACH ROW EXECUTE FUNCTION public.create_default_backlog_list();
  END IF;
END $$;

-- Create Backlog lists for existing products that don't have one
INSERT INTO public.lists (product_id, org_id, name, is_default, position)
SELECT p.id, COALESCE(p.org_id, p.organization_id), 'Backlog', TRUE, 0
FROM public.products p
WHERE NOT EXISTS (
  SELECT 1 FROM public.lists l WHERE l.product_id = p.id AND l.is_default = TRUE
);
