import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminExtendedApi } from '../api/extended';
import {
  Key,
  AlertTriangle,
  FileText,
  Plus,
  Trash2,
  Edit,
  Copy,
  CheckCircle,
  Settings,
} from 'lucide-react';
import { format } from 'date-fns';

interface APIToken {
  id: string;
  name: string;
  token: string;
  scopes: string[];
  created_by: string;
  created_at: string;
  last_used_at?: string;
  expires_at?: string;
}

interface AlertThreshold {
  id: string;
  metric_name: string;
  environment: string;
  threshold_value: number;
  operator: 'greater_than' | 'less_than' | 'equals';
  severity: 'critical' | 'high' | 'medium' | 'low';
  enabled: boolean;
}

interface ReportTemplate {
  id: string;
  name: string;
  report_type: 'weekly_ops' | 'monthly_finops' | 'custom';
  sections: string[];
  format: 'pdf' | 'markdown';
  recipients: string[];
  schedule_cron?: string;
}

const Admin = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'tokens' | 'thresholds' | 'templates'>('tokens');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // API Tokens
  const [newToken, setNewToken] = useState({ name: '', scopes: [] as string[] });
  const [editingToken, setEditingToken] = useState<APIToken | null>(null);

  // Alert Thresholds
  const [newThreshold, setNewThreshold] = useState({
    metric_name: '',
    environment: 'production',
    threshold_value: 0,
    operator: 'greater_than' as AlertThreshold['operator'],
    severity: 'high' as AlertThreshold['severity'],
  });

  // Report Templates
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    report_type: 'weekly_ops' as ReportTemplate['report_type'],
    sections: [] as string[],
    format: 'pdf' as ReportTemplate['format'],
    recipients: [] as string[],
  });

  // Queries
  const { data: tokens = [] } = useQuery({
    queryKey: ['api-tokens'],
    queryFn: adminExtendedApi.getAPITokens,
    enabled: activeTab === 'tokens',
  });

  const { data: thresholds = [] } = useQuery({
    queryKey: ['alert-thresholds'],
    queryFn: adminExtendedApi.getAlertThresholds,
    enabled: activeTab === 'thresholds',
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['report-templates'],
    queryFn: adminExtendedApi.getReportTemplates,
    enabled: activeTab === 'templates',
  });

  // Mutations
  const createTokenMutation = useMutation({
    mutationFn: adminExtendedApi.createAPIToken,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-tokens'] });
      setNewToken({ name: '', scopes: [] });
    },
  });

  const deleteTokenMutation = useMutation({
    mutationFn: adminExtendedApi.deleteAPIToken,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-tokens'] });
    },
  });

  const createThresholdMutation = useMutation({
    mutationFn: adminExtendedApi.createAlertThreshold,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-thresholds'] });
      setNewThreshold({
        metric_name: '',
        environment: 'production',
        threshold_value: 0,
        operator: 'greater_than',
        severity: 'high',
      });
    },
  });

  const updateThresholdMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<AlertThreshold> }) =>
      adminExtendedApi.updateAlertThreshold(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-thresholds'] });
    },
  });

  const deleteThresholdMutation = useMutation({
    mutationFn: adminExtendedApi.deleteAlertThreshold,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alert-thresholds'] });
    },
  });

  const createTemplateMutation = useMutation({
    mutationFn: adminExtendedApi.createReportTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-templates'] });
      setNewTemplate({
        name: '',
        report_type: 'weekly_ops',
        sections: [],
        format: 'pdf',
        recipients: [],
      });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: adminExtendedApi.deleteReportTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-templates'] });
    },
  });

  const handleCopyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const tabs = [
    { id: 'tokens' as const, label: 'API Tokens', icon: Key },
    { id: 'thresholds' as const, label: 'Alert Thresholds', icon: AlertTriangle },
    { id: 'templates' as const, label: 'Report Templates', icon: FileText },
  ];

  const severityColors: Record<AlertThreshold['severity'], string> = {
    critical: 'bg-red-100 text-red-800 border-red-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-green-100 text-green-800 border-green-200',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Settings size={28} />
          Administration
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage API tokens, alert thresholds, and report templates
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 bg-white rounded-t-lg">
        <nav className="-mb-px flex space-x-8 px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-b-lg shadow">
        {/* API Tokens Tab */}
        {activeTab === 'tokens' && (
          <div className="p-6 space-y-6">
            {/* Create Token Form */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Plus size={20} />
                Create New API Token
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Token Name</label>
                  <input
                    type="text"
                    value={newToken.name}
                    onChange={(e) => setNewToken({ ...newToken, name: e.target.value })}
                    placeholder="e.g., Production API Access"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Scopes (comma-separated)</label>
                  <input
                    type="text"
                    placeholder="read:incidents,write:sops"
                    onChange={(e) =>
                      setNewToken({ ...newToken, scopes: e.target.value.split(',').map((s) => s.trim()) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <button
                onClick={() => createTokenMutation.mutate(newToken)}
                disabled={!newToken.name || createTokenMutation.isPending}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {createTokenMutation.isPending ? 'Creating...' : 'Create Token'}
              </button>
            </div>

            {/* Tokens List */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Existing Tokens</h3>
              <div className="space-y-3">
                {tokens.map((token: APIToken) => (
                  <div key={token.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{token.name}</h4>
                        <div className="mt-2 flex items-center gap-2">
                          <code className="px-2 py-1 bg-gray-100 rounded text-xs font-mono text-gray-700">
                            {token.token.substring(0, 20)}...
                          </code>
                          <button
                            onClick={() => handleCopyToken(token.token)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            {copiedToken === token.token ? (
                              <CheckCircle size={16} className="text-green-600" />
                            ) : (
                              <Copy size={16} />
                            )}
                          </button>
                        </div>
                        <div className="mt-2 flex gap-2">
                          {token.scopes.map((scope) => (
                            <span key={scope} className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                              {scope}
                            </span>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Created {format(new Date(token.created_at), 'MMM dd, yyyy')} by {token.created_by}
                        </p>
                      </div>
                      <button
                        onClick={() => deleteTokenMutation.mutate(token.id)}
                        className="text-red-600 hover:text-red-700 p-2"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Alert Thresholds Tab */}
        {activeTab === 'thresholds' && (
          <div className="p-6 space-y-6">
            {/* Create Threshold Form */}
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-6 border border-orange-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Plus size={20} />
                Create Alert Threshold
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Metric Name</label>
                  <input
                    type="text"
                    value={newThreshold.metric_name}
                    onChange={(e) => setNewThreshold({ ...newThreshold, metric_name: e.target.value })}
                    placeholder="e.g., cpu_usage"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Environment</label>
                  <select
                    value={newThreshold.environment}
                    onChange={(e) => setNewThreshold({ ...newThreshold, environment: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="production">Production</option>
                    <option value="staging">Staging</option>
                    <option value="sandbox">Sandbox</option>
                    <option value="dev">Dev</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Threshold Value</label>
                  <input
                    type="number"
                    value={newThreshold.threshold_value}
                    onChange={(e) =>
                      setNewThreshold({ ...newThreshold, threshold_value: parseFloat(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Operator</label>
                  <select
                    value={newThreshold.operator}
                    onChange={(e) =>
                      setNewThreshold({ ...newThreshold, operator: e.target.value as AlertThreshold['operator'] })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="greater_than">Greater Than</option>
                    <option value="less_than">Less Than</option>
                    <option value="equals">Equals</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                  <select
                    value={newThreshold.severity}
                    onChange={(e) =>
                      setNewThreshold({ ...newThreshold, severity: e.target.value as AlertThreshold['severity'] })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
              <button
                onClick={() => createThresholdMutation.mutate(newThreshold)}
                disabled={!newThreshold.metric_name || createThresholdMutation.isPending}
                className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {createThresholdMutation.isPending ? 'Creating...' : 'Create Threshold'}
              </button>
            </div>

            {/* Thresholds List */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Alert Thresholds</h3>
              <div className="space-y-3">
                {thresholds.map((threshold: AlertThreshold) => (
                  <div key={threshold.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h4 className="font-medium text-gray-900">{threshold.metric_name}</h4>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${severityColors[threshold.severity]}`}>
                            {threshold.severity.toUpperCase()}
                          </span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                            {threshold.environment}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                          Alert when value is{' '}
                          <span className="font-medium">
                            {threshold.operator.replace('_', ' ')} {threshold.threshold_value}
                          </span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={threshold.enabled}
                            onChange={(e) =>
                              updateThresholdMutation.mutate({
                                id: threshold.id,
                                updates: { enabled: e.target.checked },
                              })
                            }
                            className="rounded"
                          />
                          <span className="text-sm text-gray-600">Enabled</span>
                        </label>
                        <button
                          onClick={() => deleteThresholdMutation.mutate(threshold.id)}
                          className="text-red-600 hover:text-red-700 p-2"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Report Templates Tab */}
        {activeTab === 'templates' && (
          <div className="p-6 space-y-6">
            {/* Create Template Form */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Plus size={20} />
                Create Report Template
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
                  <input
                    type="text"
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                    placeholder="e.g., Weekly Ops Report"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
                  <select
                    value={newTemplate.report_type}
                    onChange={(e) =>
                      setNewTemplate({ ...newTemplate, report_type: e.target.value as ReportTemplate['report_type'] })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="weekly_ops">Weekly Ops</option>
                    <option value="monthly_finops">Monthly FinOps</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
                  <select
                    value={newTemplate.format}
                    onChange={(e) => setNewTemplate({ ...newTemplate, format: e.target.value as ReportTemplate['format'] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="pdf">PDF</option>
                    <option value="markdown">Markdown</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Recipients (comma-separated emails)</label>
                  <input
                    type="text"
                    placeholder="user1@example.com, user2@example.com"
                    onChange={(e) =>
                      setNewTemplate({ ...newTemplate, recipients: e.target.value.split(',').map((s) => s.trim()) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
              <button
                onClick={() => createTemplateMutation.mutate(newTemplate)}
                disabled={!newTemplate.name || createTemplateMutation.isPending}
                className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {createTemplateMutation.isPending ? 'Creating...' : 'Create Template'}
              </button>
            </div>

            {/* Templates List */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Templates</h3>
              <div className="space-y-3">
                {templates.map((template: ReportTemplate) => (
                  <div key={template.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h4 className="font-medium text-gray-900">{template.name}</h4>
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                            {template.report_type}
                          </span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                            {template.format.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                          Recipients: {template.recipients.join(', ')}
                        </p>
                        {template.schedule_cron && (
                          <p className="text-xs text-gray-500 mt-1">Schedule: {template.schedule_cron}</p>
                        )}
                      </div>
                      <button
                        onClick={() => deleteTemplateMutation.mutate(template.id)}
                        className="text-red-600 hover:text-red-700 p-2"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
