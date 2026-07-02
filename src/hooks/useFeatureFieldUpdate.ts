import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Maps a DB field name to the activity type recorded in feature_activity.
function activityTypeForField(
  fieldName: string
): 'status_change' | 'assignee_change' | 'field_change' {
  if (fieldName === 'status') return 'status_change';
  if (fieldName === 'assignee_name') return 'assignee_change';
  return 'field_change';
}

export function useFeatureFieldUpdate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async ({
      featureId,
      fieldName,
      oldValue,
      newValue,
    }: {
      featureId: string;
      fieldName: string;
      oldValue: unknown;
      newValue: unknown;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // 1. Update the features row
      const { error: updateError } = await supabase
        .from('features')
        .update({ [fieldName]: newValue } as any)
        .eq('id', featureId);

      if (updateError) throw updateError;

      // 2. Write the activity record
      const { error: actError } = await supabase
        .from('feature_activity' as any)
        .insert({
          feature_id: featureId,
          user_id: user.id,
          type: activityTypeForField(fieldName),
          field_name: fieldName,
          old_value: oldValue != null ? String(oldValue) : null,
          new_value: newValue != null ? String(newValue) : null,
        });

      if (actError) throw actError;
    },
    onSuccess: (_data, { featureId }) => {
      // Invalidate both the features list and the activity feed for this feature
      queryClient.invalidateQueries({ queryKey: ['features'] });
      queryClient.invalidateQueries({ queryKey: ['feature-activity', featureId] });
    },
    onError: (err: Error) => {
      toast({
        title: 'Could not save change',
        description: err.message,
        variant: 'destructive',
      });
    },
  });

  return {
    updateField: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    error: mutation.error,
  };
}
