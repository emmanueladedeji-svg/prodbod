import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';

export interface ProductObjectiveData {
  id: string;
  strategy_id: string;
  statement: string;
  success_metrics: string[] | null;
  measurement_method: string;
  timeframe: string;
  priority: string;
  created_at: string;
  updated_at: string;
}

export function useProductObjectives() {
  const { currentProduct } = useApp();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const productId = currentProduct?.id;

  const { data: objectives = [], isLoading } = useQuery({
    queryKey: ['product_objectives', productId],
    queryFn: async () => {
      if (!productId) return [];
      // Get business objectives for this product
      const { data: bos, error: boErr } = await supabase
        .from('business_objectives')
        .select('id')
        .eq('product_id', productId);
      if (boErr) throw boErr;
      if (!bos || bos.length === 0) return [];

      // Get strategies for those business objectives
      const boIds = bos.map((b) => b.id);
      const { data: strats, error: strErr } = await supabase
        .from('strategies')
        .select('id')
        .in('business_objective_id', boIds);
      if (strErr) throw strErr;
      if (!strats || strats.length === 0) return [];

      const stratIds = strats.map((s) => s.id);
      const { data: pos, error: poErr } = await supabase
        .from('product_objectives')
        .select('*')
        .in('strategy_id', stratIds)
        .order('created_at', { ascending: false });
      if (poErr) throw poErr;
      return (pos || []) as ProductObjectiveData[];
    },
    enabled: !!productId,
  });

  const createMutation = useMutation({
    mutationFn: async (values: Omit<ProductObjectiveData, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('product_objectives')
        .insert(values)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product_objectives', productId] });
      toast({ title: 'Product objective created' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error creating objective', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('product_objectives').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product_objectives', productId] });
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
    deleteObjective: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
}
