import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ProductLine {
  id: string;
  product_id: string;
  name: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  backlog_id?: string;
}

export function useProductLines(productId: string | null) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: productLines = [], isLoading } = useQuery({
    queryKey: ['product-lines', productId],
    queryFn: async () => {
      if (!productId) return [];
      
      // Fetch product lines
      const { data: lines, error: linesErr } = await (supabase as any)
        .from('product_lines')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: true });

      if (linesErr) throw linesErr;

      // Fetch backlogs to map backlog_id
      const lineIds = (lines || []).map((l: any) => l.id);
      let backlogsMap: Record<string, string> = {};
      
      if (lineIds.length > 0) {
        const { data: bgs, error: bgsErr } = await (supabase as any)
          .from('backlogs')
          .select('id, product_line_id')
          .in('product_line_id', lineIds);
        
        if (!bgsErr && bgs) {
          bgs.forEach((bg: any) => {
            backlogsMap[bg.product_line_id] = bg.id;
          });
        }
      }

      return (lines || []).map((l: any) => ({
        ...l,
        backlog_id: backlogsMap[l.id] || null,
      })) as ProductLine[];
    },
    enabled: !!productId,
  });

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      if (!productId) throw new Error('No product selected');

      // 1. Create product line
      const { data: line, error: lineErr } = await (supabase as any)
        .from('product_lines')
        .insert({ product_id: productId, name, is_archived: false })
        .select()
        .single();
      
      if (lineErr) throw lineErr;

      // 2. Create backlog for this line
      const { data: backlog, error: backlogErr } = await (supabase as any)
        .from('backlogs')
        .insert({ product_line_id: line.id, name: `${name} Backlog` })
        .select()
        .single();

      if (backlogErr) throw backlogErr;

      return { ...line, backlog_id: backlog.id } as ProductLine;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-lines', productId] });
      toast({ title: 'Product Line created' });
    },
    onError: (err: Error) => {
      toast({ title: 'Error creating product line', description: err.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (vars: { id: string; name?: string; is_archived?: boolean }) => {
      const { data, error } = await (supabase as any)
        .from('product_lines')
        .update({
          ...(vars.name !== undefined ? { name: vars.name } : {}),
          ...(vars.is_archived !== undefined ? { is_archived: vars.is_archived } : {}),
          updated_at: new Date().toISOString(),
        })
        .eq('id', vars.id)
        .select()
        .single();
      
      if (error) throw error;
      return data as ProductLine;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-lines', productId] });
      toast({ title: 'Product Line updated' });
    },
    onError: (err: Error) => {
      toast({ title: 'Error updating product line', description: err.message, variant: 'destructive' });
    },
  });

  return {
    productLines,
    isLoading,
    createProductLine: createMutation.mutateAsync,
    updateProductLine: updateMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
}
