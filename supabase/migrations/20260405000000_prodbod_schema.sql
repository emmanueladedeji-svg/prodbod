-- ProdBod schema additions

-- User profiles (extends auth.users with onboarding data)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  last_name TEXT,
  job_role TEXT,
  department TEXT,
  timezone TEXT,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Extend organizations with ProdBod fields
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS established_date TEXT;

-- Add auth user reference to org members (links accepted invites to auth users)
ALTER TABLE organization_members ADD COLUMN IF NOT EXISTS member_user_id UUID REFERENCES auth.users(id);

-- Token-based invite links
CREATE TABLE IF NOT EXISTS invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  email TEXT NOT NULL,
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  invited_by UUID REFERENCES auth.users(id),
  accepted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

-- RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_profile" ON user_profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "invites_readable_by_all" ON invites
  FOR SELECT USING (true);

CREATE POLICY "org_owner_manage_invites" ON invites
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM organizations WHERE id = org_id AND user_id = auth.uid())
  );

CREATE POLICY "invites_update_on_accept" ON invites
  FOR UPDATE USING (true);

-- auto updated_at for user_profiles
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
