import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { slugify } from '@/utils/slugify';

export interface ProdbodOrg {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  industry: string | null;
  established_date: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateOrgData {
  name: string;
  description?: string;
  industry?: string;
  established_date?: string;
}

export function useMyOrgs() {
  return useQuery({
    queryKey: ['my-orgs'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Orgs owned by the user
      const { data: owned, error: e1 } = await supabase
        .from('organizations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
      if (e1) throw e1;

      // Orgs user is an active member of (via invite)
      const { data: memberships, error: e2 } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('member_user_id', user.id)
        .eq('status', 'Active');
      if (e2) throw e2;

      const memberOrgIds = (memberships || []).map((m) => m.organization_id);
      let memberOrgs: ProdbodOrg[] = [];
      if (memberOrgIds.length > 0) {
        const { data: orgs, error: e3 } = await supabase
          .from('organizations')
          .select('*')
          .in('id', memberOrgIds);
        if (e3) throw e3;
        memberOrgs = (orgs || []) as ProdbodOrg[];
      }

      // Deduplicate by id
      const all = [...(owned || []) as ProdbodOrg[], ...memberOrgs];
      const seen = new Set<string>();
      return all.filter((o) => {
        if (seen.has(o.id)) return false;
        seen.add(o.id);
        return true;
      });
    },
  });
}

export function useCreateProdbodOrg() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateOrgData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: org, error } = await supabase
        .from('organizations')
        .insert({
          name: data.name,
          slug: slugify(data.name),
          description: data.description || null,
          industry: data.industry || null,
          established_date: data.established_date || null,
          user_id: user.id,
        })
        .select()
        .single();
      if (error) throw error;

      // Add owner as active member
      const { error: memError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: org.id,
          name: user.email || '',
          email: user.email || '',
          role: 'Owner',
          status: 'Active',
          member_user_id: user.id,
          invited_by: user.email || '',
        });
      if (memError) throw memError;

      return org as ProdbodOrg;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-orgs'] });
      queryClient.invalidateQueries({ queryKey: ['org-members'] });
    },
  });
}
