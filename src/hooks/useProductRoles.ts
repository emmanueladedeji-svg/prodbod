import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProductRole } from '@/types';

export function useProductRoles(productId: string | null) {
  const queryClient = useQueryClient();

  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ['product-roles-base', productId],
    enabled: !!productId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('pm_user_id, lead_engineer_user_id')
        .eq('id', productId!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ['product-roles', productId, product?.pm_user_id, product?.lead_engineer_user_id],
    enabled: !!productId && (!!product?.pm_user_id || !!product?.lead_engineer_user_id),
    queryFn: async () => {
      const userIds = [product?.pm_user_id, product?.lead_engineer_user_id].filter(Boolean) as string[];
      if (userIds.length === 0) return { pm: null, leadEngineer: null };

      const { data: profiles, error } = await supabase
        .from('user_profiles')
        .select('id, first_name, last_name')
        .in('id', userIds);
      if (error) throw error;

      const profileMap = new Map(profiles.map(p => [p.id, p]));

      const getRole = (userId: string | null | undefined): ProductRole | null => {
        if (!userId) return null;
        const profile = profileMap.get(userId);
        if (!profile) return null;
        const name = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown User';
        const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        
        // Deterministic color from userId hash
        const colors = ['#8B5CF6', '#3B82F6', '#F59E0B', '#EC4899', '#10B981', '#6B7280'];
        const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const avatarColor = colors[hash % colors.length];

        return { userId, name, initials, avatarColor };
      };

      return {
        pm: getRole(product?.pm_user_id),
        leadEngineer: getRole(product?.lead_engineer_user_id),
      };
    },
  });

  const assignRole = useMutation({
    mutationFn: async ({ role, userId }: { role: 'pm' | 'lead_engineer', userId: string | null }) => {
      if (!productId) throw new Error('No product ID provided');
      const column = role === 'pm' ? 'pm_user_id' : 'lead_engineer_user_id';
      const { error } = await supabase
        .from('products')
        .update({ [column]: userId })
        .eq('id', productId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-roles-base', productId] });
      queryClient.invalidateQueries({ queryKey: ['org-products'] });
    },
  });

  return {
    pm: roles?.pm || null,
    leadEngineer: roles?.leadEngineer || null,
    assignRole: (role: 'pm' | 'lead_engineer', userId: string | null) => assignRole.mutate({ role, userId }),
    isLoading: productLoading || rolesLoading,
  };
}
