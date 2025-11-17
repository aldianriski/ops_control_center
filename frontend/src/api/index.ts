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
  // Incidents
  getIncidents: async (filters?: Record<string, string>) => {
    const { data } = await apiClient.get<{ success: boolean; data: Incident[] }>('/infra/incidents', { params: filters });
    return data.data;
  },
  getIncidentById: async (id: string) => {
    const { data } = await apiClient.get(`/infra/incidents/${id}`);
    return data.data;
  },
  createIncident: async (incident: any) => {
    const { data } = await apiClient.post('/infra/incidents', incident);
    return data.data;
  },
  updateIncident: async (id: string, updates: any) => {
    const { data } = await apiClient.patch(`/infra/incidents/${id}`, updates);
    return data.data;
  },

  // Evidence
  getIncidentEvidence: async (incidentId: string) => {
    const { data } = await apiClient.get(`/infra/incidents/${incidentId}/evidence`);
    return data.data;
  },
  uploadEvidence: async (incidentId: string, evidence: FormData) => {
    const { data } = await apiClient.post(`/infra/incidents/${incidentId}/evidence`, evidence, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data;
  },

  // Tasks
  getTasks: async (filters?: Record<string, string>) => {
    const { data } = await apiClient.get<{ success: boolean; data: Task[] }>('/infra/tasks', { params: filters });
    return data.data;
  },
  createTask: async (task: any) => {
    const { data } = await apiClient.post('/infra/tasks', task);
    return data.data;
  },
  updateTask: async (id: string, updates: any) => {
    const { data } = await apiClient.patch(`/infra/tasks/${id}`, updates);
    return data.data;
  },

  // Uptime & SLA
  getUptimeRequests: async (filters?: Record<string, string>) => {
    const { data } = await apiClient.get<{ success: boolean; data: UptimeRequest[] }>('/infra/uptime', { params: filters });
    return data.data;
  },
  getSLAMetrics: async (weeks?: number) => {
    const { data} = await apiClient.get<{ success: boolean; data: SLAMetric[] }>('/infra/sla-metrics', { params: { weeks } });
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
    const { data } = await apiClient.get<{ success: boolean; data: CostRecord[] }>('/finops/breakdown', { params: filters });
    return data.data;
  },
  getForecast: async (filters?: Record<string, string>) => {
    const { data } = await apiClient.get<{ success: boolean; data: CostForecast[] }>('/finops/forecast', { params: filters });
    return data.data;
  },
  getCloudCredits: async () => {
    const { data } = await apiClient.get('/finops/credits');
    return data.data;
  },
  getICSCredits: async () => {
    const { data } = await apiClient.get<{ success: boolean; data: ICSCredit }>('/finops/ics');
    return data.data;
  },
  getRecommendations: async () => {
    const { data } = await apiClient.get('/finops/recommendations');
    return data.data;
  },
};

// SOP API
export const sopApi = {
  getSOPs: async (filters?: Record<string, string>) => {
    const { data } = await apiClient.get<{ success: boolean; data: SOP[] }>('/sops', { params: filters });
    return data.data;
  },
  getSOPById: async (id: string) => {
    const { data } = await apiClient.get<{ success: boolean; data: SOP }>(`/sops/${id}`);
    return data.data;
  },
  createSOP: async (sop: Partial<SOP>) => {
    const { data } = await apiClient.post<{ success: boolean; data: SOP }>('/sops', sop);
    return data.data;
  },
  updateSOP: async (id: string, sop: Partial<SOP>) => {
    const { data } = await apiClient.put<{ success: boolean; data: SOP }>(`/sops/${id}`, sop);
    return data.data;
  },
  deleteSOP: async (id: string) => {
    const { data } = await apiClient.delete(`/sops/${id}`);
    return data;
  },
  executeSOP: async (id: string, params?: Record<string, any>) => {
    const { data } = await apiClient.post(`/sops/${id}/execute`, params);
    return data.data;
  },
  bulkImport: async (sops: any[]) => {
    const { data } = await apiClient.post('/sops/bulk-import', { sops });
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
  getReportVersions: async (reportId: string) => {
    const { data } = await apiClient.get(`/reports/${reportId}/versions`);
    return data.data;
  },
};

// SecOps API
export const secopsApi = {
  // Assets
  getAssets: async (environment?: string) => {
    const { data } = await apiClient.get('/secops/assets', { params: { environment } });
    return data.data;
  },
  createAsset: async (asset: any) => {
    const { data } = await apiClient.post('/secops/assets', asset);
    return data.data;
  },
  updateAsset: async (id: string, updates: any) => {
    const { data } = await apiClient.patch(`/secops/assets/${id}`, updates);
    return data.data;
  },
  deleteAsset: async (id: string) => {
    const { data } = await apiClient.delete(`/secops/assets/${id}`);
    return data;
  },

  // Vulnerabilities
  getVulnerabilities: async (filters?: Record<string, string>) => {
    const { data } = await apiClient.get('/secops/vulnerabilities', { params: filters });
    return data.data;
  },
  getVulnerabilityById: async (id: string) => {
    const { data } = await apiClient.get(`/secops/vulnerabilities/${id}`);
    return data.data;
  },
  updateVulnerability: async (id: string, updates: any) => {
    const { data } = await apiClient.patch(`/secops/vulnerabilities/${id}`, updates);
    return data.data;
  },

  // MITRE ATT&CK
  getMitreTactics: async () => {
    const { data } = await apiClient.get('/secops/mitre/tactics');
    return data.data;
  },
  getMitreTechniques: async (tacticId?: string) => {
    const { data } = await apiClient.get('/secops/mitre/techniques', { params: { tactic_id: tacticId } });
    return data.data;
  },
  getMitreDetections: async (filters?: Record<string, string>) => {
    const { data } = await apiClient.get('/secops/mitre/detections', { params: filters });
    return data.data;
  },
};

// Infrastructure Metrics API
export const metricsApi = {
  getInfrastructureMetrics: async (filters?: Record<string, string>) => {
    const { data } = await apiClient.get('/infra/metrics', { params: filters });
    return data.data;
  },
  getMetricTimeSeries: async (metricName: string, filters?: Record<string, string>) => {
    const { data } = await apiClient.get(`/infra/metrics/${metricName}/timeseries`, { params: filters });
    return data.data;
  },
};
