import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';

export interface StrategyMetricData {
  id: string;
  strategy_id: string;
  metric_name: string;
  baseline_value: number;
  target_value: number;
  current_value: number;
  measurement_frequency: string;
  created_at: string;
  updated_at: string;
}

export interface StrategyData {
  id: string;
  business_objective_id: string;
  name: string;
  description: string;
  statement: string;
  rationale: string;
  problem_statement: string;
  approach: string;
  value_lever: string;
  hypothesis: string;
  start_date: string | null;
  end_date: string | null;
  health_score: number;
  status: string;
  partial_threshold: number;
  failure_threshold: number;
  primary_metrics: string[] | null;
  leading_indicators: string[] | null;
  risk_assumptions: string[] | null;
  created_at: string;
  updated_at: string;
  metrics: StrategyMetricData[];
}

export type StrategyStatus = 'not_started' | 'in_progress' | 'achieved' | 'at_risk' | 'failed';

export const VALUE_LEVERS = [
  { value: 'acquisition', label: 'Acquisition' },
  { value: 'conversion', label: 'Conversion' },
  { value: 'retention', label: 'Retention' },
  { value: 'revenue_per_customer', label: 'Revenue per Customer' },
  { value: 'market_penetration', label: 'Market Penetration' },
  { value: 'cost_efficiency', label: 'Cost Efficiency' },
  { value: 'customer_experience', label: 'Customer Experience' },
] as const;

export const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  not_started: { label: 'Not Started', className: 'bg-muted text-muted-foreground' },
  in_progress: { label: 'In Progress', className: 'bg-info/10 text-info' },
  achieved: { label: 'Achieved', className: 'bg-success/10 text-success' },
  at_risk: { label: 'At Risk', className: 'bg-warning/10 text-warning' },
  failed: { label: 'Failed', className: 'bg-destructive/10 text-destructive' },
};

export function computeMetricProgress(metric: StrategyMetricData): number {
  const range = metric.target_value - metric.baseline_value;
  if (range === 0) return metric.current_value >= metric.target_value ? 100 : 0;
  const progress = ((metric.current_value - metric.baseline_value) / range) * 100;
  return Math.max(0, Math.min(100, progress));
}

export function computeHealthScore(metrics: StrategyMetricData[]): number {
  if (metrics.length === 0) return 0;
  const total = metrics.reduce((sum, m) => sum + computeMetricProgress(m), 0);
  return Math.max(0, Math.min(100, Math.round(total / metrics.length)));
}

export function computeStrategyStatus(
  strategy: Pick<StrategyData, 'end_date' | 'partial_threshold' | 'failure_threshold'>,
  metrics: StrategyMetricData[]
): StrategyStatus {
  if (metrics.length === 0) return 'not_started';
  const allAtBaseline = metrics.every((m) => m.current_value === m.baseline_value);
  if (allAtBaseline) return 'not_started';

  const health = computeHealthScore(metrics);
  if (health >= 100) return 'achieved';

  const pastEnd = strategy.end_date ? new Date(strategy.end_date) < new Date() : false;
  if (pastEnd && health <= (strategy.failure_threshold || 0)) return 'failed';
  if (health < (strategy.partial_threshold || 0)) return 'at_risk';
  return 'in_progress';
}

export function useStrategies() {
  const { currentProduct } = useApp();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const productId = currentProduct?.id;

  const { data: strategies = [], isLoading } = useQuery({
    queryKey: ['strategies', productId],
    queryFn: async () => {
      if (!productId) return [];
      // Fetch strategies through business_objectives
      const { data: bos, error: boErr } = await supabase
        .from('business_objectives')
        .select('id')
        .eq('product_id', productId);
      if (boErr) throw boErr;
      if (!bos || bos.length === 0) return [];

      const boIds = bos.map((b) => b.id);
      const { data: strats, error: strErr } = await supabase
        .from('strategies')
        .select('*')
        .in('business_objective_id', boIds)
        .order('created_at', { ascending: false });
      if (strErr) throw strErr;
      if (!strats || strats.length === 0) return [];

      const stratIds = strats.map((s) => s.id);
      const { data: metrics, error: metErr } = await supabase
        .from('strategy_metrics')
        .select('*')
        .in('strategy_id', stratIds);
      if (metErr) throw metErr;

      return strats.map((s) => ({
        ...s,
        metrics: (metrics || []).filter((m) => m.strategy_id === s.id),
      })) as StrategyData[];
    },
    enabled: !!productId,
  });

  const createMutation = useMutation({
    mutationFn: async ({
      strategy,
      metrics,
    }: {
      strategy: {
        business_objective_id: string;
        name: string;
        description: string;
        statement: string;
        rationale: string;
        problem_statement: string;
        approach: string;
        value_lever: string;
        hypothesis: string;
        start_date: string | null;
        end_date: string | null;
        partial_threshold: number;
        failure_threshold: number;
      };
      metrics: { metric_name: string; baseline_value: number; target_value: number; current_value: number; measurement_frequency: string }[];
    }) => {
      const { data: strat, error: strErr } = await supabase
        .from('strategies')
        .insert({
          ...strategy,
          status: 'not_started',
          health_score: 0,
        })
        .select()
        .single();
      if (strErr) throw strErr;

      if (metrics.length > 0) {
        const rows = metrics.map((m) => ({ ...m, strategy_id: strat.id }));
        const { error: metErr } = await supabase.from('strategy_metrics').insert(rows);
        if (metErr) throw metErr;
      }
      return strat;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['strategies', productId] });
      toast({ title: 'Strategy created' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error creating strategy', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...values }: Partial<StrategyData> & { id: string }) => {
      const { metrics: _m, ...rest } = values;
      const { data, error } = await supabase
        .from('strategies')
        .update(rest as any)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['strategies', productId] });
    },
    onError: (error: Error) => {
      toast({ title: 'Error updating strategy', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('strategies').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['strategies', productId] });
      toast({ title: 'Strategy deleted' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error deleting strategy', description: error.message, variant: 'destructive' });
    },
  });

  const updateMetricMutation = useMutation({
    mutationFn: async ({ id, ...values }: Partial<StrategyMetricData> & { id: string }) => {
      const { data, error } = await supabase
        .from('strategy_metrics')
        .update(values)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['strategies', productId] });
    },
    onError: (error: Error) => {
      toast({ title: 'Error updating metric', description: error.message, variant: 'destructive' });
    },
  });

  return {
    strategies,
    isLoading,
    createStrategy: createMutation.mutateAsync,
    updateStrategy: updateMutation.mutateAsync,
    deleteStrategy: deleteMutation.mutateAsync,
    updateMetric: updateMetricMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
}
