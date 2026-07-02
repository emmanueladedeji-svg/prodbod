import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ActivityRecord {
  id: string;
  featureId: string;
  userId: string;
  userDisplayName: string;
  userInitials: string;
  type:
    | 'comment'
    | 'status_change'
    | 'assignee_change'
    | 'field_change'
    | 'created'
    | 'sub_feature_added'
    | 'task_added'
    | 'feedback_linked';
  body?: string | null;
  fieldName?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  mentionedUserIds?: string[] | null;
  createdAt: string;
  isDeleted: boolean;
}

function buildDisplayName(email: string, meta: Record<string, unknown> | null): string {
  if (meta) {
    const full = (meta['full_name'] as string) || '';
    const first = (meta['first_name'] as string) || '';
    const last = (meta['last_name'] as string) || '';
    const name = full || `${first} ${last}`.trim();
    if (name) return name;
  }
  return email.split('@')[0];
}

function buildInitials(displayName: string): string {
  return displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('');
}

export function useFeatureActivity(featureId: string | null) {
  const queryClient = useQueryClient();
  const queryKey = ['feature-activity', featureId];

  const query = useQuery({
    queryKey,
    enabled: !!featureId,
    queryFn: async (): Promise<ActivityRecord[]> => {
      if (!featureId) return [];

      const { data, error } = await supabase
        .from('feature_activity' as any)
        .select('*')
        .eq('feature_id', featureId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true })
        .limit(200);

      if (error) throw error;

      const rows = (data || []) as any[];

      // Batch-fetch user metadata for all unique user_ids
      const userIds = [...new Set(rows.map((r) => r.user_id).filter(Boolean))] as string[];
      const userMap = new Map<string, { email: string; meta: Record<string, unknown> | null }>();

      if (userIds.length > 0) {
        // user_profiles table stores first_name/last_name
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('id, first_name, last_name')
          .in('id', userIds);

        (profiles || []).forEach((p: any) => {
          userMap.set(p.id, {
            email: '',
            meta: { first_name: p.first_name, last_name: p.last_name },
          });
        });

        // Also fetch emails from organization_members for those not in profiles
        const { data: members } = await supabase
          .from('organization_members')
          .select('member_user_id, name, email')
          .in('member_user_id', userIds);

        (members || []).forEach((m: any) => {
          if (!userMap.has(m.member_user_id)) {
            userMap.set(m.member_user_id, { email: m.email || '', meta: { full_name: m.name } });
          } else {
            const existing = userMap.get(m.member_user_id)!;
            if (!existing.email) existing.email = m.email || '';
          }
        });
      }

      return rows.map((r): ActivityRecord => {
        const userInfo = userMap.get(r.user_id);
        const displayName = userInfo
          ? buildDisplayName(userInfo.email, userInfo.meta)
          : r.user_id?.slice(0, 8) ?? 'Unknown';

        return {
          id: r.id,
          featureId: r.feature_id,
          userId: r.user_id,
          userDisplayName: displayName,
          userInitials: buildInitials(displayName),
          type: r.type,
          body: r.body,
          fieldName: r.field_name,
          oldValue: r.old_value,
          newValue: r.new_value,
          mentionedUserIds: r.mentioned_user_ids,
          createdAt: r.created_at,
          isDeleted: r.is_deleted,
        };
      });
    },
  });

  // Realtime subscription — appends new rows without a full refetch
  useEffect(() => {
    if (!featureId) return;

    const channel = supabase
      .channel(`feature-activity-${featureId}`)
      .on(
        'postgres_changes' as any,
        {
          event: 'INSERT',
          schema: 'public',
          table: 'feature_activity',
          filter: `feature_id=eq.${featureId}`,
        },
        () => {
          // Invalidate so the query refetches and enriches with display names
          queryClient.invalidateQueries({ queryKey });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [featureId]);

  return query;
}
