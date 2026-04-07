import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';

export interface FeatureData {
  id: string;
  product_objective_id: string;
  parent_feature_id: string | null;
  name: string;
  description: string;
  category: string;
  source: string;
  owner_name: string | null;
  status: string;
  priority: string;
  expected_outcome: string | null;
  success_metrics: string[] | null;
  due_date: string | null;
  feature_code: string;
  feature_type: string;
  release_id: string | null;
  sprint_id: string | null;
  story_points: number;
  time_estimate: number;
  tags: string[];
  assignee_name: string;
  progress: number;
  created_at: string;
  updated_at: string;
  // Computed/joined
  task_count?: number;
  done_task_count?: number;
}

export function useFeatures() {
  const { currentProduct } = useApp();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const productId = currentProduct?.id;

  const { data: features = [], isLoading } = useQuery({
    queryKey: ['features', productId],
    queryFn: async () => {
      if (!productId) return [];

      // Get business objectives for this product
      const { data: bos, error: boErr } = await supabase
        .from('business_objectives')
        .select('id')
        .eq('product_id', productId);
      if (boErr) throw boErr;
      if (!bos?.length) return [];

      // Get strategies
      const { data: strats, error: strErr } = await supabase
        .from('strategies')
        .select('id')
        .in('business_objective_id', bos.map(b => b.id));
      if (strErr) throw strErr;
      if (!strats?.length) return [];

      // Get product objectives
      const { data: pos, error: poErr } = await supabase
        .from('product_objectives')
        .select('id')
        .in('strategy_id', strats.map(s => s.id));
      if (poErr) throw poErr;
      if (!pos?.length) return [];

      // Get features
      const { data: feats, error: fErr } = await supabase
        .from('features')
        .select('*')
        .in('product_objective_id', pos.map(p => p.id))
        .order('created_at', { ascending: false });
      if (fErr) throw fErr;
      if (!feats?.length) return [];

      // Get task counts per feature
      const featIds = feats.map(f => f.id);
      const { data: tasks, error: tErr } = await supabase
        .from('tasks')
        .select('id, feature_id, status')
        .in('feature_id', featIds);
      if (tErr) throw tErr;

      return feats.map(f => {
        const featureTasks = (tasks || []).filter(t => t.feature_id === f.id);
        const doneTasks = featureTasks.filter(t => t.status === 'done').length;
        const progress = featureTasks.length > 0 ? Math.round((doneTasks / featureTasks.length) * 100) : 0;
        return {
          ...f,
          task_count: featureTasks.length,
          done_task_count: doneTasks,
          progress,
        } as FeatureData;
      });
    },
    enabled: !!productId,
  });

  const createMutation = useMutation({
    mutationFn: async (values: {
      product_objective_id: string;
      name: string;
      description?: string;
      category?: string;
      feature_type?: string;
      priority?: string;
      release_id?: string | null;
      sprint_id?: string | null;
      parent_feature_id?: string | null;
      due_date?: string | null;
    }) => {
      const { data, error } = await supabase
        .from('features')
        .insert({
          product_objective_id: values.product_objective_id,
          name: values.name,
          description: values.description || '',
          category: values.category || 'new',
          feature_type: values.feature_type || 'new',
          priority: values.priority || 'medium',
          release_id: values.release_id || null,
          sprint_id: values.sprint_id || null,
          parent_feature_id: values.parent_feature_id || null,
          due_date: values.due_date || null,
          status: 'backlog',
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['features', productId] });
      toast({ title: 'Feature created' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error creating feature', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...values }: Partial<FeatureData> & { id: string }) => {
      const { task_count, done_task_count, ...rest } = values as any;
      const { data, error } = await supabase
        .from('features')
        .update(rest)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['features', productId] });
    },
    onError: (error: Error) => {
      toast({ title: 'Error updating feature', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('features').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['features', productId] });
      toast({ title: 'Feature deleted' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error deleting feature', description: error.message, variant: 'destructive' });
    },
  });

  return {
    features,
    isLoading,
    createFeature: createMutation.mutateAsync,
    updateFeature: updateMutation.mutateAsync,
    deleteFeature: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
}
