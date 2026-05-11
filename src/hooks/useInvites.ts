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

export type InviteStatus = 'valid' | 'expired' | 'already_accepted' | 'not_found';

export interface InviteResult {
  invite: Invite | null;
  status: InviteStatus;
}

export function useGetInviteByToken(token: string | null) {
  return useQuery({
    queryKey: ['invite', token],
    enabled: !!token,
    staleTime: 0,
    queryFn: async (): Promise<InviteResult> => {
      const { data, error } = await supabase
        .from('invites')
        .select('*')
        .eq('token', token!)
        .maybeSingle();

      if (error) throw error;
      if (!data) return { invite: null, status: 'not_found' };
      if (data.accepted) return { invite: data as Invite, status: 'already_accepted' };
      
      const expiry = new Date(data.expires_at).getTime();
      const now = new Date().getTime();
      
      if (expiry < now) return { invite: data as Invite, status: 'expired' };
      return { invite: data as Invite, status: 'valid' };
    },
  });
}
