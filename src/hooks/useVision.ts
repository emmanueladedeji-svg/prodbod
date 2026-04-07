import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';

export interface VisionData {
  id: string;
  product_id: string;
  statement: string;
  target_customer: string;
  core_problem: string;
  long_term_impact: string;
  differentiation: string[] | null;
  once_upon_a_time: string;
  every_day: string;
  one_day: string;
  because_of_that: string[];
  until_finally: string;
  generated_story: string;
  strategic_intent: string;
  value_proposition: string;
  success_indicators: string[];
  time_horizon: number;
  target_segment_ids: string[];
  created_at: string;
  updated_at: string;
}

export function generateVisionStory(inputs: {
  onceUponATime: string;
  everyDay: string;
  oneDay: string;
  becauseOfThat: string[];
  untilFinally: string;
}): string {
  const impacts = inputs.becauseOfThat.filter(Boolean);
  let impactStr = '';
  if (impacts.length === 1) impactStr = impacts[0];
  else if (impacts.length === 2) impactStr = `${impacts[0]} and ${impacts[1]}`;
  else if (impacts.length > 2) {
    impactStr = impacts.slice(0, -1).join(', ') + ', and ' + impacts[impacts.length - 1];
  }

  return [
    inputs.onceUponATime ? `Once upon a time, ${inputs.onceUponATime}.` : '',
    inputs.everyDay ? `Every day, ${inputs.everyDay}.` : '',
    inputs.oneDay ? `One day, ${inputs.oneDay}.` : '',
    impactStr ? `Because of that, ${impactStr}.` : '',
    inputs.untilFinally ? `Until finally, ${inputs.untilFinally}.` : '',
  ].filter(Boolean).join(' ');
}

export function useVision() {
  const { currentProduct } = useApp();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const productId = currentProduct?.id;

  const { data: vision, isLoading } = useQuery({
    queryKey: ['vision', productId],
    queryFn: async () => {
      if (!productId) return null;
      const { data, error } = await supabase
        .from('visions')
        .select('*')
        .eq('product_id', productId)
        .maybeSingle();
      if (error) throw error;
      return data as VisionData | null;
    },
    enabled: !!productId,
  });

  const upsertMutation = useMutation({
    mutationFn: async (values: Partial<VisionData>) => {
      if (!productId) throw new Error('No product selected');
      const payload = { ...values, product_id: productId };
      if (vision?.id) {
        const { data, error } = await supabase
          .from('visions')
          .update(payload)
          .eq('id', vision.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('visions')
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vision', productId] });
      toast({ title: 'Vision saved successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error saving vision', description: error.message, variant: 'destructive' });
    },
  });

  return {
    vision,
    isLoading,
    upsertVision: upsertMutation.mutateAsync,
    isSaving: upsertMutation.isPending,
  };
}
