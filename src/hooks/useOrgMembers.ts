import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';

export interface OrgMember {
  userId: string;       // member_user_id (auth.users id)
  memberId: string;     // organization_members.id (row id)
  displayName: string;
  initials: string;
  email: string;
  role: string;
  department: string | null;
  avatarColor: string;
}

const AVATAR_COLORS = [
  '#D97706', '#8B5CF6', '#10B981', '#EC4899',
  '#3B82F6', '#EF4444', '#F59E0B', '#6366F1',
];

export function getAvatarColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('');
}

export function useOrgMembers() {
  const { currentOrgId } = useApp();

  return useQuery({
    queryKey: ['org-members-active', currentOrgId],
    enabled: !!currentOrgId,
    // Cache for 5 minutes — org membership doesn't change mid-session
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<OrgMember[]> => {
      if (!currentOrgId) return [];

      // Fetch Active members only (as required — no Pending)
      const { data: members, error } = await supabase
        .from('organization_members')
        .select('id, member_user_id, name, email, role, department, status')
        .eq('organization_id', currentOrgId)
        .eq('status', 'Active')
        .not('member_user_id', 'is', null)
        .order('name', { ascending: true });

      if (error) throw error;
      if (!members?.length) return [];

      const userIds = (members as any[])
        .map((m) => m.member_user_id)
        .filter(Boolean);

      // Enrich with profile names where available
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, first_name, last_name')
        .in('id', userIds);

      const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

      return (members as any[]).map((m): OrgMember => {
        const profile = profileMap.get(m.member_user_id);

        let displayName = m.name || '';
        if (profile) {
          const fromProfile = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
          if (fromProfile) displayName = fromProfile;
        }
        if (!displayName && m.email) displayName = m.email.split('@')[0];
        if (!displayName) displayName = m.member_user_id.slice(0, 8);

        return {
          userId: m.member_user_id,
          memberId: m.id,
          displayName,
          initials: getInitials(displayName),
          email: m.email || '',
          role: m.role || '',
          department: m.department || null,
          avatarColor: getAvatarColor(m.member_user_id),
        };
      });
    },
  });
}
