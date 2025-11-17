import apiClient from './client';
import type {
  User,
  DashboardSummary,
  Incident,
  Task,
  UptimeRequest,
  SLAMetric,
  FinOpsSummary,
  CostRecord,
  CostForecast,
  ICSCredit,
  SOP,
  Report,
} from '../types';

// Auth API
export const authApi = {
  login: async (email: string, password: string) => {
    const { data } = await apiClient.post('/auth/login', { email, password });
    return data;
  },
  register: async (email: string, password: string, name: string) => {
    const { data } = await apiClient.post('/auth/register', { email, password, name });
    return data;
  },
  me: async () => {
    const { data } = await apiClient.get('/auth/me');
    return data.data.user as User;
  },
};

// Dashboard API
export const dashboardApi = {
  getSummary: async () => {
    const { data } = await apiClient.get<{ success: boolean; data: DashboardSummary }>('/dashboard/summary');
    return data.data;
  },
};

// InfraOps API
export const infraApi = {
  getIncidents: async (filters?: Record<string, string>) => {
    const { data } = await apiClient.get<{ success: boolean; data: Incident[] }>('/infra/incidents', { params: filters });
    return data.data;
  },
  getTasks: async (filters?: Record<string, string>) => {
    const { data } = await apiClient.get<{ success: boolean; data: Task[] }>('/infra/tasks', { params: filters });
    return data.data;
  },
  getUptimeRequests: async (filters?: Record<string, string>) => {
    const { data } = await apiClient.get<{ success: boolean; data: UptimeRequest[] }>('/infra/uptime', { params: filters });
    return data.data;
  },
  getSLAMetrics: async (weeks?: number) => {
    const { data } = await apiClient.get<{ success: boolean; data: SLAMetric[] }>('/infra/sla', { params: { weeks } });
    return data.data;
  },
};

// FinOps API
export const finopsApi = {
  getSummary: async () => {
    const { data } = await apiClient.get<{ success: boolean; data: FinOpsSummary }>('/finops/summary');
    return data.data;
  },
  getCostBreakdown: async (filters?: Record<string, string>) => {
    const { data } = await apiClient.get<{ success: boolean; data: CostRecord[] }>('/finops/costs', { params: filters });
    return data.data;
  },
  getForecast: async (filters?: Record<string, string>) => {
    const { data } = await apiClient.get<{ success: boolean; data: CostForecast[] }>('/finops/forecast', { params: filters });
    return data.data;
  },
  getICSCredits: async () => {
    const { data } = await apiClient.get<{ success: boolean; data: ICSCredit }>('/finops/ics');
    return data.data;
  },
};

// SOP API
export const sopApi = {
  getSOPs: async (filters?: Record<string, string>) => {
    const { data } = await apiClient.get<{ success: boolean; data: SOP[] }>('/sop', { params: filters });
    return data.data;
  },
  getSOPById: async (id: string) => {
    const { data } = await apiClient.get<{ success: boolean; data: SOP }>(`/sop/${id}`);
    return data.data;
  },
  createSOP: async (sop: Partial<SOP>) => {
    const { data } = await apiClient.post<{ success: boolean; data: SOP }>('/sop', sop);
    return data.data;
  },
  updateSOP: async (id: string, sop: Partial<SOP>) => {
    const { data } = await apiClient.put<{ success: boolean; data: SOP }>(`/sop/${id}`, sop);
    return data.data;
  },
};

// Reports API
export const reportsApi = {
  getReports: async (type?: string) => {
    const { data } = await apiClient.get<{ success: boolean; data: Report[] }>('/reports', { params: { type } });
    return data.data;
  },
  generateWeeklyReport: async (format: 'pdf' | 'markdown' = 'pdf') => {
    const { data } = await apiClient.post('/reports/weekly/generate', { format });
    return data;
  },
  generateMonthlyReport: async (format: 'pdf' | 'markdown' = 'pdf') => {
    const { data } = await apiClient.post('/reports/monthly/generate', { format });
    return data;
  },
  downloadReport: async (id: string) => {
    const { data } = await apiClient.get(`/reports/${id}/download`, { responseType: 'blob' });
    return data;
  },
};
