import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Objective {
  id: string;
  org_id: string;
  name: string;
  description: string;
  owner_id: string | null;
  target_date: string | null;
  status: 'on_track' | 'at_risk' | 'off_track' | 'achieved';
  created_at: string;
  updated_at: string;
  // Computed values
  mapped_feature_ids: string[];
  progress: number; // calculated as (Live Features / Mapped Features) * 100
}

export function useWorkspaceObjectives(orgId: string | null) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: objectives = [], isLoading } = useQuery({
    queryKey: ['workspace-objectives', orgId],
    queryFn: async () => {
      if (!orgId) return [];

      // 1. Fetch all objectives for the organization
      const { data: objs, error: objsErr } = await (supabase as any)
        .from('objectives')
        .select('*')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false });

      if (objsErr) throw objsErr;

      const results: Objective[] = [];

      for (const obj of (objs || [])) {
        // 2. Fetch linked feature IDs
        const { data: mappings, error: mapErr } = await (supabase as any)
          .from('objective_features')
          .select('feature_id')
          .eq('objective_id', obj.id);

        if (mapErr) continue;

        const mappedFeatureIds = (mappings || []).map((m: any) => m.feature_id);
        let progress = 0;

        if (mappedFeatureIds.length > 0) {
          // 3. Fetch linked features and their status category or name
          const { data: feats, error: featsErr } = await (supabase as any)
            .from('workspace_features')
            .select(`
              id,
              status,
              status_id,
              product_statuses (
                name,
                category
              )
            `)
            .in('id', mappedFeatureIds);

          if (!featsErr && feats) {
            // Live features: status is 'live' or status category is 'done' (where name is Live)
            const liveFeatures = feats.filter((f: any) => {
              const statusName = f.product_statuses?.name?.toLowerCase() || f.status?.toLowerCase() || '';
              return statusName === 'live';
            });
            progress = Math.round((liveFeatures.length / feats.length) * 100);
          }
        }

        results.push({
          ...obj,
          mapped_feature_ids: mappedFeatureIds,
          progress,
        });
      }

      return results;
    },
    enabled: !!orgId,
  });

  const createMutation = useMutation({
    mutationFn: async (vars: { name: string; description?: string; owner_id?: string | null; target_date?: string | null; status?: Objective['status'] }) => {
      if (!orgId) throw new Error('No organization selected');
      const { data, error } = await (supabase as any)
        .from('objectives')
        .insert({
          org_id: orgId,
          name: vars.name,
          description: vars.description || '',
          owner_id: vars.owner_id || null,
          target_date: vars.target_date || null,
          status: vars.status || 'on_track',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-objectives', orgId] });
      toast({ title: 'Objective created' });
    },
    onError: (err: Error) => {
      toast({ title: 'Error creating objective', description: err.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (vars: { id: string; name?: string; description?: string; owner_id?: string | null; target_date?: string | null; status?: Objective['status'] }) => {
      const { data, error } = await (supabase as any)
        .from('objectives')
        .update({
          ...(vars.name !== undefined ? { name: vars.name } : {}),
          ...(vars.description !== undefined ? { description: vars.description } : {}),
          ...(vars.owner_id !== undefined ? { owner_id: vars.owner_id } : {}),
          ...(vars.target_date !== undefined ? { target_date: vars.target_date } : {}),
          ...(vars.status !== undefined ? { status: vars.status } : {}),
          updated_at: new Date().toISOString(),
        })
        .eq('id', vars.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-objectives', orgId] });
      toast({ title: 'Objective updated' });
    },
    onError: (err: Error) => {
      toast({ title: 'Error updating objective', description: err.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('objectives')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-objectives', orgId] });
      toast({ title: 'Objective deleted' });
    },
    onError: (err: Error) => {
      toast({ title: 'Error deleting objective', description: err.message, variant: 'destructive' });
    },
  });

  const linkFeature = useMutation({
    mutationFn: async (vars: { objectiveId: string; featureId: string }) => {
      const { error } = await (supabase as any)
        .from('objective_features')
        .insert({ objective_id: vars.objectiveId, feature_id: vars.featureId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-objectives', orgId] });
    },
  });

  const unlinkFeature = useMutation({
    mutationFn: async (vars: { objectiveId: string; featureId: string }) => {
      const { error } = await (supabase as any)
        .from('objective_features')
        .delete()
        .eq('objective_id', vars.objectiveId)
        .eq('feature_id', vars.featureId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace-objectives', orgId] });
    },
  });

  return {
    objectives,
    isLoading,
    createObjective: createMutation.mutateAsync,
    updateObjective: updateMutation.mutateAsync,
    deleteObjective: deleteMutation.mutateAsync,
    linkFeatureToObjective: linkFeature.mutateAsync,
    unlinkFeatureFromObjective: unlinkFeature.mutateAsync,
  };
}
