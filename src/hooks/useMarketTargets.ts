import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface MarketTargetData {
  id: string;
  segment_id: string;
  name: string;
  metric_type: string;
  target_value: number;
  current_value: number | null;
  start_date: string | null;
  deadline: string | null;
  priority: string;
  owner: string | null;
  created_at: string;
  updated_at: string;
}

export type TargetStatus = 'Achieved' | 'On Track' | 'At Risk' | 'Behind';

export function getTargetProgress(target: MarketTargetData): number {
  if (!target.current_value || target.target_value === 0) return 0;
  return Math.min(100, (target.current_value / target.target_value) * 100);
}

export function getTargetStatus(target: MarketTargetData): TargetStatus {
  const progress = getTargetProgress(target);
  if (progress >= 100) return 'Achieved';
  if (progress >= 70) return 'On Track';
  if (progress >= 40) return 'At Risk';
  return 'Behind';
}

export function useMarketTargets(segmentId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: targets = [], isLoading } = useQuery({
    queryKey: ['market_targets', segmentId],
    queryFn: async () => {
      if (!segmentId) return [];
      const { data, error } = await supabase
        .from('market_targets')
        .select('*')
        .eq('segment_id', segmentId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as MarketTargetData[];
    },
    enabled: !!segmentId,
  });

  const createMutation = useMutation({
    mutationFn: async (values: Omit<MarketTargetData, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('market_targets')
        .insert(values)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['market_targets', segmentId] });
      queryClient.invalidateQueries({ queryKey: ['all_market_targets'] });
      toast({ title: 'Target created successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error creating target', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...values }: Partial<MarketTargetData> & { id: string }) => {
      const { data, error } = await supabase
        .from('market_targets')
        .update(values)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['market_targets', segmentId] });
      queryClient.invalidateQueries({ queryKey: ['all_market_targets'] });
      toast({ title: 'Target updated' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error updating target', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('market_targets')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['market_targets', segmentId] });
      queryClient.invalidateQueries({ queryKey: ['all_market_targets'] });
      toast({ title: 'Target deleted' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error deleting target', description: error.message, variant: 'destructive' });
    },
  });

  return {
    targets,
    isLoading,
    createTarget: createMutation.mutateAsync,
    updateTarget: updateMutation.mutateAsync,
    deleteTarget: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
}

// Hook to fetch targets for all segments of a product
export function useAllMarketTargets(segmentIds: string[]) {
  const { data: targets = [], isLoading } = useQuery({
    queryKey: ['all_market_targets', segmentIds],
    queryFn: async () => {
      if (!segmentIds.length) return [];
      const { data, error } = await supabase
        .from('market_targets')
        .select('*')
        .in('segment_id', segmentIds)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as MarketTargetData[];
    },
    enabled: segmentIds.length > 0,
  });
  return { targets, isLoading };
}
