import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';

export interface ReleaseData {
  id: string;
  product_id: string;
  version: string | null;
  release_date: string;
  feature_ids: string[] | null;
  notes: string | null;
  goal: string;
  release_type: string;
  status: string;
  target_date: string | null;
  progress: number;
  created_at: string;
  feature_count?: number;
}

export function useReleases() {
  const { currentProduct } = useApp();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const productId = currentProduct?.id;

  const { data: releases = [], isLoading } = useQuery({
    queryKey: ['releases', productId],
    queryFn: async () => {
      if (!productId) return [];
      const { data, error } = await supabase
        .from('releases')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (!data?.length) return [];

      // Count features mapped to each release
      const releaseIds = data.map(r => r.id);
      const { data: feats } = await supabase
        .from('features')
        .select('id, release_id, progress')
        .in('release_id', releaseIds);

      return data.map(r => {
        const mapped = (feats || []).filter((f: any) => f.release_id === r.id);
        const avgProgress = mapped.length > 0
          ? Math.round(mapped.reduce((s: number, f: any) => s + (f.progress || 0), 0) / mapped.length)
          : 0;
        return { ...r, feature_count: mapped.length, progress: avgProgress } as ReleaseData;
      });
    },
    enabled: !!productId,
  });

  const createMutation = useMutation({
    mutationFn: async (values: { version?: string; goal?: string; target_date?: string; release_type?: string }) => {
      if (!productId) throw new Error('No product selected');
      const { data, error } = await supabase
        .from('releases')
        .insert({
          product_id: productId,
          version: values.version || null,
          goal: values.goal || '',
          target_date: values.target_date || null,
          release_type: values.release_type || 'minor',
          status: 'planned',
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['releases', productId] });
      toast({ title: 'Release created' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error creating release', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...values }: Partial<ReleaseData> & { id: string }) => {
      const { feature_count, ...rest } = values as any;
      const { data, error } = await supabase.from('releases').update(rest).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['releases', productId] });
    },
    onError: (error: Error) => {
      toast({ title: 'Error updating release', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('releases').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['releases', productId] });
      toast({ title: 'Release deleted' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error deleting release', description: error.message, variant: 'destructive' });
    },
  });

  return {
    releases,
    isLoading,
    createRelease: createMutation.mutateAsync,
    updateRelease: updateMutation.mutateAsync,
    deleteRelease: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
}
