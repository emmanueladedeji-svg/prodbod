import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FeatureStatus } from '@/types';

export interface ProductStatusCounts {
  idea: number;
  discovery: number;
  in_development: number;
  in_testing: number;
  live: number;
  closed: number;
}

export interface AllProductStatusCountsResponse {
  statusCountsMap: Record<string, ProductStatusCounts>;
}

export function useAllProductStatusCounts(productIds: string[]) {
  return useQuery({
    queryKey: ['all-product-status-counts', productIds],
    enabled: productIds.length > 0,
    queryFn: async () => {
      const statusCountsMap: Record<string, ProductStatusCounts> = {};
      
      // Initialize map for all products
      productIds.forEach(id => {
        statusCountsMap[id] = { idea: 0, discovery: 0, in_development: 0, in_testing: 0, live: 0, closed: 0 };
      });
      
      const mapStatus = (name: string | null): keyof ProductStatusCounts => {
        if (!name) return 'idea';
        const n = name.toLowerCase();
        if (n.includes('idea') || n.includes('problem')) return 'idea';
        if (n.includes('discovery') || n.includes('prototyping')) return 'discovery';
        if (n.includes('development')) return 'in_development';
        if (n.includes('testing')) return 'in_testing';
        if (n.includes('live')) return 'live';
        if (n.includes('closed')) return 'closed';
        return 'idea';
      };

      try {
        // Fetch features for all products at once, EXCLUDING tasks
        const { data: features, error } = await (supabase as any)
          .from('workspace_features')
          .select(`
            id,
            product_id,
            product_statuses (
              name
            )
          `)
          .in('product_id', productIds)
          .neq('level', 'task');

        if (error) {
          console.warn('Primary all-product counts query failed, trying fallback:', error);
          const { data: fallbackData } = await (supabase as any)
            .from('workspace_features')
            .select('id, product_id, product_statuses(name)')
            .in('product_id', productIds)
            .neq('level', 'task');
          
          (fallbackData || []).forEach((f: any) => {
            if (!statusCountsMap[f.product_id]) return;
            const statusObj = f.product_statuses;
            const statusName = Array.isArray(statusObj) ? statusObj[0]?.name : statusObj?.name;
            const bucket = mapStatus(statusName);
            statusCountsMap[f.product_id][bucket]++;
          });
          return { statusCountsMap };
        }

        (features || []).forEach((f: any) => {
          if (!statusCountsMap[f.product_id]) return;
          const statusObj = f.product_statuses;
          const statusName = Array.isArray(statusObj) ? statusObj[0]?.name : statusObj?.name;
          const bucket = mapStatus(statusName);
          statusCountsMap[f.product_id][bucket]++;
        });
      } catch (err) {
        console.error('Error in useAllProductStatusCounts:', err);
      }

      return { statusCountsMap };
    },
  });
}
