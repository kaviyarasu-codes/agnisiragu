// src/store/views.store.ts
//
// Records a total-view for an article once per device, ever — same
// on-device-dedup, no-server-dedup pattern as reactions.store.ts (see that
// file's header comment). Admin-facing metric only (Article.viewCount);
// not shown anywhere in this app's UI.

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { patch } from '@/lib/api';

const STORAGE_KEY = 'article_views_recorded';
// Cap how many ids we remember on-device so AsyncStorage can't grow
// unbounded for a heavy reader — oldest views drop off first, which just
// means a very infrequent re-visit might count again; harmless for a
// coarse admin metric.
const MAX_TRACKED = 500;

interface ViewsStore {
  viewed: string[];
  hydrated: boolean;
  hydratePromise: Promise<void> | null;
  hydrate: () => Promise<void>;
  recordView: (articleId: string) => Promise<void>;
}

export const useViewsStore = create<ViewsStore>((set, get) => ({
  viewed: [],
  hydrated: false,
  hydratePromise: null,

  // Callers (SwipeFeed / ArticleDetailScreen) fire this once on mount, but
  // recordView also awaits it directly below — so even a view recorded in
  // the same render pass as the initial hydrate() call, before the
  // AsyncStorage read resolves, still waits for the real on-device state
  // instead of racing it (which would otherwise risk a duplicate PATCH for
  // an article already recorded on a previous app open).
  hydrate: () => {
    const existing = get().hydratePromise;
    if (existing) return existing;

    const promise = AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) set({ viewed: JSON.parse(raw) as string[] });
      })
      .catch(() => {})
      .finally(() => set({ hydrated: true }));

    set({ hydratePromise: promise });
    return promise;
  },

  recordView: async (articleId) => {
    if (!get().hydrated) await get().hydrate();

    const { viewed } = get();
    if (viewed.includes(articleId)) return;

    const next = [...viewed, articleId].slice(-MAX_TRACKED);
    set({ viewed: next });
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});

    patch(`/news/${articleId}/view`).catch(() => {
      // Network failure — worst case this device's view is undercounted
      // once; not worth retry complexity for a coarse admin metric.
    });
  },
}));
