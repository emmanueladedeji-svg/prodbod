import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Invite {
  id: string;
  token: string;
  email: string;
  org_id: string;
  invited_by: string | null;
  accepted: boolean;
  created_at: string;
  expires_at: string;
}

export function useGetInviteByToken(token: string | null) {
  return useQuery({
    queryKey: ['invite', token],
    enabled: !!token,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invites')
        .select('*')
        .eq('token', token!)
        .maybeSingle();
      if (error) throw error;
      return data as Invite | null;
    },
  });
}
