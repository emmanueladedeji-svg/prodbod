import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

const organizationSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name must be under 100 characters'),
  description: z.string().trim().max(500, 'Description must be under 500 characters').optional(),
});

export interface DbOrganization {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export function useOrganizations() {
  return useQuery({
    queryKey: ['organizations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as DbOrganization[];
    },
  });
}

export function useCreateOrganization() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (org: { name: string; description?: string }) => {
      const validated = organizationSchema.parse(org);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('organizations')
        .insert({ name: validated.name, description: validated.description || null, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data as DbOrganization;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
    },
  });
}
