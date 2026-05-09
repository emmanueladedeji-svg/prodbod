
-- 1. Fix "permission denied for table users" by replacing auth.users subqueries with auth.jwt()
-- 2. Clean up duplicate or insecure policies on invites and organization_members

-- Fix invites update policy
DROP POLICY IF EXISTS "invite_update_by_email" ON public.invites;
CREATE POLICY "invite_update_by_email" ON public.invites
  FOR UPDATE USING (
    email = (auth.jwt() ->> 'email')
  );

-- Fix organization_members update policy
DROP POLICY IF EXISTS "member_update_own_pending" ON public.organization_members;
CREATE POLICY "member_update_own_pending" ON public.organization_members
  FOR UPDATE USING (
    email = (auth.jwt() ->> 'email')
    AND status = 'Pending'
  );

-- Ensure invites are readable by the person invited (based on email)
DROP POLICY IF EXISTS "invites_readable_by_invited" ON public.invites;
CREATE POLICY "invites_readable_by_invited" ON public.invites
  FOR SELECT USING (
    email = (auth.jwt() ->> 'email')
    OR is_org_member(org_id)
  );

-- Remove the overly broad policy if it exists
DROP POLICY IF EXISTS "invites_readable_by_all" ON public.invites;
DROP POLICY IF EXISTS "invites_update_on_accept" ON public.invites;
