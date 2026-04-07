import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface OrgMember {
  id: string;
  organization_id: string;
  name: string;
  email: string | null;
  role: string;
  department: string | null;
  status: string;
  invited_by: string | null;
  invited_on: string | null;
  last_active: string | null;
  created_at: string;
  updated_at: string;
}

export const ORG_ROLES = ['Staff', 'Team Lead', 'Owner'] as const;
export const DEPARTMENTS = [
  'Engineer',
  'Product Manager',
  'QA Engineer',
  'DevOps Engineer',
  'Data Engineer',
  'Product Marketer',
  'Customer Support',
] as const;

export function useOrgMembers(orgId: string | undefined) {
  return useQuery({
    queryKey: ['organization-members', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organization_members')
        .select('*')
        .eq('organization_id', orgId!)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as OrgMember[];
    },
  });
}

export function useInviteOrgMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (member: {
      organization_id: string;
      name: string;
      email: string;
      department?: string;
      invited_by?: string;
    }) => {
      const { data, error } = await supabase
        .from('organization_members')
        .insert({
          organization_id: member.organization_id,
          name: member.name,
          email: member.email,
          department: member.department || null,
          role: 'Staff',
          status: 'Pending',
          invited_by: member.invited_by || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['organization-members', vars.organization_id] });
    },
  });
}

export function useUpdateOrgMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      id: string;
      organization_id: string;
      updates: Partial<Pick<OrgMember, 'role' | 'department' | 'status'>>;
    }) => {
      const { error } = await supabase
        .from('organization_members')
        .update(params.updates)
        .eq('id', params.id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['organization-members', vars.organization_id] });
    },
  });
}

export function useDeleteOrgMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: string; organization_id: string }) => {
      const { error } = await supabase
        .from('organization_members')
        .delete()
        .eq('id', params.id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['organization-members', vars.organization_id] });
    },
  });
}
