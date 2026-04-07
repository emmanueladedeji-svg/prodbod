import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProductList {
  id: string;
  product_id: string;
  org_id: string;
  name: string;
  is_default: boolean;
  position: number;
  created_at: string;
}

export function useProductLists(productId: string | null) {
  return useQuery({
    queryKey: ['product-lists', productId],
    enabled: !!productId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lists')
        .select('*')
        .eq('product_id', productId!)
        .order('position', { ascending: true });
      if (error) throw error;
      return (data || []) as ProductList[];
    },
  });
}

export function useCreateList() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, orgId, name }: { productId: string; orgId: string; name: string }) => {
      const { data, error } = await supabase
        .from('lists')
        .insert({ product_id: productId, org_id: orgId, name })
        .select()
        .single();
      if (error) throw error;
      return data as ProductList;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['product-lists', data.product_id] });
    },
  });
}
