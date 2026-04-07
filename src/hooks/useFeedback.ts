import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { toast } from 'sonner';

export interface FeedbackData {
  id: string;
  product_id: string;
  type: string;
  content: string;
  customer: string | null;
  segment_id: string | null;
  feature_ids: string[] | null;
  frequency_count: number;
  created_at: string;
  updated_at: string;
}

export function useFeedback() {
  const { currentProduct } = useApp();
  const productId = currentProduct?.id;
  const qc = useQueryClient();

  const { data: feedback = [], isLoading } = useQuery({
    queryKey: ['feedback', productId],
    enabled: !!productId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .eq('product_id', productId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as FeedbackData[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (values: { type: string; content: string; customer?: string }) => {
      const { data, error } = await supabase
        .from('feedback')
        .insert({
          product_id: productId!,
          type: values.type,
          content: values.content,
          customer: values.customer || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feedback', productId] });
      toast.success('Feedback logged');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('feedback').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feedback', productId] });
      toast.success('Feedback deleted');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return {
    feedback,
    isLoading,
    createFeedback: createMutation.mutateAsync,
    deleteFeedback: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
}
