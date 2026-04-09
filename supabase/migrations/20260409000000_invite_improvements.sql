-- Invite policy improvements
-- Replace org-owner-only INSERT policy with a policy that allows any Active member to invite

DROP POLICY IF EXISTS "org_owner_manage_invites" ON invites;

CREATE POLICY "org_members_create_invites" ON invites
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = invites.org_id
        AND member_user_id = auth.uid()
        AND status = 'Active'
    )
  );
