// src/hooks/useComments.ts
// Real backend-backed comments (GET is public, POST/DELETE require login —
// see backend/src/comments/comments.controller.ts). Replaces the old
// UI-only local state that used to live in ArticleDetailScreen.tsx.

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { get, post, del } from '@/lib/api';

export interface ArticleComment {
  id: string;
  articleId: string;
  userId: string;
  body: string;
  createdAt: string;
  user: { id: string; name: string | null };
}

interface CommentsPage {
  data: ArticleComment[];
  meta: { total: number; page: number; limit: number; hasMore: boolean };
}

export function useComments(articleId: string | undefined) {
  return useQuery<CommentsPage>({
    queryKey: ['comments', articleId],
    queryFn: () => get<CommentsPage>(`/news/${articleId}/comments`, { limit: 50 }),
    enabled: !!articleId,
    staleTime: 1000 * 30,
  });
}

export function usePostComment(articleId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => post<{ data: ArticleComment }>(`/news/${articleId}/comments`, { body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', articleId] });
      qc.invalidateQueries({ queryKey: ['article', articleId] });
    },
  });
}

export function useDeleteComment(articleId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) => del(`/news/comments/${commentId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', articleId] });
      qc.invalidateQueries({ queryKey: ['article', articleId] });
    },
  });
}
