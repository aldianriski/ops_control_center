import apiClient from './client';

// Timeline API
export const timelineApi = {
  getEvents: async (filters?: Record<string, string>) => {
    const { data } = await apiClient.get('/timeline', { params: filters });
    return data.data;
  },
};

// Evidence API
export const evidenceApi = {
  getByIncident: async (incidentId: string) => {
    const { data } = await apiClient.get(`/evidence/incident/${incidentId}`);
    return data.data;
  },
  create: async (incidentId: string, evidence: any) => {
    const { data } = await apiClient.post(`/evidence/incident/${incidentId}`, evidence);
    return data.data;
  },
  getMetrics: async (filters?: Record<string, string>) => {
    const { data } = await apiClient.get('/evidence/metrics', { params: filters });
    return data.data;
  },
};

// Assets API
export const assetsApi = {
  getAssets: async (filters?: Record<string, string>) => {
    const { data } = await apiClient.get('/assets', { params: filters });
    return data.data;
  },
  create: async (asset: any) => {
    const { data } = await apiClient.post('/assets', asset);
    return data.data;
  },
  update: async (id: string, asset: any) => {
    const { data } = await apiClient.put(`/assets/${id}`, asset);
    return data.data;
  },
};

// Recommendations API
export const recommendationsApi = {
  getRecommendations: async (filters?: Record<string, string>) => {
    const { data } = await apiClient.get('/recommendations', { params: filters });
    return data.data;
  },
  updateStatus: async (id: string, status: string) => {
    const { data } = await apiClient.patch(`/recommendations/${id}/status`, { status });
    return data.data;
  },
};

// AIOps API
export const aiopsApi = {
  getDailySummary: async (environment?: string) => {
    const { data } = await apiClient.get('/aiops/daily-summary', { params: { environment } });
    return data.data;
  },
  getWeeklySummary: async (environment?: string) => {
    const { data } = await apiClient.get('/aiops/weekly-summary', { params: { environment } });
    return data.data;
  },
  generateRCA: async (incidentId: string) => {
    const { data } = await apiClient.post(`/aiops/rca/${incidentId}`);
    return data.data;
  },
  explainCostAnomaly: async (payload: any) => {
    const { data } = await apiClient.post('/aiops/explain-cost-anomaly', payload);
    return data.data;
  },
  correlateIncidents: async (filters?: Record<string, string>) => {
    const { data } = await apiClient.get('/aiops/correlate-incidents', { params: filters });
    return data.data;
  },
};

// SOP Execution API
export const sopExecutionApi = {
  getExecutions: async (filters?: Record<string, string>) => {
    const { data } = await apiClient.get('/sop-executions', { params: filters });
    return data.data;
  },
  start: async (sopId: string, environment: string) => {
    const { data } = await apiClient.post('/sop-executions', { sop_id: sopId, environment });
    return data.data;
  },
  update: async (id: string, updates: any) => {
    const { data } = await apiClient.put(`/sop-executions/${id}`, updates);
    return data.data;
  },
};

// Admin Extended API
export const adminExtendedApi = {
  // Environments & Teams
  getEnvironments: async () => {
    const { data } = await apiClient.get('/admin-extended/environments');
    return data.data;
  },
  getTeams: async () => {
    const { data } = await apiClient.get('/admin-extended/teams');
    return data.data;
  },

  // API Tokens
  getAPITokens: async () => {
    const { data } = await apiClient.get('/admin-extended/api-tokens');
    return data.data;
  },
  createAPIToken: async (token: any) => {
    const { data } = await apiClient.post('/admin-extended/api-tokens', token);
    return data.data;
  },
  revokeAPIToken: async (id: string) => {
    const { data } = await apiClient.delete(`/admin-extended/api-tokens/${id}`);
    return data;
  },

  // Alert Thresholds
  getAlertThresholds: async (filters?: Record<string, string>) => {
    const { data } = await apiClient.get('/admin-extended/alert-thresholds', { params: filters });
    return data.data;
  },
  createAlertThreshold: async (threshold: any) => {
    const { data } = await apiClient.post('/admin-extended/alert-thresholds', threshold);
    return data.data;
  },
  updateAlertThreshold: async (id: string, threshold: any) => {
    const { data } = await apiClient.put(`/admin-extended/alert-thresholds/${id}`, threshold);
    return data.data;
  },

  // Report Templates
  getReportTemplates: async (filters?: Record<string, string>) => {
    const { data } = await apiClient.get('/admin/report-templates', { params: filters });
    return data.data;
  },
  createReportTemplate: async (template: any) => {
    const { data} = await apiClient.post('/admin/report-templates', template);
    return data.data;
  },
  updateReportTemplate: async (id: string, template: any) => {
    const { data } = await apiClient.put(`/admin/report-templates/${id}`, template);
    return data.data;
  },
  deleteReportTemplate: async (id: string) => {
    const { data } = await apiClient.delete(`/admin/report-templates/${id}`);
    return data;
  },
  deleteAPIToken: async (id: string) => {
    const { data } = await apiClient.delete(`/admin/api-tokens/${id}`);
    return data;
  },
  deleteAlertThreshold: async (id: string) => {
    const { data } = await apiClient.delete(`/admin/alert-thresholds/${id}`);
    return data;
  },
};

// Audit Logs API
export const auditLogsApi = {
  getLogs: async (filters?: Record<string, string>) => {
    const { data } = await apiClient.get('/admin/audit-logs', { params: filters });
    return data.data;
  },
  getLogById: async (id: string) => {
    const { data } = await apiClient.get(`/admin/audit-logs/${id}`);
    return data.data;
  },
};

// RBAC API
export const rbacApi = {
  // Roles
  getRoles: async () => {
    const { data } = await apiClient.get('/admin/rbac/roles');
    return data.data;
  },
  getRoleById: async (id: string) => {
    const { data } = await apiClient.get(`/admin/rbac/roles/${id}`);
    return data.data;
  },
  createRole: async (role: any) => {
    const { data } = await apiClient.post('/admin/rbac/roles', role);
    return data.data;
  },
  updateRole: async (id: string, updates: any) => {
    const { data } = await apiClient.put(`/admin/rbac/roles/${id}`, updates);
    return data.data;
  },
  deleteRole: async (id: string) => {
    const { data } = await apiClient.delete(`/admin/rbac/roles/${id}`);
    return data;
  },

  // Permissions
  getPermissions: async () => {
    const { data } = await apiClient.get('/admin/rbac/permissions');
    return data.data;
  },

  // Users
  getUsers: async (filters?: Record<string, string>) => {
    const { data } = await apiClient.get('/admin/rbac/users', { params: filters });
    return data.data;
  },
  updateUserRole: async (userId: string, roleId: string) => {
    const { data } = await apiClient.patch(`/admin/rbac/users/${userId}/role`, { role_id: roleId });
    return data.data;
  },
  updateUserStatus: async (userId: string, status: string) => {
    const { data } = await apiClient.patch(`/admin/rbac/users/${userId}/status`, { status });
    return data.data;
  },
};
