import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type OrgRole = 'Owner' | 'Team Lead' | 'Staff' | null;

export function useOrgRole(orgId: string | null) {
  return useQuery({
    queryKey: ['org-role', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', orgId!)
        .eq('member_user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching org role:', error);
        return null;
      }

      return (data?.role as OrgRole) ?? null;
    },
  });
}

export function useOrgPermissions(orgId: string | null) {
  const { data: role, isLoading } = useOrgRole(orgId);

  return {
    role,
    isLoading,
    isOwner: role === 'Owner',
    isAdmin: role === 'Owner' || role === 'Team Lead',
    isMember: !!role,
  };
}
