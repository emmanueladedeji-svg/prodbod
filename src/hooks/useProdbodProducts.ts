import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProdbodProduct {
  id: string;
  organization_id: string;
  org_id: string | null;
  name: string;
  description: string | null;
  // Extended columns — added by migration 20260405000002_status_system.sql
  // These may be undefined if the migration hasn't been applied yet.
  icon_color?: string | null;
  icon_letter?: string | null;
  emoji_icon?: string | null;
  owner_id?: string | null;
  default_views?: string[] | null;
  progress_icons_enabled?: boolean;
  created_at: string;
  created_by: string | null;
}

// Use * so the query doesn't break if extended columns haven't been migrated yet.
// Columns added in migration 002 (icon_color, owner_id, default_views, progress_icons_enabled)
// will be undefined/null until that migration is applied — handled gracefully in the type.
const PRODUCT_SELECT = '*';

export function useOrgProducts(orgId: string | null) {
  return useQuery({
    queryKey: ['org-products', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('products')
        .select(PRODUCT_SELECT)
        .eq('organization_id', orgId!)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as ProdbodProduct[];
    },
  });
}

export function useAddProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orgId, name, description }: { orgId: string; name: string; description?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await (supabase as any)
        .from('products')
        .insert({
          organization_id: orgId,
          org_id: orgId,
          name,
          description: description || null,
          created_by: user?.id ?? null,
        })
        .select(PRODUCT_SELECT)
        .single();
      if (error) throw error;
      return data as ProdbodProduct;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['org-products', variables.orgId] });
    },
  });
}

export function useUpdateProductName() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name, orgId }: { id: string; name: string; orgId: string }) => {
      const { data, error } = await (supabase as any)
        .from('products').update({ name }).eq('id', id).select(PRODUCT_SELECT).single();
      if (error) throw error;
      return data as ProdbodProduct;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['org-products', variables.orgId] });
    },
  });
}

export function useUpdateProductSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, orgId, ...fields }: {
      id: string; orgId: string;
      name?: string; icon_color?: string; icon_letter?: string; emoji_icon?: string;
      owner_id?: string | null; description?: string | null;
      default_views?: string[]; progress_icons_enabled?: boolean;
    }) => {
      const { data, error } = await (supabase as any)
        .from('products').update(fields).eq('id', id).select(PRODUCT_SELECT).single();
      if (error) throw error;
      return data as ProdbodProduct;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['org-products', variables.orgId] });
    },
  });
}

export function useDuplicateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ product }: { product: ProdbodProduct }) => {
      const { data: { user } } = await supabase.auth.getUser();

      // 1. Create duplicate product
      const { data: newProduct, error: pErr } = await (supabase as any)
        .from('products')
        .insert({
          organization_id: product.organization_id,
          org_id: product.org_id,
          name: `${product.name} (Copy)`,
          description: product.description,
          icon_color: product.icon_color,
          created_by: user?.id ?? null,
        })
        .select(PRODUCT_SELECT)
        .single();
      if (pErr) throw pErr;

      // 2. Copy product statuses
      const { data: statuses } = await (supabase as any)
        .from('product_statuses')
        .select('*')
        .eq('product_id', product.id)
        .order('position');

      if (statuses && statuses.length > 0) {
        const statusInserts = statuses.map((s: any) => ({
          product_id: newProduct.id,
          org_id: s.org_id,
          name: s.name,
          color: s.color,
          category: s.category,
          position: s.position,
          is_default: s.is_default,
          is_closed: s.is_closed,
        }));
        await (supabase as any).from('product_statuses').insert(statusInserts);
      }

      return newProduct as ProdbodProduct;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['org-products', data.organization_id] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, orgId }: { id: string; orgId: string }) => {
      // Get feature count for confirmation (already confirmed by caller)
      const { error } = await (supabase as any).from('products').delete().eq('id', id);
      if (error) throw error;
      return orgId;
    },
    onSuccess: (orgId) => {
      queryClient.invalidateQueries({ queryKey: ['org-products', orgId] });
    },
  });
}

export function useProductFeatureCount(productId: string | null) {
  return useQuery({
    queryKey: ['product-feature-count', productId],
    enabled: !!productId,
    queryFn: async () => {
      const { count, error } = await (supabase as any)
        .from('workspace_features')
        .select('id', { count: 'exact', head: true })
        .eq('product_id', productId!);
      if (error) throw error;
      return count ?? 0;
    },
  });
}
