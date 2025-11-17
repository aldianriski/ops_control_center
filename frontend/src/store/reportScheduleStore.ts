import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ReportType = 'weekly' | 'monthly' | 'custom';
export type ReportFormat = 'pdf' | 'markdown' | 'excel';
export type ScheduleFrequency = 'daily' | 'weekly' | 'monthly';

export interface ReportSchedule {
  id: string;
  name: string;
  description?: string;
  type: ReportType;
  format: ReportFormat;
  frequency: ScheduleFrequency;
  scheduleTime: string; // HH:MM format
  scheduleDays?: number[]; // 0-6 for weekly, 1-31 for monthly
  recipients: string[]; // Email addresses
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
  includeModules: {
    infraops: boolean;
    secops: boolean;
    finops: boolean;
    sops: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

interface ReportScheduleState {
  schedules: ReportSchedule[];

  // Actions
  addSchedule: (schedule: Omit<ReportSchedule, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateSchedule: (id: string, updates: Partial<Omit<ReportSchedule, 'id'>>) => void;
  deleteSchedule: (id: string) => void;
  toggleSchedule: (id: string) => void;
  getSchedule: (id: string) => ReportSchedule | undefined;
}

const useReportScheduleStore = create<ReportScheduleState>()(
  persist(
    (set, get) => ({
      schedules: [],

      addSchedule: (schedule) => {
        const newSchedule: ReportSchedule = {
          ...schedule,
          id: `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          schedules: [...state.schedules, newSchedule],
        }));
      },

      updateSchedule: (id, updates) => {
        set((state) => ({
          schedules: state.schedules.map((schedule) =>
            schedule.id === id
              ? { ...schedule, ...updates, updatedAt: new Date().toISOString() }
              : schedule
          ),
        }));
      },

      deleteSchedule: (id) => {
        set((state) => ({
          schedules: state.schedules.filter((schedule) => schedule.id !== id),
        }));
      },

      toggleSchedule: (id) => {
        set((state) => ({
          schedules: state.schedules.map((schedule) =>
            schedule.id === id
              ? { ...schedule, enabled: !schedule.enabled, updatedAt: new Date().toISOString() }
              : schedule
          ),
        }));
      },

      getSchedule: (id) => {
        return get().schedules.find((s) => s.id === id);
      },
    }),
    {
      name: 'report-schedule-storage',
    }
  )
);

export default useReportScheduleStore;
