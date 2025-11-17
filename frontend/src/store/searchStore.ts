import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type SearchResultType = 'incident' | 'task' | 'asset' | 'sop' | 'report' | 'page';

export interface SearchResult {
  id: string;
  type: SearchResultType;
  title: string;
  description?: string;
  url: string;
  metadata?: Record<string, any>;
}

export interface RecentSearch {
  id: string;
  query: string;
  timestamp: string;
}

export interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  action: () => void;
  shortcut?: string;
}

interface SearchState {
  isOpen: boolean;
  query: string;
  recentSearches: RecentSearch[];
  recentItems: SearchResult[];

  // Actions
  setOpen: (open: boolean) => void;
  setQuery: (query: string) => void;
  addRecentSearch: (query: string) => void;
  addRecentItem: (item: SearchResult) => void;
  clearRecentSearches: () => void;
  clearRecentItems: () => void;
}

const useSearchStore = create<SearchState>()(
  persist(
    (set) => ({
      isOpen: false,
      query: '',
      recentSearches: [],
      recentItems: [],

      setOpen: (open) => set({ isOpen: open, query: open ? '' : '' }),

      setQuery: (query) => set({ query }),

      addRecentSearch: (query) => {
        if (!query.trim()) return;

        set((state) => {
          const newSearch: RecentSearch = {
            id: `search_${Date.now()}`,
            query: query.trim(),
            timestamp: new Date().toISOString(),
          };

          // Remove duplicate queries and keep only last 10
          const filtered = state.recentSearches.filter((s) => s.query !== query.trim());
          return {
            recentSearches: [newSearch, ...filtered].slice(0, 10),
          };
        });
      },

      addRecentItem: (item) => {
        set((state) => {
          // Remove duplicate items and keep only last 20
          const filtered = state.recentItems.filter((i) => i.id !== item.id);
          return {
            recentItems: [item, ...filtered].slice(0, 20),
          };
        });
      },

      clearRecentSearches: () => set({ recentSearches: [] }),

      clearRecentItems: () => set({ recentItems: [] }),
    }),
    {
      name: 'search-storage',
      partialize: (state) => ({
        recentSearches: state.recentSearches,
        recentItems: state.recentItems,
      }),
    }
  )
);

export default useSearchStore;
