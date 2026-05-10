import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProductStatus, StatusCategory } from '@/types/productStatus';
import { useEffect } from 'react';

export function useProductStatuses(productId: string | null) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!productId) return;
    const channel = (supabase as any)
      .channel(`product-statuses-${productId}`)
      .on('postgres_changes' as any, {
        event: '*', schema: 'public', table: 'product_statuses',
        filter: `product_id=eq.${productId}`,
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['product-statuses', productId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [productId, queryClient]);

  return useQuery({
    queryKey: ['product-statuses', productId],
    enabled: !!productId,
    queryFn: async () => {
      try {
        const { data, error } = await (supabase as any)
          .from('product_statuses')
          .select('*')
          .eq('product_id', productId!)
          .order('position', { ascending: true });
        
        if (error) {
          console.warn('Error fetching product statuses:', error);
          return [];
        }
        return (data || []) as ProductStatus[];
      } catch (err) {
        console.error('Fatal error in useProductStatuses:', err);
        return [];
      }
    },
  });
}

export function useCreateProductStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { productId: string; orgId: string; name: string; color: string; category: StatusCategory; position: number }) => {
      const { data, error } = await (supabase as any).from('product_statuses').insert({
        product_id: vars.productId, org_id: vars.orgId, name: vars.name,
        color: vars.color, category: vars.category, position: vars.position,
        is_default: false, is_closed: false,
      }).select().single();
      if (error) throw error;
      return data as ProductStatus;
    },
    onSuccess: (data) => queryClient.invalidateQueries({ queryKey: ['product-statuses', data.product_id] }),
  });
}

export function useUpdateProductStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, productId, ...updates }: Partial<ProductStatus> & { id: string; productId: string }) => {
      const { data, error } = await (supabase as any).from('product_statuses').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data as ProductStatus;
    },
    onSuccess: (data) => queryClient.invalidateQueries({ queryKey: ['product-statuses', data.product_id] }),
  });
}

export function useDeleteProductStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, productId, defaultStatusId }: { id: string; productId: string; defaultStatusId: string }) => {
      // Reassign features with this status to default
      await (supabase as any).from('workspace_features').update({ status_id: defaultStatusId }).eq('status_id', id);
      const { error } = await (supabase as any).from('product_statuses').delete().eq('id', id);
      if (error) throw error;
      return productId;
    },
    onSuccess: (productId) => queryClient.invalidateQueries({ queryKey: ['product-statuses', productId] }),
  });
}

export function useSaveStatusTemplate() {
  return useMutation({
    mutationFn: async (vars: { orgId: string; name: string; statuses: any[] }) => {
      const { data, error } = await (supabase as any).from('status_templates').insert({
        org_id: vars.orgId, name: vars.name, statuses: vars.statuses,
      }).select().single();
      if (error) throw error;
      return data;
    },
  });
}

export function useStatusTemplates(orgId: string | null) {
  return useQuery({
    queryKey: ['status-templates', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await (supabase as any).from('status_templates').select('*').eq('org_id', orgId!);
      if (error) throw error;
      return data || [];
    },
  });
}
