import { create } from 'zustand';

export type ComparisonMetric = {
  label: string;
  key: string;
  format?: 'number' | 'currency' | 'percentage';
  unit?: string;
};

export type EnvironmentData = {
  environment: string;
  data: Record<string, any>;
};

interface ComparisonState {
  selectedEnvironments: string[];
  comparisonType: 'incidents' | 'costs' | 'assets' | 'sla';
  isComparisonMode: boolean;

  // Actions
  toggleEnvironment: (env: string) => void;
  setComparisonType: (type: ComparisonState['comparisonType']) => void;
  setComparisonMode: (enabled: boolean) => void;
  clearSelection: () => void;
}

const useComparisonStore = create<ComparisonState>((set) => ({
  selectedEnvironments: [],
  comparisonType: 'incidents',
  isComparisonMode: false,

  toggleEnvironment: (env) => {
    set((state) => {
      const isSelected = state.selectedEnvironments.includes(env);
      if (isSelected) {
        return {
          selectedEnvironments: state.selectedEnvironments.filter((e) => e !== env),
          isComparisonMode: state.selectedEnvironments.length > 2, // Keep comparison mode if still > 1 env
        };
      } else {
        const newSelection = [...state.selectedEnvironments, env];
        return {
          selectedEnvironments: newSelection,
          isComparisonMode: newSelection.length > 1,
        };
      }
    });
  },

  setComparisonType: (type) => set({ comparisonType: type }),

  setComparisonMode: (enabled) => {
    set({ isComparisonMode: enabled });
    if (!enabled) {
      set({ selectedEnvironments: [] });
    }
  },

  clearSelection: () => set({ selectedEnvironments: [], isComparisonMode: false }),
}));

export default useComparisonStore;
