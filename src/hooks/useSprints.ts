import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';

export interface SprintData {
  id: string;
  product_id: string;
  name: string;
  goal: string;
  start_date: string | null;
  end_date: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface SprintSnapshot {
  id: string;
  sprint_id: string;
  snapshot_date: string;
  completed_points: number;
  completed_features: number;
  features_per_phase: Record<string, number>;
  created_at: string;
}

export function useSprints() {
  const { currentProduct } = useApp();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const productId = currentProduct?.id;

  const { data: sprints = [], isLoading } = useQuery({
    queryKey: ['sprints', productId],
    queryFn: async () => {
      if (!productId) return [];
      const { data, error } = await supabase
        .from('sprints')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as SprintData[];
    },
    enabled: !!productId,
  });

  const createMutation = useMutation({
    mutationFn: async (values: { name: string; goal?: string; start_date?: string; end_date?: string }) => {
      if (!productId) throw new Error('No product selected');
      const { data, error } = await supabase
        .from('sprints')
        .insert({ product_id: productId, ...values } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sprints', productId] });
      toast({ title: 'Sprint created' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error creating sprint', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (values: { id: string; name?: string; goal?: string; start_date?: string | null; end_date?: string | null; status?: string }) => {
      const { data, error } = await supabase
        .from('sprints')
        .update({
          ...(values.name !== undefined ? { name: values.name } : {}),
          ...(values.goal !== undefined ? { goal: values.goal } : {}),
          ...(values.start_date !== undefined ? { start_date: values.start_date } : {}),
          ...(values.end_date !== undefined ? { end_date: values.end_date } : {}),
          ...(values.status !== undefined ? { status: values.status } : {}),
          updated_at: new Date().toISOString(),
        } as any)
        .eq('id', values.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sprints', productId] });
      toast({ title: 'Sprint updated' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error updating sprint', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('sprints')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sprints', productId] });
      toast({ title: 'Sprint deleted' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error deleting sprint', description: error.message, variant: 'destructive' });
    },
  });

  // Sprint objectives junction mutations
  const linkObjectiveMutation = useMutation({
    mutationFn: async (vars: { sprintId: string; objectiveId: string }) => {
      const { error } = await (supabase as any)
        .from('sprint_objectives')
        .insert({ sprint_id: vars.sprintId, objective_id: vars.objectiveId });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['sprint-objectives', vars.sprintId] });
    },
  });

  const unlinkObjectiveMutation = useMutation({
    mutationFn: async (vars: { sprintId: string; objectiveId: string }) => {
      const { error } = await (supabase as any)
        .from('sprint_objectives')
        .delete()
        .eq('sprint_id', vars.sprintId)
        .eq('objective_id', vars.objectiveId);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['sprint-objectives', vars.sprintId] });
    },
  });

  // Sprint Snapshots Mutation
  const saveSnapshotMutation = useMutation({
    mutationFn: async (vars: {
      sprintId: string;
      completedPoints: number;
      completedFeatures: number;
      featuresPerPhase: Record<string, number>;
    }) => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await (supabase as any)
        .from('sprint_snapshots')
        .upsert({
          sprint_id: vars.sprintId,
          snapshot_date: today,
          completed_points: vars.completedPoints,
          completed_features: vars.completedFeatures,
          features_per_phase: vars.featuresPerPhase,
        }, {
          onConflict: 'sprint_id,snapshot_date'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['sprint-snapshots', vars.sprintId] });
    },
  });

  return {
    sprints,
    isLoading,
    createSprint: createMutation.mutateAsync,
    updateSprint: updateMutation.mutateAsync,
    deleteSprint: deleteMutation.mutateAsync,
    linkObjectiveToSprint: linkObjectiveMutation.mutateAsync,
    unlinkObjectiveFromSprint: unlinkObjectiveMutation.mutateAsync,
    saveSprintSnapshot: saveSnapshotMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
}

// Separate hook to fetch linked objectives for a sprint
export function useSprintObjectives(sprintId: string | null) {
  return useQuery({
    queryKey: ['sprint-objectives', sprintId],
    queryFn: async () => {
      if (!sprintId) return [];
      const { data, error } = await (supabase as any)
        .from('sprint_objectives')
        .select('objective_id')
        .eq('sprint_id', sprintId);

      if (error) throw error;
      return (data || []).map((d: any) => d.objective_id) as string[];
    },
    enabled: !!sprintId,
  });
}

// Separate hook to fetch snapshots for a sprint
export function useSprintSnapshots(sprintId: string | null) {
  return useQuery({
    queryKey: ['sprint-snapshots', sprintId],
    queryFn: async () => {
      if (!sprintId) return [];
      const { data, error } = await (supabase as any)
        .from('sprint_snapshots')
        .select('*')
        .eq('sprint_id', sprintId)
        .order('snapshot_date', { ascending: true });

      if (error) throw error;
      return (data || []) as SprintSnapshot[];
    },
    enabled: !!sprintId,
  });
}
