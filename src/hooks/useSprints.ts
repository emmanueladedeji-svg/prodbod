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

  return {
    sprints,
    isLoading,
    createSprint: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
}
