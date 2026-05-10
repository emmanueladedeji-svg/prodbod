import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FeatureStatus, FeatureWithAssignee } from '@/types';

export function useProductFeatures(productId: string | null, statusFilter: FeatureStatus | 'all' = 'all') {
  return useQuery({
    queryKey: ['product-features', productId, statusFilter],
    enabled: !!productId,
    queryFn: async () => {
      const mapStatusForward = (name: string): FeatureStatus => {
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
        const { data, error } = await (supabase as any)
          .from('workspace_features')
          .select(`
            *,
            product_statuses!workspace_features_status_id_fkey (
              name
            )
          `)
          .eq('product_id', productId!)
          .neq('level', 'task') // USER REQUIREMENT: Filter out tasks from feature list
          .order('created_at', { ascending: false });

        let finalData = data;
        if (error) {
          const { data: fallbackData } = await (supabase as any)
            .from('workspace_features')
            .select('*, product_statuses(name)')
            .eq('product_id', productId!)
            .neq('level', 'task')
            .order('created_at', { ascending: false });
          finalData = fallbackData;
        }

        let features = (finalData || []).map((f: any) => {
          const rawStatus = f.product_statuses?.name || (Array.isArray(f.product_statuses) ? f.product_statuses[0]?.name : null);
          return {
            id: f.id,
            name: f.title,
            status: rawStatus ? mapStatusForward(rawStatus) : 'idea',
            is_sub_feature: f.level !== 'feature',
            parent_feature_id: f.parent_id,
            assignee_user_id: f.assignee_id,
          };
        });

        if (statusFilter !== 'all') {
          features = features.filter(f => f.status === statusFilter);
        }

        // Fetch assignee profiles
        const assigneeIds = features.map(f => f.assignee_user_id).filter(Boolean) as string[];
        if (assigneeIds.length > 0) {
          const { data: profiles } = await supabase
            .from('user_profiles')
            .select('id, first_name, last_name')
            .in('id', assigneeIds);
          
          const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
          
          return features.map(f => {
            const profile = f.assignee_user_id ? profileMap.get(f.assignee_user_id) : null;
            let assignee = null;
            if (profile) {
              const name = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
              const initials = (name.split(' ').map(n => n[0]).filter(Boolean).join('') || '?').toUpperCase().slice(0, 2);
              const colors = ['#8B5CF6', '#3B82F6', '#F59E0B', '#EC4899', '#10B981', '#6B7280'];
              const hash = profile.id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
              const avatarColor = colors[hash % colors.length];
              assignee = { userId: profile.id, name, initials, avatarColor };
            }
            return { ...f, assignee } as FeatureWithAssignee;
          });
        }

        return features.map(f => ({ ...f, assignee: null })) as FeatureWithAssignee[];
      } catch (err) {
        console.error('Error in useProductFeatures:', err);
        return [];
      }
    }
  });
}
