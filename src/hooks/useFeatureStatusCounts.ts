import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FeatureStatus } from '@/types';

export function useFeatureStatusCounts(productId: string | null) {
  return useQuery({
    queryKey: ['feature-status-counts', productId],
    enabled: !!productId,
    queryFn: async () => {
      const counts: Record<FeatureStatus, number> = {
        idea: 0,
        discovery: 0,
        in_development: 0,
        in_testing: 0,
        live: 0,
        closed: 0,
      };

      const mapStatus = (name: string): FeatureStatus | null => {
        const n = name.toLowerCase();
        if (n.includes('idea') || n.includes('problem')) return 'idea';
        if (n.includes('discovery')) return 'discovery';
        if (n.includes('prototyping')) return 'discovery';
        if (n.includes('development')) return 'in_development';
        if (n.includes('testing')) return 'in_testing';
        if (n.includes('live')) return 'live';
        if (n.includes('closed')) return 'closed';
        return null;
      };

      try {
        const { data, error } = await (supabase as any)
          .from('workspace_features')
          .select(`
            id,
            product_statuses (
              name
            )
          `)
          .eq('product_id', productId!)
          .neq('level', 'task');

        let finalData = data;
        if (error) {
          console.warn('Primary count query failed, trying fallback:', error);
          const { data: fallbackData } = await (supabase as any)
            .from('workspace_features')
            .select('id, product_statuses(name)')
            .eq('product_id', productId!)
            .neq('level', 'task');
          finalData = fallbackData;
        }

        (finalData || []).forEach((f: any) => {
          // Robustly get the status name from either the joined object or array
          const statusObj = f.product_statuses;
          const statusName = Array.isArray(statusObj) ? statusObj[0]?.name : statusObj?.name;
          
          const mappedStatus = statusName ? mapStatus(statusName) : null;
          if (mappedStatus) {
            counts[mappedStatus]++;
          }
        });
      } catch (err) {
        console.error('Error in useFeatureStatusCounts:', err);
      }

      const total = Object.values(counts).reduce((a, b) => a + b, 0);
      return { counts, total };
    },
  });
}
