import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { MarketSegmentData, computeSegmentMetrics } from './useMarketSegments';

export interface BusinessMetricData {
  id: string;
  business_objective_id: string;
  name: string;
  type: string;
  unit: string;
  baseline_value: number;
  target_value: number;
  current_value: number | null;
}

export interface BusinessObjectiveData {
  id: string;
  product_id: string;
  statement: string;
  quarter: string;
  year: number;
  target_segment_ids: string[] | null;
  // New ARPU-based fields
  objective_type: string;
  target_type: string;
  target_segment_id: string | null;
  target_percentage: number | null;
  target_customers: number | null;
  target_revenue: number | null;
  start_date: string | null;
  end_date: string | null;
  owner_name: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  metrics?: BusinessMetricData[];
}

export type ObjectiveStatus = 'Not Started' | 'On Track' | 'At Risk' | 'Achieved';

/** Compute target values from SOM x percentage */
export function computeObjectiveTargets(
  objective: Partial<BusinessObjectiveData>,
  segment: MarketSegmentData | undefined
) {
  if (!segment || !objective.target_percentage) return { target_customers: 0, target_revenue: 0 };
  const metrics = computeSegmentMetrics(segment);
  const pct = objective.target_percentage / 100;
  return {
    target_customers: Math.round(metrics.som_customers * pct),
    target_revenue: Math.round(metrics.som_value * pct * 100) / 100,
  };
}

/** Compute progress % from segment's current performance vs target */
export function computeObjectiveProgress(
  objective: BusinessObjectiveData,
  segment: MarketSegmentData | undefined
): number {
  if (!segment) return 0;
  if (objective.target_type === 'customer') {
    const target = objective.target_customers || 0;
    if (target === 0) return 0;
    return Math.min(100, ((segment.current_customers || 0) / target) * 100);
  } else {
    const target = objective.target_revenue || 0;
    if (target === 0) return 0;
    return Math.min(100, ((segment.current_revenue || 0) / target) * 100);
  }
}

/** Derive status from progress */
export function getObjectiveStatus(progress: number): ObjectiveStatus {
  if (progress >= 100) return 'Achieved';
  if (progress >= 70) return 'On Track';
  if (progress >= 40) return 'At Risk';
  return 'Not Started';
}

export function useBusinessObjectives() {
  const { currentProduct } = useApp();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const productId = currentProduct?.id;

  const { data: objectives = [], isLoading } = useQuery({
    queryKey: ['business_objectives', productId],
    queryFn: async () => {
      if (!productId) return [];
      const { data: objs, error: objErr } = await supabase
        .from('business_objectives')
        .select('*')
        .eq('product_id', productId)
        .order('year', { ascending: false })
        .order('quarter', { ascending: false });
      if (objErr) throw objErr;
      if (!objs || objs.length === 0) return [];

      const ids = objs.map((o) => o.id);
      const { data: metrics, error: metErr } = await supabase
        .from('business_metrics')
        .select('*')
        .in('business_objective_id', ids);
      if (metErr) throw metErr;

      return objs.map((obj) => ({
        ...obj,
        metrics: (metrics || []).filter((m) => m.business_objective_id === obj.id),
      })) as BusinessObjectiveData[];
    },
    enabled: !!productId,
  });

  const createMutation = useMutation({
    mutationFn: async ({
      objective,
      metrics,
    }: {
      objective: Omit<BusinessObjectiveData, 'id' | 'created_at' | 'updated_at' | 'metrics'>;
      metrics?: Omit<BusinessMetricData, 'id' | 'business_objective_id'>[];
    }) => {
      if (!productId) throw new Error('No product selected');
      const { data: obj, error: objErr } = await supabase
        .from('business_objectives')
        .insert({ ...objective, product_id: productId })
        .select()
        .single();
      if (objErr) throw objErr;

      if (metrics && metrics.length > 0) {
        const metricRows = metrics.map((m) => ({ ...m, business_objective_id: obj.id }));
        const { error: metErr } = await supabase.from('business_metrics').insert(metricRows);
        if (metErr) throw metErr;
      }
      return obj;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business_objectives', productId] });
      toast({ title: 'Business objective created' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error creating objective', description: error.message, variant: 'destructive' });
    },
  });

  const updateObjectiveMutation = useMutation({
    mutationFn: async ({ id, ...values }: Partial<BusinessObjectiveData> & { id: string }) => {
      const { data, error } = await supabase
        .from('business_objectives')
        .update(values)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business_objectives', productId] });
    },
    onError: (error: Error) => {
      toast({ title: 'Error updating objective', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('business_objectives').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business_objectives', productId] });
      toast({ title: 'Objective deleted' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error deleting objective', description: error.message, variant: 'destructive' });
    },
  });

  return {
    objectives,
    isLoading,
    createObjective: createMutation.mutateAsync,
    updateObjective: updateObjectiveMutation.mutateAsync,
    deleteObjective: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
}
