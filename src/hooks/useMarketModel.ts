import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';

export interface MarketModelData {
  id: string;
  product_id: string;
  total_addressable_market: number;
  serviceable_addressable_market: number | null;
  serviceable_obtainable_market: number | null;
  time_horizon_years: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export function useMarketModel() {
  const { currentProduct } = useApp();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const productId = currentProduct?.id;

  const { data: marketModel, isLoading } = useQuery({
    queryKey: ['market_model', productId],
    queryFn: async () => {
      if (!productId) return null;
      const { data, error } = await supabase
        .from('market_models')
        .select('*')
        .eq('product_id', productId)
        .maybeSingle();
      if (error) throw error;
      return data as MarketModelData | null;
    },
    enabled: !!productId,
  });

  const upsertMutation = useMutation({
    mutationFn: async (values: Partial<MarketModelData>) => {
      if (!productId) throw new Error('No product selected');
      const payload = { ...values, product_id: productId };
      if (marketModel?.id) {
        const { data, error } = await supabase
          .from('market_models')
          .update(payload)
          .eq('id', marketModel.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('market_models')
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['market_model', productId] });
      toast({ title: 'Market configuration saved' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error saving market model', description: error.message, variant: 'destructive' });
    },
  });

  return { marketModel, isLoading, upsertMarketModel: upsertMutation.mutateAsync, isSaving: upsertMutation.isPending };
}
