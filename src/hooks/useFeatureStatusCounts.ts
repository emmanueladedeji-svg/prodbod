import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FeatureStatus } from '@/types';

// Maps the workspace_features.status enum directly to our FeatureStatus key.
// The status enum is NOT NULL with a default, so this is always reliable.
function mapStatusFromEnum(enumVal: string): FeatureStatus | null {
  if (enumVal === 'idea_or_problem') return 'idea';
  if (enumVal === 'discovery' || enumVal === 'prototyping') return 'discovery';
  if (enumVal === 'in_development') return 'in_development';
  if (enumVal === 'in_testing') return 'in_testing';
  if (enumVal === 'live') return 'live';
  if (enumVal === 'closed') return 'closed';
  return null;
}

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

      try {
        // Query the raw status enum — always populated, no join required
        const { data, error } = await (supabase as any)
          .from('workspace_features')
          .select('id, status')
          .eq('product_id', productId!)
          .neq('level', 'task');

        if (error) throw error;

        (data || []).forEach((f: any) => {
          const mappedStatus = mapStatusFromEnum(f.status);
          if (mappedStatus) counts[mappedStatus]++;
        });
      } catch (err) {
        console.error('Error in useFeatureStatusCounts:', err);
      }

      const total = Object.values(counts).reduce((a, b) => a + b, 0);
      return { counts, total };
    },
  });
}
