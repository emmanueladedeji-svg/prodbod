import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

const productSchema = z.object({
  organization_id: z.string().uuid(),
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name must be under 100 characters'),
  url: z.string().trim().url('Invalid URL').max(500).optional().or(z.literal('')),
  description: z.string().trim().max(1000, 'Description must be under 1000 characters').optional(),
  product_manager_name: z.string().trim().max(100, 'Name must be under 100 characters').optional(),
});

export interface DbProduct {
  id: string;
  organization_id: string;
  name: string;
  url: string | null;
  description: string | null;
  product_manager_name: string | null;
  created_at: string;
  updated_at: string;
}

export function useProducts(organizationId: string | undefined) {
  return useQuery({
    queryKey: ['products', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as DbProduct[];
    },
    enabled: !!organizationId,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (product: {
      organization_id: string;
      name: string;
      url?: string;
      description?: string;
      product_manager_name?: string;
    }) => {
      const validated = productSchema.parse(product);
      const { data, error } = await supabase
        .from('products')
        .insert({
          organization_id: validated.organization_id,
          name: validated.name,
          url: validated.url || null,
          description: validated.description || null,
          product_manager_name: validated.product_manager_name || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data as DbProduct;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products', variables.organization_id] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (product: {
      id: string;
      name?: string;
      url?: string;
      description?: string;
      product_manager_name?: string;
    }) => {
      const { id, ...updates } = product;
      const payload: Record<string, unknown> = {};
      if (updates.name !== undefined) payload.name = updates.name;
      if (updates.url !== undefined) payload.url = updates.url || null;
      if (updates.description !== undefined) payload.description = updates.description || null;
      if (updates.product_manager_name !== undefined) payload.product_manager_name = updates.product_manager_name || null;

      const { data, error } = await supabase
        .from('products')
        .update(payload)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as DbProduct;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
