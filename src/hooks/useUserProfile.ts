import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  job_role: string | null;
  department: string | null;
  timezone: string | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface UpsertProfileData {
  first_name?: string;
  last_name?: string;
  job_role?: string;
  department?: string;
  timezone?: string;
  onboarding_completed?: boolean;
}

export function useUserProfile() {
  return useQuery({
    queryKey: ['user-profile'],
    staleTime: 0,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data as UserProfile | null;
    },
  });
}

export function useUpsertUserProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (profileData: UpsertProfileData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('user_profiles')
        .upsert({ id: user.id, ...profileData }, { onConflict: 'id' })
        .select()
        .single();
      if (error) throw error;
      return data as UserProfile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
  });
}
