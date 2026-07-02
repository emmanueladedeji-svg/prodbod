import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface OrgMemberForMention {
  userId: string;
  displayName: string;
}

// Parses @Name tokens from a comment body and resolves them to user IDs.
// Matches @FirstName or @"First Last" — simple heuristic, not a full parser.
function resolveMentions(body: string, members: OrgMemberForMention[]): string[] {
  const mentioned: string[] = [];
  const mentionRegex = /@([\w]+)/g;
  let match: RegExpExecArray | null;

  while ((match = mentionRegex.exec(body)) !== null) {
    const fragment = match[1].toLowerCase();
    const found = members.find((m) =>
      m.displayName.toLowerCase().startsWith(fragment)
    );
    if (found && !mentioned.includes(found.userId)) {
      mentioned.push(found.userId);
    }
  }

  return mentioned;
}

export function usePostComment(
  featureId: string | null,
  orgMembers: OrgMemberForMention[] = []
) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isPosting, setIsPosting] = useState(false);

  const postComment = async (body: string): Promise<void> => {
    if (!featureId || !body.trim()) return;
    setIsPosting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const mentionedUserIds = resolveMentions(body, orgMembers);

      const { error } = await supabase
        .from('feature_activity' as any)
        .insert({
          feature_id: featureId,
          user_id: user.id,
          type: 'comment',
          body: body.trim(),
          mentioned_user_ids: mentionedUserIds.length > 0 ? mentionedUserIds : null,
        });

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['feature-activity', featureId] });
    } catch (err: any) {
      toast({
        title: 'Could not post comment',
        description: err.message,
        variant: 'destructive',
      });
      throw err;
    } finally {
      setIsPosting(false);
    }
  };

  return { postComment, isPosting };
}
