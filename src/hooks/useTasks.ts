import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';

export interface TaskData {
  id: string;
  feature_id: string;
  name: string;
  description: string | null;
  status: string;
  priority: string;
  start_date: string | null;
  due_date: string | null;
  dependencies: string[] | null;
  created_at: string;
  updated_at: string;
  owners: string[];
}

export function useTasks(featureId?: string) {
  const { currentProduct } = useApp();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const productId = currentProduct?.id;

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', productId, featureId],
    queryFn: async () => {
      if (!productId) return [];

      let query = supabase.from('tasks').select('*');
      
      if (featureId) {
        query = query.eq('feature_id', featureId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      if (!data?.length) return [];

      // Get owners
      const taskIds = data.map(t => t.id);
      const { data: owners } = await supabase
        .from('task_owners')
        .select('*')
        .in('task_id', taskIds);

      return data.map(t => ({
        ...t,
        owners: (owners || []).filter(o => o.task_id === t.id).map(o => o.owner_name),
      })) as TaskData[];
    },
    enabled: !!productId,
  });

  const createMutation = useMutation({
    mutationFn: async (values: { feature_id: string; name: string; description?: string; priority?: string; owner_names?: string[] }) => {
      const { owner_names, ...rest } = values;
      const { data, error } = await supabase
        .from('tasks')
        .insert({ ...rest, status: 'todo', priority: rest.priority || 'medium' })
        .select()
        .single();
      if (error) throw error;

      if (owner_names?.length) {
        await supabase.from('task_owners').insert(
          owner_names.map(name => ({ task_id: data.id, owner_name: name }))
        );
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['features', productId] });
      toast({ title: 'Task created' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error creating task', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...values }: Partial<TaskData> & { id: string }) => {
      const { owners, ...rest } = values as any;
      const { data, error } = await supabase.from('tasks').update(rest).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['features', productId] });
    },
    onError: (error: Error) => {
      toast({ title: 'Error updating task', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['features', productId] });
      toast({ title: 'Task deleted' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error deleting task', description: error.message, variant: 'destructive' });
    },
  });

  return {
    tasks,
    isLoading,
    createTask: createMutation.mutateAsync,
    updateTask: updateMutation.mutateAsync,
    deleteTask: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
}
