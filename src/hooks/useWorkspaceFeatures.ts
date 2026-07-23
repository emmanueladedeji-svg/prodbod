import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { StatusKey, ItemLevel, ItemPriority } from '@/constants/statuses';
import { useEffect } from 'react';

export interface Feature {
  id: string;
  list_id: string;
  product_id: string;
  org_id: string;
  parent_id: string | null;
  level: ItemLevel;
  title: string;
  description: string | null;
  status: StatusKey;
  status_id: string | null;
  priority: ItemPriority;
  assignee_id: string | null;
  due_date: string | null;
  position: number;
  is_collapsed: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  progress?: number;
  is_blocked?: boolean;
  blocked_reason?: string | null;
  in_progress_since?: string | null;
  phase_entered_at?: string | null;
  sprint_id?: string | null;
  start_date?: string | null;
  story_points?: number;
  time_estimate?: number;
  product_line_id?: string | null;
  product_statuses?: {
    name: string;
    color: string;
    category: string;
  } | null;
}

export function useWorkspaceFeatures(listId: string | null) {
  const queryClient = useQueryClient();

  // Real-time subscription
  useEffect(() => {
    if (!listId) return;
    const channel = supabase
      .channel(`list-${listId}`)
      .on('postgres_changes' as any, {
        event: '*',
        schema: 'public',
        table: 'workspace_features',
        filter: `list_id=eq.${listId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['workspace-features', listId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [listId, queryClient]);

  return useQuery({
    queryKey: ['workspace-features', listId],
    enabled: !!listId,
    queryFn: async () => {
      try {
        const { data, error } = await (supabase as any)
          .from('workspace_features')
          .select(`
            *,
            product_statuses!workspace_features_status_id_fkey (
              name,
              color,
              category
            )
          `)
          .eq('list_id', listId!)
          .order('position', { ascending: true });

        if (error) {
          // Fallback if relationship name is different
          const { data: fallbackData } = await (supabase as any)
            .from('workspace_features')
            .select('*, product_statuses(name, color, category)')
            .eq('list_id', listId!)
            .order('position', { ascending: true });
          return (fallbackData || []) as Feature[];
        }
        return (data || []) as Feature[];
      } catch (err) {
        console.error('Error in useWorkspaceFeatures:', err);
        return [];
      }
    },
  });
}

export function useCreateWorkspaceFeature() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      title: string;
      listId: string;
      productId: string;
      orgId: string;
      parentId?: string | null;
      level: ItemLevel;
      status?: StatusKey;
      statusId?: string;
      position?: number;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await (supabase as any)
        .from('workspace_features')
        .insert({
          title: vars.title,
          list_id: vars.listId,
          product_id: vars.productId,
          org_id: vars.orgId,
          parent_id: vars.parentId ?? null,
          level: vars.level,
          status: vars.status ?? 'idea_or_problem',
          status_id: vars.statusId ?? null,
          position: vars.position ?? 0,
          created_by: user?.id ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data as Feature;
    },
    onSuccess: (data: Feature) => {
      queryClient.invalidateQueries({ queryKey: ['workspace-features', data.list_id] });
    },
  });
}

export function useUpdateWorkspaceFeature() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Feature> & { id: string }) => {
      const { data, error } = await (supabase as any)
        .from('workspace_features')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as Feature;
    },
    onSuccess: (data: Feature) => {
      queryClient.invalidateQueries({ queryKey: ['workspace-features', data.list_id] });
    },
  });
}

export function useDeleteWorkspaceFeature() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, listId }: { id: string; listId: string }) => {
      const { error } = await (supabase as any).from('workspace_features').delete().eq('id', id);
      if (error) throw error;
      return listId;
    },
    onSuccess: (listId: string) => {
      queryClient.invalidateQueries({ queryKey: ['workspace-features', listId] });
    },
  });
}

export function useUpdateFeatureStatusId() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, statusId, listId }: { id: string; statusId: string; listId: string }) => {
      const { data, error } = await (supabase as any)
        .from('workspace_features')
        .update({ status_id: statusId })
        .eq('id', id)
        .select().single();
      if (error) throw error;
      return data as Feature;
    },
    onSuccess: (data: Feature) => {
      queryClient.invalidateQueries({ queryKey: ['workspace-features', data.list_id] });
    },
  });
}
