import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ChecklistItem {
  id: string;
  feature_id: string;
  title: string;
  assignee_id: string | null;
  is_completed: boolean;
  created_at: string;
}

export interface UserStory {
  id: string;
  feature_id: string;
  story_text: string;
  position: number;
  created_at: string;
}

export interface FeatureComment {
  id: string;
  feature_id: string;
  parent_id: string | null;
  author_id: string | null;
  author_name: string;
  content: string;
  created_at: string;
  replies?: FeatureComment[];
}

export interface ActivityHistoryItem {
  id: string;
  feature_id: string;
  user_id: string | null;
  user_name: string;
  action_type: string; // 'phase', 'priority', 'sprint', 'assignee', 'dates', 'task_add', 'task_remove', 'sub_feature_add', 'sub_feature_remove'
  description: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
}

export function useFeatureDetails(featureId: string | null) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // 1. Fetch checklists
  const checklistsQuery = useQuery({
    queryKey: ['feature-checklists', featureId],
    queryFn: async () => {
      if (!featureId) return [];
      const { data, error } = await (supabase as any)
        .from('workspace_feature_checklists')
        .select('*')
        .eq('feature_id', featureId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as ChecklistItem[];
    },
    enabled: !!featureId,
  });

  // 2. Fetch user stories
  const userStoriesQuery = useQuery({
    queryKey: ['feature-user-stories', featureId],
    queryFn: async () => {
      if (!featureId) return [];
      const { data, error } = await (supabase as any)
        .from('workspace_feature_user_stories')
        .select('*')
        .eq('feature_id', featureId)
        .order('position', { ascending: true });
      if (error) throw error;
      return data as UserStory[];
    },
    enabled: !!featureId,
  });

  // 3. Fetch comments
  const commentsQuery = useQuery({
    queryKey: ['feature-comments', featureId],
    queryFn: async () => {
      if (!featureId) return [];
      const { data, error } = await (supabase as any)
        .from('workspace_feature_comments')
        .select('*')
        .eq('feature_id', featureId)
        .order('created_at', { ascending: true });
      if (error) throw error;

      const list = data as FeatureComment[];
      // Thread comments: map replies to parent_id
      const rootComments: FeatureComment[] = [];
      const commentMap: Record<string, FeatureComment> = {};

      list.forEach((c) => {
        commentMap[c.id] = { ...c, replies: [] };
      });

      list.forEach((c) => {
        const mapped = commentMap[c.id];
        if (c.parent_id && commentMap[c.parent_id]) {
          commentMap[c.parent_id].replies?.push(mapped);
        } else {
          rootComments.push(mapped);
        }
      });

      return rootComments;
    },
    enabled: !!featureId,
  });

  // 4. Fetch activity history
  const activitiesQuery = useQuery({
    queryKey: ['feature-activities', featureId],
    queryFn: async () => {
      if (!featureId) return [];
      const { data, error } = await (supabase as any)
        .from('workspace_feature_activities')
        .select('*')
        .eq('feature_id', featureId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as ActivityHistoryItem[];
    },
    enabled: !!featureId,
  });

  // 5. Fetch multiple assignees
  const assigneesQuery = useQuery({
    queryKey: ['feature-assignees', featureId],
    queryFn: async () => {
      if (!featureId) return [];
      const { data, error } = await (supabase as any)
        .from('workspace_feature_assignees')
        .select('user_id')
        .eq('feature_id', featureId);
      if (error) throw error;
      return (data || []).map((d: any) => d.user_id) as string[];
    },
    enabled: !!featureId,
  });

  // Helper to log activities
  const logActivityMutation = useMutation({
    mutationFn: async (vars: {
      action_type: string;
      description: string;
      old_value?: string | null;
      new_value?: string | null;
    }) => {
      if (!featureId) return;
      const { data: { user } } = await supabase.auth.getUser();
      // Fetch user profile name
      let name = user?.email || 'System';
      if (user?.id) {
        const { data: profile } = await (supabase as any)
          .from('user_profiles')
          .select('first_name, last_name')
          .eq('id', user.id)
          .single();
        if (profile) {
          name = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || name;
        }
      }

      const { error } = await (supabase as any)
        .from('workspace_feature_activities')
        .insert({
          feature_id: featureId,
          user_id: user?.id || null,
          user_name: name,
          action_type: vars.action_type,
          description: vars.description,
          old_value: vars.old_value || null,
          new_value: vars.new_value || null,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-activities', featureId] });
    },
  });

  // Checklists mutations
  const createChecklistItem = useMutation({
    mutationFn: async (vars: { title: string; assignee_id?: string | null }) => {
      const { data, error } = await (supabase as any)
        .from('workspace_feature_checklists')
        .insert({ feature_id: featureId!, title: vars.title, assignee_id: vars.assignee_id || null })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-checklists', featureId] });
    },
  });

  const updateChecklistItem = useMutation({
    mutationFn: async (vars: { id: string; title?: string; assignee_id?: string | null; is_completed?: boolean }) => {
      const { data, error } = await (supabase as any)
        .from('workspace_feature_checklists')
        .update({
          ...(vars.title !== undefined ? { title: vars.title } : {}),
          ...(vars.assignee_id !== undefined ? { assignee_id: vars.assignee_id } : {}),
          ...(vars.is_completed !== undefined ? { is_completed: vars.is_completed } : {}),
          updated_at: new Date().toISOString(),
        })
        .eq('id', vars.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-checklists', featureId] });
    },
  });

  const deleteChecklistItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('workspace_feature_checklists')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-checklists', featureId] });
    },
  });

  // User Stories mutations
  const createUserStory = useMutation({
    mutationFn: async (story_text: string) => {
      const { data: existing } = await (supabase as any)
        .from('workspace_feature_user_stories')
        .select('id')
        .eq('feature_id', featureId!);
      const pos = existing ? existing.length : 0;

      const { data, error } = await (supabase as any)
        .from('workspace_feature_user_stories')
        .insert({ feature_id: featureId!, story_text, position: pos })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-user-stories', featureId] });
    },
  });

  const updateUserStory = useMutation({
    mutationFn: async (vars: { id: string; story_text: string }) => {
      const { data, error } = await (supabase as any)
        .from('workspace_feature_user_stories')
        .update({ story_text: vars.story_text, updated_at: new Date().toISOString() })
        .eq('id', vars.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-user-stories', featureId] });
    },
  });

  const deleteUserStory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('workspace_feature_user_stories')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-user-stories', featureId] });
    },
  });

  // Comments mutations
  const createComment = useMutation({
    mutationFn: async (vars: { content: string; parent_id?: string | null }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      let name = user?.email || 'Anonymous';
      if (user?.id) {
        const { data: profile } = await (supabase as any)
          .from('user_profiles')
          .select('first_name, last_name')
          .eq('id', user.id)
          .single();
        if (profile) {
          name = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || name;
        }
      }

      const { data, error } = await (supabase as any)
        .from('workspace_feature_comments')
        .insert({
          feature_id: featureId!,
          parent_id: vars.parent_id || null,
          author_id: user?.id || null,
          author_name: name,
          content: vars.content,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-comments', featureId] });
    },
  });

  // Assignee modifications
  const addAssignee = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await (supabase as any)
        .from('workspace_feature_assignees')
        .insert({ feature_id: featureId!, user_id: userId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-assignees', featureId] });
    },
  });

  const removeAssignee = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await (supabase as any)
        .from('workspace_feature_assignees')
        .delete()
        .eq('feature_id', featureId!)
        .eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feature-assignees', featureId] });
    },
  });

  return {
    checklists: checklistsQuery.data || [],
    checklistsLoading: checklistsQuery.isLoading,
    createChecklistItem: createChecklistItem.mutateAsync,
    updateChecklistItem: updateChecklistItem.mutateAsync,
    deleteChecklistItem: deleteChecklistItem.mutateAsync,

    userStories: userStoriesQuery.data || [],
    userStoriesLoading: userStoriesQuery.isLoading,
    createUserStory: createUserStory.mutateAsync,
    updateUserStory: updateUserStory.mutateAsync,
    deleteUserStory: deleteUserStory.mutateAsync,

    comments: commentsQuery.data || [],
    commentsLoading: commentsQuery.isLoading,
    createComment: createComment.mutateAsync,

    activities: activitiesQuery.data || [],
    activitiesLoading: activitiesQuery.isLoading,
    logActivity: logActivityMutation.mutateAsync,

    assigneeIds: assigneesQuery.data || [],
    assigneesLoading: assigneesQuery.isLoading,
    addAssignee: addAssignee.mutateAsync,
    removeAssignee: removeAssignee.mutateAsync,
  };
}
