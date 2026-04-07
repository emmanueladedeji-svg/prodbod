import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProdbodMember {
  id: string;
  organization_id: string;
  member_user_id: string | null;
  name: string;
  email: string | null;
  role: string;
  status: string;
  invited_by: string | null;
  invited_on: string | null;
  last_active: string | null;
  created_at: string;
  // Joined profile data
  profile?: {
    first_name: string | null;
    last_name: string | null;
    job_role: string | null;
  } | null;
}

export function useOrgMembersProdbod(orgId: string | null) {
  return useQuery({
    queryKey: ['org-members', orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organization_members')
        .select('*')
        .eq('organization_id', orgId!)
        .order('created_at', { ascending: true });
      if (error) throw error;

      const members = (data || []) as ProdbodMember[];

      // Enrich with user profiles where available
      const userIds = members
        .map((m) => m.member_user_id)
        .filter(Boolean) as string[];

      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('id, first_name, last_name, job_role')
          .in('id', userIds);

        const profileMap = new Map(
          (profiles || []).map((p) => [p.id, p])
        );
        members.forEach((m) => {
          if (m.member_user_id) {
            m.profile = profileMap.get(m.member_user_id) || null;
          }
        });
      }

      return members;
    },
  });
}

export function useInviteMembers(orgId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (emails: string[]): Promise<{ email: string; token: string }[]> => {
      if (!orgId) throw new Error('No org selected');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const results: { email: string; token: string }[] = [];

      for (const email of emails) {
        // Create invite token
        const { data: invite, error: inviteError } = await supabase
          .from('invites')
          .insert({
            email,
            org_id: orgId,
            invited_by: user.id,
          })
          .select()
          .single();
        if (inviteError) throw inviteError;

        // Check if already a member
        const { data: existing } = await supabase
          .from('organization_members')
          .select('id')
          .eq('organization_id', orgId)
          .eq('email', email)
          .maybeSingle();

        if (!existing) {
          // Get current user profile for invited_by name
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('first_name, last_name')
            .eq('id', user.id)
            .maybeSingle();

          const inviterName = profile
            ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || user.email || ''
            : user.email || '';

          const { error: memError } = await supabase
            .from('organization_members')
            .insert({
              organization_id: orgId,
              name: email,
              email,
              role: 'Staff',
              status: 'Pending',
              invited_by: inviterName,
            });
          if (memError) throw memError;
        }

        results.push({ email, token: invite.token });
      }

      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-members', orgId] });
    },
  });
}

export function useUpdateMemberRole(orgId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: string }) => {
      const { error } = await supabase
        .from('organization_members')
        .update({ role })
        .eq('id', memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-members', orgId] });
    },
  });
}

export function useRemoveMember(orgId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from('organization_members')
        .delete()
        .eq('id', memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-members', orgId] });
    },
  });
}

export function useAcceptInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      token,
      userId,
      profileData,
    }: {
      token: string;
      userId: string;
      profileData: {
        first_name: string;
        last_name: string;
        job_role: string;
      };
    }) => {
      // Fetch invite
      const { data: invite, error: inviteErr } = await supabase
        .from('invites')
        .select('*')
        .eq('token', token)
        .maybeSingle();
      if (inviteErr || !invite) throw new Error('Invalid invite');
      if (invite.accepted) throw new Error('Invite already used');

      // Mark invite accepted
      const { error: updateErr } = await supabase
        .from('invites')
        .update({ accepted: true })
        .eq('id', invite.id);
      if (updateErr) throw updateErr;

      // Upsert user profile
      const { error: profileErr } = await supabase
        .from('user_profiles')
        .upsert(
          { id: userId, ...profileData, onboarding_completed: true },
          { onConflict: 'id' }
        );
      if (profileErr) throw profileErr;

      // Update member record: set active + link user_id
      const { error: memErr } = await supabase
        .from('organization_members')
        .update({
          member_user_id: userId,
          status: 'Active',
          last_active: new Date().toISOString(),
          name: `${profileData.first_name} ${profileData.last_name}`.trim(),
        })
        .eq('organization_id', invite.org_id)
        .eq('email', invite.email);
      if (memErr) throw memErr;

      return { orgId: invite.org_id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      queryClient.invalidateQueries({ queryKey: ['org-members'] });
      queryClient.invalidateQueries({ queryKey: ['my-orgs'] });
    },
  });
}
