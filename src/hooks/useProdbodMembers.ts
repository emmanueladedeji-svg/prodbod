import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { slugify } from '@/utils/slugify';

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

export interface ProdbodMember {
  id: string;
  organization_id: string;
  member_user_id: string | null;
  name: string;
  email: string | null;
  role: string;
  department?: string | null;
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
    mutationFn: async (emails: string[]): Promise<{ email: string; token: string; emailSent: boolean; emailError?: string }[]> => {
      if (!orgId) throw new Error('No org selected');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Fetch inviter name + org name once
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('first_name, last_name')
        .eq('id', user.id)
        .maybeSingle();
      const inviterName = profile
        ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || user.email || ''
        : user.email || '';

      const { data: orgData } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', orgId)
        .maybeSingle();
      const orgName = orgData?.name || '';

      const results: { email: string; token: string; emailSent: boolean; emailError?: string }[] = [];

      for (const email of emails) {
        let inviteToken: string;

        // Duplicate check: reuse an existing non-expired, non-accepted invite
        const { data: existingInvite } = await supabase
          .from('invites')
          .select('id, token')
          .eq('email', email)
          .eq('org_id', orgId)
          .eq('accepted', false)
          .gt('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (existingInvite) {
          inviteToken = existingInvite.token;
        } else {
          // Create new invite record
          const { data: invite, error: inviteError } = await supabase
            .from('invites')
            .insert({ email, org_id: orgId, invited_by: user.id })
            .select()
            .single();
          if (inviteError) throw inviteError;
          inviteToken = invite.token;

          // Create pending member row only if not already present
          const { data: existingMember } = await supabase
            .from('organization_members')
            .select('id')
            .eq('organization_id', orgId)
            .eq('email', email)
            .maybeSingle();

          if (!existingMember) {
            const { error: memError } = await supabase
              .from('organization_members')
              .insert({
                organization_id: orgId,
                name: email,
                email,
                role: 'Staff',
                status: 'Pending',
                invited_by: inviterName,
                invited_on: new Date().toISOString(),
              });
            if (memError) throw memError;
          }
        }

        // Send email via edge function
        let emailSent = false;
        let emailError: string | undefined;
        try {
          const { data: fnData, error: fnError } = await supabase.functions.invoke('send-invite-email', {
            body: { 
              email, 
              token: inviteToken, 
              org_name: orgName, 
              inviter_name: inviterName,
              site_url: window.location.origin 
            },
          });
          if (fnError) {
            emailError = fnError.message;
          } else {
            emailSent = fnData?.success === true;
            if (!emailSent) emailError = fnData?.error || 'Unknown error from email service';
          }
        } catch (e: any) {
          emailError = e?.message || 'Network error calling email service';
        }

        results.push({ email, token: inviteToken, emailSent, emailError });
      }

      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-members', orgId] });
    },
  });
}

export function useResendInvite() {
  return useMutation({
    mutationFn: async ({
      email,
      token,
      orgName,
      inviterName,
    }: {
      email: string;
      token: string;
      orgName: string;
      inviterName: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('send-invite-email', {
        body: { 
          email, 
          token, 
          org_name: orgName, 
          inviter_name: inviterName,
          site_url: window.location.origin
        },
      });
      if (error) throw error;
      return data as { success: boolean; error?: string };
    },
  });
}

export function useUpdateMember(orgId: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      memberId,
      updates
    }: {
      memberId: string;
      updates: Partial<Pick<ProdbodMember, 'role' | 'department' | 'status'>>
    }) => {
      const { error } = await supabase
        .from('organization_members')
        .update(updates)
        .eq('id', memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-members', orgId] });
      queryClient.invalidateQueries({ queryKey: ['organization-members', orgId] });
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
