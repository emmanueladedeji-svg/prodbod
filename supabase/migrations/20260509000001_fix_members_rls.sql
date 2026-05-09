
-- 1. Fix the permission denied error by using auth.jwt() instead of querying auth.users
-- 2. Optimize helper functions to handle email matching more safely
-- 3. Ensure recursion is broken by using SECURITY DEFINER correctly

-- Update is_org_member to use JWT email fallback safely
CREATE OR REPLACE FUNCTION public.is_org_member(org_id uuid)
RETURNS boolean AS $$
DECLARE
  _email text;
BEGIN
  _email := auth.jwt() ->> 'email';
  
  RETURN EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = org_id 
    AND (
      member_user_id = auth.uid() 
      OR 
      (email = _email AND _email IS NOT NULL)
    )
    AND (status = 'Active' OR status = 'Pending')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update organization_members policies
DROP POLICY IF EXISTS "user_select_own_membership" ON public.organization_members;
CREATE POLICY "user_select_own_membership" ON public.organization_members
  FOR SELECT USING (
    auth.uid() = member_user_id 
    OR 
    (email = auth.jwt() ->> 'email' AND (auth.jwt() ->> 'email') IS NOT NULL)
  );

-- Ensure the owner has explicit access to organizations without recursion
DROP POLICY IF EXISTS "org_select_member" ON public.organizations;
CREATE POLICY "org_select_member" ON public.organizations
  FOR SELECT USING (
    auth.uid() = user_id 
    OR 
    is_org_member(id)
  );
