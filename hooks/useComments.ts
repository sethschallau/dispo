/**
 * useComments Hook
 *
 * State management for event comments.
 */

import { commentsService } from '@/services/comments';
import { Comment } from '@/types';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './useAuth';

export function useComments(eventId: string) {
  const { userId, user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!eventId) {
      setComments([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const unsubscribe = commentsService.subscribeToComments(
      eventId,
      (commentsList) => {
        setComments(commentsList);
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Comments subscription error:', err);
        setError(err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [eventId]);

  const addComment = useCallback(async (text: string) => {
    if (!userId || !user || !eventId) return;
    await commentsService.addComment(eventId, userId, user.fullName, text);
  }, [eventId, userId, user]);

  const deleteComment = useCallback(async (commentId: string) => {
    if (!eventId) return;
    await commentsService.deleteComment(eventId, commentId);
  }, [eventId]);

  return {
    comments,
    isLoading,
    error,
    addComment,
    deleteComment,
    canDelete: (comment: Comment) => comment.authorId === userId,
  };
}
