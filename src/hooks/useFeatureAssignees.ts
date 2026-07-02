import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface FeatureAssignee {
  userId: string;
  displayName: string;
  initials: string;
  email: string;
  assignedAt: string;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('');
}

export function useFeatureAssignees(featureId: string | null) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const queryKey = ['feature-assignees', featureId];

  const query = useQuery({
    queryKey,
    enabled: !!featureId,
    queryFn: async (): Promise<FeatureAssignee[]> => {
      if (!featureId) return [];

      const { data, error } = await supabase
        .from('feature_assignees' as any)
        .select('user_id, assigned_at')
        .eq('feature_id', featureId)
        .order('assigned_at', { ascending: true });

      if (error) throw error;
      if (!data?.length) return [];

      const userIds = (data as any[]).map((r) => r.user_id);

      // Resolve display names from user_profiles + org members
      const [{ data: profiles }, { data: members }] = await Promise.all([
        supabase
          .from('user_profiles')
          .select('id, first_name, last_name')
          .in('id', userIds),
        supabase
          .from('organization_members')
          .select('member_user_id, name, email')
          .in('member_user_id', userIds),
      ]);

      const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
      const memberMap = new Map((members || []).map((m: any) => [m.member_user_id, m]));

      return (data as any[]).map((r): FeatureAssignee => {
        const profile = profileMap.get(r.user_id);
        const member = memberMap.get(r.user_id);

        let displayName = '';
        if (profile) {
          displayName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
        }
        if (!displayName && member?.name) displayName = member.name;
        if (!displayName && member?.email) displayName = member.email.split('@')[0];
        if (!displayName) displayName = r.user_id.slice(0, 8);

        return {
          userId: r.user_id,
          displayName,
          initials: getInitials(displayName),
          email: member?.email || '',
          assignedAt: r.assigned_at,
        };
      });
    },
  });

  const addMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('feature_assignees' as any)
        .insert({ feature_id: featureId!, user_id: userId, assigned_by: user.id });

      if (error) throw error;

      // Write activity record
      await supabase
        .from('feature_activity' as any)
        .insert({
          feature_id: featureId!,
          user_id: user.id,
          type: 'assignee_change',
          field_name: 'assignee',
          new_value: userId,
        });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['feature-activity', featureId] });
    },
    onError: (err: Error) => {
      toast({ title: 'Could not add assignee', description: err.message, variant: 'destructive' });
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('feature_assignees' as any)
        .delete()
        .eq('feature_id', featureId!)
        .eq('user_id', userId);

      if (error) throw error;

      await supabase
        .from('feature_activity' as any)
        .insert({
          feature_id: featureId!,
          user_id: user.id,
          type: 'assignee_change',
          field_name: 'assignee',
          old_value: userId,
        });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['feature-activity', featureId] });
    },
    onError: (err: Error) => {
      toast({ title: 'Could not remove assignee', description: err.message, variant: 'destructive' });
    },
  });

  return {
    assignees: query.data ?? [],
    isLoading: query.isLoading,
    addAssignee: addMutation.mutateAsync,
    removeAssignee: removeMutation.mutateAsync,
    isUpdating: addMutation.isPending || removeMutation.isPending,
  };
}
