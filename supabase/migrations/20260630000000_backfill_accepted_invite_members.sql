-- BACKFILL: Create/update organization_members rows for accepted invites
-- Covers two gaps:
--   1. Member row was never created (invited before the member-row-creation fix)
--      → INSERT a new Active row using auth.users to resolve member_user_id
--   2. Member row exists as Pending but was never activated (update silently failed
--      because useAcceptInvite ran before this member row existed, or RLS blocked it)
--      → UPDATE to Active and set member_user_id

-- Case 1: accepted invite but NO member row at all
INSERT INTO public.organization_members (
  organization_id,
  name,
  email,
  member_user_id,
  status,
  role,
  last_active,
  invited_on
)
SELECT
  i.org_id,
  COALESCE(
    au.raw_user_meta_data->>'full_name',
    CONCAT(
      COALESCE(up.first_name, ''),
      CASE WHEN up.last_name IS NOT NULL AND up.last_name <> '' THEN ' ' || up.last_name ELSE '' END
    ),
    au.email
  ) AS name,
  i.email,
  au.id AS member_user_id,
  'Active' AS status,
  'Staff' AS role,
  NOW() AS last_active,
  i.created_at AS invited_on
FROM public.invites i
JOIN auth.users au ON au.email = i.email
LEFT JOIN public.user_profiles up ON up.id = au.id
WHERE i.accepted = true
  AND NOT EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = i.org_id AND om.email = i.email
  );

-- Case 2: member row exists but is still Pending despite the invite being accepted
UPDATE public.organization_members om
SET
  member_user_id = au.id,
  status = 'Active',
  last_active = NOW(),
  name = COALESCE(
    NULLIF(CONCAT(
      COALESCE(up.first_name, ''),
      CASE WHEN up.last_name IS NOT NULL AND up.last_name <> '' THEN ' ' || up.last_name ELSE '' END
    ), ''),
    om.name
  )
FROM public.invites i
JOIN auth.users au ON au.email = i.email
LEFT JOIN public.user_profiles up ON up.id = au.id
WHERE i.accepted = true
  AND om.organization_id = i.org_id
  AND om.email = i.email
  AND (om.status = 'Pending' OR om.member_user_id IS NULL);
