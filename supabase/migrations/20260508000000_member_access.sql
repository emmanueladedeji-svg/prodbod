
-- Helper function to check if user is a member of an organization
-- Using SECURITY DEFINER to bypass RLS on the members table inside the function
CREATE OR REPLACE FUNCTION public.is_org_member(org_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = org_id 
    AND member_user_id = auth.uid()
    AND (status = 'Active' OR status = 'Pending')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Helper to check if user is OWNER of the organization
CREATE OR REPLACE FUNCTION public.is_org_owner(org_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.organizations
    WHERE id = org_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ORGS: Allow members to select
DROP POLICY IF EXISTS "org_select_member" ON public.organizations;
CREATE POLICY "org_select_member" ON public.organizations
  FOR SELECT USING (auth.uid() = user_id OR is_org_member(id));

-- PRODUCTS: Full access for members/owners
DROP POLICY IF EXISTS "product_all_member" ON public.products;
CREATE POLICY "product_all_member" ON public.products
  FOR ALL USING (is_org_owner(organization_id) OR is_org_member(organization_id));

-- TEAMS: Full access for members/owners
DROP POLICY IF EXISTS "team_all_member" ON public.teams;
CREATE POLICY "team_all_member" ON public.teams
  FOR ALL USING (is_org_owner(organization_id) OR is_org_member(organization_id));

-- TEAM_MEMBERS: Full access for members/owners
DROP POLICY IF EXISTS "team_member_all_member" ON public.team_members;
CREATE POLICY "team_member_all_member" ON public.team_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM teams t
      WHERE t.id = team_id AND (is_org_owner(t.organization_id) OR is_org_member(t.organization_id))
    )
  );

-- INVITES
DROP POLICY IF EXISTS "member_manage_invites" ON public.invites;
CREATE POLICY "member_manage_invites" ON public.invites
  FOR ALL USING (is_org_owner(org_id) OR is_org_member(org_id));

-- ORG MEMBERS: Non-recursive policies
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "member_select_self" ON public.organization_members;
DROP POLICY IF EXISTS "member_select_org" ON public.organization_members;
DROP POLICY IF EXISTS "member_insert_org" ON public.organization_members;
DROP POLICY IF EXISTS "member_all_access" ON public.organization_members;

-- Owners can do anything
CREATE POLICY "owner_manage_members" ON public.organization_members
  FOR ALL USING (is_org_owner(organization_id));

-- Members can see each other
CREATE POLICY "member_select_all" ON public.organization_members
  FOR SELECT USING (is_org_member(organization_id));

-- Allow users to see their own records (base case)
CREATE POLICY "user_select_own_membership" ON public.organization_members
  FOR SELECT USING (auth.uid() = member_user_id OR email = (SELECT email FROM auth.users WHERE id = auth.uid()));
