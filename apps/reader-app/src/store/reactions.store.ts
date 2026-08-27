// src/store/reactions.store.ts
//
// Tracks which reaction (like/dislike) THIS DEVICE has already sent for a
// given article, persisted to AsyncStorage — mirrors the pattern in
// bookmarks.store.ts. There is no per-user Like table on the backend (see
// Article.likeCount/dislikeCount in schema.prisma), so guests can react too;
// de-dup ("don't let one tap count twice") happens here on-device instead of
// server-side. Tapping the same reaction again undoes it; switching from
// like to dislike (or vice versa) undoes the old one and applies the new one
// in a single round trip.

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { patch } from '@/lib/api';

export type Reaction = 'LIKE' | 'DISLIKE';

const STORAGE_KEY = 'article_reactions';

interface ReactionsStore {
  reactions: Record<string, Reaction>;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  getReaction: (articleId: string) => Reaction | undefined;
  react: (articleId: string, type: Reaction) => Promise<{ likeDelta: number; dislikeDelta: number }>;
}

export const useReactionsStore = create<ReactionsStore>((set, get) => ({
  reactions: {},
  hydrated: false,

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) set({ reactions: JSON.parse(raw) as Record<string, Reaction> });
    } catch {
      // ignore
    } finally {
      set({ hydrated: true });
    }
  },

  getReaction: (articleId) => get().reactions[articleId],

  react: async (articleId, type) => {
    const current = get().reactions[articleId];
    const next = { ...get().reactions };

    let likeDelta = 0;
    let dislikeDelta = 0;

    if (current === type) {
      // Tapping the same reaction again undoes it.
      delete next[articleId];
      if (type === 'LIKE') likeDelta = -1; else dislikeDelta = -1;
    } else {
      if (current === 'LIKE') likeDelta -= 1;
      if (current === 'DISLIKE') dislikeDelta -= 1;
      if (type === 'LIKE') likeDelta += 1; else dislikeDelta += 1;
      next[articleId] = type;
    }

    set({ reactions: next });
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});

    try {
      if (likeDelta !== 0) {
        await patch(`/news/${articleId}/react`, { type: 'LIKE', delta: likeDelta });
      }
      if (dislikeDelta !== 0) {
        await patch(`/news/${articleId}/react`, { type: 'DISLIKE', delta: dislikeDelta });
      }
    } catch {
      // Network failure: the on-device intent still reflects correctly, and
      // the server count will reconcile next time this article is refetched.
    }

    return { likeDelta, dislikeDelta };
  },
}));
