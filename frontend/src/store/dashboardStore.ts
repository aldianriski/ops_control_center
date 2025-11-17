import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type WidgetType =
  | 'kpi-card'
  | 'line-chart'
  | 'bar-chart'
  | 'pie-chart'
  | 'table'
  | 'metric-gauge'
  | 'heatmap'
  | 'recent-incidents'
  | 'cost-breakdown'
  | 'sla-status';

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  dataSource: string; // API endpoint or data source
  refreshInterval?: number; // in seconds
  config: Record<string, any>; // Widget-specific configuration
}

export interface DashboardLayout {
  i: string; // widget id
  x: number;
  y: number;
  w: number; // width (grid units)
  h: number; // height (grid units)
  minW?: number;
  minH?: number;
}

export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  widgets: WidgetConfig[];
  layout: DashboardLayout[];
  createdAt: string;
  updatedAt: string;
}

interface DashboardState {
  dashboards: Dashboard[];
  activeDashboardId: string | null;
  isEditMode: boolean;

  // Actions
  addDashboard: (dashboard: Omit<Dashboard, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateDashboard: (id: string, updates: Partial<Omit<Dashboard, 'id'>>) => void;
  deleteDashboard: (id: string) => void;
  setActiveDashboard: (id: string) => void;
  setEditMode: (enabled: boolean) => void;

  // Widget actions
  addWidget: (dashboardId: string, widget: Omit<WidgetConfig, 'id'>, layout: Omit<DashboardLayout, 'i'>) => void;
  updateWidget: (dashboardId: string, widgetId: string, updates: Partial<WidgetConfig>) => void;
  removeWidget: (dashboardId: string, widgetId: string) => void;
  updateLayout: (dashboardId: string, layout: DashboardLayout[]) => void;

  // Helpers
  getActiveDashboard: () => Dashboard | undefined;
  getDefaultDashboard: () => Dashboard | undefined;
}

const useDashboardStore = create<DashboardState>()(
  persist(
    (set, get) => ({
      dashboards: [],
      activeDashboardId: null,
      isEditMode: false,

      addDashboard: (dashboard) => {
        const newDashboard: Dashboard = {
          ...dashboard,
          id: `dash_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          dashboards: [...state.dashboards, newDashboard],
          activeDashboardId: newDashboard.id,
        }));

        return newDashboard.id;
      },

      updateDashboard: (id, updates) => {
        set((state) => ({
          dashboards: state.dashboards.map((dash) =>
            dash.id === id
              ? { ...dash, ...updates, updatedAt: new Date().toISOString() }
              : dash
          ),
        }));
      },

      deleteDashboard: (id) => {
        set((state) => ({
          dashboards: state.dashboards.filter((dash) => dash.id !== id),
          activeDashboardId: state.activeDashboardId === id ? null : state.activeDashboardId,
        }));
      },

      setActiveDashboard: (id) => {
        set({ activeDashboardId: id });
      },

      setEditMode: (enabled) => {
        set({ isEditMode: enabled });
      },

      addWidget: (dashboardId, widget, layout) => {
        const widgetId = `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newWidget: WidgetConfig = { ...widget, id: widgetId };
        const newLayout: DashboardLayout = { ...layout, i: widgetId };

        set((state) => ({
          dashboards: state.dashboards.map((dash) =>
            dash.id === dashboardId
              ? {
                  ...dash,
                  widgets: [...dash.widgets, newWidget],
                  layout: [...dash.layout, newLayout],
                  updatedAt: new Date().toISOString(),
                }
              : dash
          ),
        }));
      },

      updateWidget: (dashboardId, widgetId, updates) => {
        set((state) => ({
          dashboards: state.dashboards.map((dash) =>
            dash.id === dashboardId
              ? {
                  ...dash,
                  widgets: dash.widgets.map((w) =>
                    w.id === widgetId ? { ...w, ...updates } : w
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : dash
          ),
        }));
      },

      removeWidget: (dashboardId, widgetId) => {
        set((state) => ({
          dashboards: state.dashboards.map((dash) =>
            dash.id === dashboardId
              ? {
                  ...dash,
                  widgets: dash.widgets.filter((w) => w.id !== widgetId),
                  layout: dash.layout.filter((l) => l.i !== widgetId),
                  updatedAt: new Date().toISOString(),
                }
              : dash
          ),
        }));
      },

      updateLayout: (dashboardId, layout) => {
        set((state) => ({
          dashboards: state.dashboards.map((dash) =>
            dash.id === dashboardId
              ? { ...dash, layout, updatedAt: new Date().toISOString() }
              : dash
          ),
        }));
      },

      getActiveDashboard: () => {
        const state = get();
        return state.dashboards.find((d) => d.id === state.activeDashboardId);
      },

      getDefaultDashboard: () => {
        return get().dashboards.find((d) => d.isDefault);
      },
    }),
    {
      name: 'dashboard-storage',
    }
  )
);

export default useDashboardStore;
