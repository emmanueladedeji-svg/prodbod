-- SYNC PRODUCTION FIXES (Applied 2026-05-10)

-- 1. FIX PRODUCT VISIBILITY RLS
DROP POLICY IF EXISTS "product_select" ON public.products;
CREATE POLICY "product_select" ON public.products
  FOR SELECT USING (is_org_member(organization_id));

DROP POLICY IF EXISTS "product_insert" ON public.products;
CREATE POLICY "product_insert" ON public.products
  FOR INSERT WITH CHECK (is_org_member(organization_id));

DROP POLICY IF EXISTS "product_update" ON public.products;
CREATE POLICY "product_update" ON public.products
  FOR UPDATE USING (is_org_admin(organization_id));

DROP POLICY IF EXISTS "product_delete" ON public.products;
CREATE POLICY "product_delete" ON public.products
  FOR DELETE USING (is_org_admin(organization_id));


-- 2. FIX INVITE ACCEPTANCE RLS
DROP POLICY IF EXISTS "member_update_own_pending" ON public.organization_members;
CREATE POLICY "member_update_own_pending" ON public.organization_members
  FOR UPDATE 
  USING (
    email = (auth.jwt() ->> 'email') 
    AND status = 'Pending'
  )
  WITH CHECK (
    email = (auth.jwt() ->> 'email')
  );


-- 3. ENSURE INVITE READABILITY
DROP POLICY IF EXISTS "invites_readable_by_invited" ON public.invites;
CREATE POLICY "invites_readable_by_invited" ON public.invites
  FOR SELECT USING (
    (email = (auth.jwt() ->> 'email')) 
    OR is_org_member(org_id)
  );
