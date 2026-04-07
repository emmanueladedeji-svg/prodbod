import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface FeatureCommentData {
  id: string;
  feature_id: string;
  author_name: string;
  content: string;
  created_at: string;
}

export function useFeatureComments(featureId: string | null) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['feature_comments', featureId],
    queryFn: async () => {
      if (!featureId) return [];
      const { data, error } = await supabase
        .from('feature_comments')
        .select('*')
        .eq('feature_id', featureId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as FeatureCommentData[];
    },
    enabled: !!featureId,
  });

  const createMutation = useMutation({
    mutationFn: async (values: { feature_id: string; author_name: string; content: string }) => {
      const { data, error } = await supabase
        .from('feature_comments')
        .insert(values as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature_comments', featureId] });
    },
    onError: (error: Error) => {
      toast({ title: 'Error adding comment', description: error.message, variant: 'destructive' });
    },
  });

  return {
    comments,
    isLoading,
    addComment: createMutation.mutateAsync,
  };
}
