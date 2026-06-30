import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProductRole } from '@/types';

export function useProductRoles(productId: string | null) {
  const queryClient = useQueryClient();

  const { data: product, isLoading } = useQuery({
    queryKey: ['product-roles-base', productId],
    enabled: !!productId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('product_manager_name')
        .eq('id', productId!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const makeRole = (name: string | null | undefined): ProductRole | null => {
    if (!name) return null;
    const trimmed = name.trim();
    if (!trimmed) return null;
    const initials = trimmed.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    const colors = ['#8B5CF6', '#3B82F6', '#F59E0B', '#EC4899', '#10B981', '#6B7280'];
    const hash = trimmed.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    return { userId: null, name: trimmed, initials, avatarColor: colors[hash % colors.length] };
  };

  const assignRole = useMutation({
    mutationFn: async ({ role, userId }: { role: 'pm' | 'lead_engineer', userId: string | null }) => {
      if (!productId) throw new Error('No product ID provided');
      if (role !== 'pm') return; // lead_engineer column doesn't exist in DB yet
      const { error } = await supabase
        .from('products')
        .update({ product_manager_name: userId })
        .eq('id', productId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-roles-base', productId] });
      queryClient.invalidateQueries({ queryKey: ['org-products'] });
    },
  });

  return {
    pm: makeRole(product?.product_manager_name),
    leadEngineer: null as ProductRole | null,
    assignRole: (role: 'pm' | 'lead_engineer', userId: string | null) => assignRole.mutate({ role, userId }),
    isLoading,
  };
}
