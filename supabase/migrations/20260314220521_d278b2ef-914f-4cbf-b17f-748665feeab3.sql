CREATE TABLE public.organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text,
  role text NOT NULL DEFAULT 'Staff',
  department text,
  status text NOT NULL DEFAULT 'Pending',
  invited_by text,
  invited_on timestamp with time zone DEFAULT now(),
  last_active timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(organization_id, email)
);

ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_member_select" ON public.organization_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM organizations o
      WHERE o.id = organization_members.organization_id
        AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "org_member_insert" ON public.organization_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM organizations o
      WHERE o.id = organization_members.organization_id
        AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "org_member_update" ON public.organization_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM organizations o
      WHERE o.id = organization_members.organization_id
        AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "org_member_delete" ON public.organization_members
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM organizations o
      WHERE o.id = organization_members.organization_id
        AND o.user_id = auth.uid()
    )
  );