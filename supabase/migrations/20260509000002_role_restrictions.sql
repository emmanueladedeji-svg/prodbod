
-- Helper to check if user is an Admin or Owner
CREATE OR REPLACE FUNCTION public.is_org_admin(org_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = org_id 
    AND member_user_id = auth.uid()
    AND role IN ('Owner', 'Team Lead')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update organization_members policies to restrict management to Admins/Owners
DROP POLICY IF EXISTS "owner_manage_members" ON public.organization_members;
CREATE POLICY "admin_manage_members" ON public.organization_members
  FOR ALL USING (is_org_admin(organization_id));

-- Ensure members can still see each other
DROP POLICY IF EXISTS "member_select_all" ON public.organization_members;
CREATE POLICY "member_select_all" ON public.organization_members
  FOR SELECT USING (is_org_member(organization_id));
