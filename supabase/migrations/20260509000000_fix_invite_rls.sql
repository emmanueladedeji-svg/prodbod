-- Allow users to update an invite if the email matches their authenticated email
CREATE POLICY "invite_update_by_email" ON public.invites
  FOR UPDATE USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Allow users to update their own pending membership record if the email matches
CREATE POLICY "member_update_own_pending" ON public.organization_members
  FOR UPDATE USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND status = 'Pending'
  );
