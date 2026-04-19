-- ─── STATUS CATEGORY ENUM ────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE status_category AS ENUM ('not_started', 'active', 'done', 'closed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── PRODUCT STATUSES TABLE ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.product_statuses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  org_id        UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  color         TEXT NOT NULL DEFAULT '#8b5cf6',
  category      status_category NOT NULL DEFAULT 'not_started',
  position      INTEGER NOT NULL DEFAULT 0,
  is_default    BOOLEAN NOT NULL DEFAULT FALSE,
  is_closed     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_statuses_product_id ON public.product_statuses(product_id);

-- ─── STATUS TEMPLATES TABLE ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.status_templates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by    UUID REFERENCES auth.users(id),
  name          TEXT NOT NULL,
  statuses      JSONB NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.product_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.status_templates ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN CREATE POLICY "ps_select" ON public.product_statuses FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "ps_insert" ON public.product_statuses FOR INSERT WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "ps_update" ON public.product_statuses FOR UPDATE USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "ps_delete" ON public.product_statuses FOR DELETE USING (is_closed = false); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE POLICY "st_select" ON public.status_templates FOR SELECT USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "st_insert" ON public.status_templates FOR INSERT WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "st_delete" ON public.status_templates FOR DELETE USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ─── TRIGGERS ────────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_product_statuses_updated_at') THEN
    CREATE TRIGGER update_product_statuses_updated_at
      BEFORE UPDATE ON public.product_statuses
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- ─── PRODUCT COLUMNS ─────────────────────────────────────────────────────────
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS icon_color TEXT DEFAULT '#7c5cfc';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS icon_letter TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS description_text TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS default_views TEXT[] DEFAULT ARRAY['list','board'];
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS progress_icons_enabled BOOLEAN DEFAULT FALSE;

-- ─── ADD status_id TO WORKSPACE FEATURES ─────────────────────────────────────
ALTER TABLE public.workspace_features ADD COLUMN IF NOT EXISTS status_id UUID REFERENCES public.product_statuses(id) ON DELETE SET NULL;

-- ─── FUNCTION: create default statuses for a product ─────────────────────────
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
    (NEW.id, v_org_id, 'Live',            '#16a34a', 'done',        0, FALSE, FALSE),
    (NEW.id, v_org_id, 'Closed',          '#0f766e', 'closed',      0, FALSE, TRUE);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Drop existing trigger if present so we can replace it
DROP TRIGGER IF EXISTS create_default_statuses_on_product_insert ON public.products;
CREATE TRIGGER create_default_statuses_on_product_insert
  AFTER INSERT ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.create_default_product_statuses();

-- ─── BACKFILL: create statuses for existing products ─────────────────────────
DO $$
DECLARE p record;
DECLARE v_org_id UUID;
BEGIN
  FOR p IN SELECT pr.* FROM public.products pr WHERE NOT EXISTS (
    SELECT 1 FROM public.product_statuses WHERE product_id = pr.id
  ) LOOP
    v_org_id := COALESCE(p.org_id, p.organization_id);
    INSERT INTO public.product_statuses (product_id, org_id, name, color, category, position, is_default, is_closed) VALUES
      (p.id, v_org_id, 'Idea or Problem', '#8b5cf6', 'not_started', 0, TRUE,  FALSE),
      (p.id, v_org_id, 'Discovery',       '#0891b2', 'active',      0, FALSE, FALSE),
      (p.id, v_org_id, 'Prototyping',     '#d97706', 'active',      1, FALSE, FALSE),
      (p.id, v_org_id, 'In Development',  '#2563eb', 'active',      2, FALSE, FALSE),
      (p.id, v_org_id, 'In Testing',      '#dc2626', 'active',      3, FALSE, FALSE),
      (p.id, v_org_id, 'Live',            '#16a34a', 'done',        0, FALSE, FALSE),
      (p.id, v_org_id, 'Closed',          '#0f766e', 'closed',      0, FALSE, TRUE);
  END LOOP;
END $$;

-- ─── BACKFILL: set status_id on existing workspace_features ──────────────────
DO $$
DECLARE f record;
DECLARE s_id UUID;
DECLARE s_name TEXT;
BEGIN
  FOR f IN SELECT * FROM public.workspace_features WHERE status_id IS NULL LOOP
    s_name := CASE f.status::text
      WHEN 'idea_or_problem' THEN 'Idea or Problem'
      WHEN 'discovery'       THEN 'Discovery'
      WHEN 'prototyping'     THEN 'Prototyping'
      WHEN 'in_development'  THEN 'In Development'
      WHEN 'in_testing'      THEN 'In Testing'
      WHEN 'live'            THEN 'Live'
      ELSE 'Idea or Problem'
    END;
    SELECT id INTO s_id FROM public.product_statuses
      WHERE product_id = f.product_id AND name = s_name LIMIT 1;
    IF s_id IS NOT NULL THEN
      UPDATE public.workspace_features SET status_id = s_id WHERE id = f.id;
    END IF;
  END LOOP;
END $$;
