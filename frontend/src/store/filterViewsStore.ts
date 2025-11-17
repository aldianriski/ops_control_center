import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface FilterView {
  id: string;
  name: string;
  description?: string;
  page: 'infraops' | 'secops' | 'finops' | 'reports' | 'admin';
  filters: Record<string, any>;
  isShared: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface FilterViewsState {
  views: FilterView[];
  activeViewId: string | null;

  // Actions
  addView: (view: Omit<FilterView, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateView: (id: string, updates: Partial<Omit<FilterView, 'id'>>) => void;
  deleteView: (id: string) => void;
  setActiveView: (id: string | null) => void;
  getViewsByPage: (page: FilterView['page']) => FilterView[];
  duplicateView: (id: string, newName: string) => void;
}

const useFilterViewsStore = create<FilterViewsState>()(
  persist(
    (set, get) => ({
      views: [],
      activeViewId: null,

      addView: (view) => {
        const newView: FilterView = {
          ...view,
          id: `fv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({
          views: [...state.views, newView],
        }));
      },

      updateView: (id, updates) => {
        set((state) => ({
          views: state.views.map((view) =>
            view.id === id
              ? { ...view, ...updates, updatedAt: new Date().toISOString() }
              : view
          ),
        }));
      },

      deleteView: (id) => {
        set((state) => ({
          views: state.views.filter((view) => view.id !== id),
          activeViewId: state.activeViewId === id ? null : state.activeViewId,
        }));
      },

      setActiveView: (id) => {
        set({ activeViewId: id });
      },

      getViewsByPage: (page) => {
        return get().views.filter((view) => view.page === page);
      },

      duplicateView: (id, newName) => {
        const view = get().views.find((v) => v.id === id);
        if (view) {
          get().addView({
            ...view,
            name: newName,
            isShared: false,
          });
        }
      },
    }),
    {
      name: 'filter-views-storage',
    }
  )
);

export default useFilterViewsStore;
