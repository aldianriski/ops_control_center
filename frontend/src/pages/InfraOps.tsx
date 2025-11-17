import { useQuery } from '@tanstack/react-query';
import { infraApi } from '../api';
import EvidencePanel from '../components/EvidencePanel';
import InfrastructureMetrics from '../components/InfrastructureMetrics';
import { FileText, BarChart3 } from 'lucide-react';
import { useState } from 'react';

const InfraOps = () => {
  const [activeTab, setActiveTab] = useState<'incidents' | 'tasks' | 'sla' | 'metrics'>('incidents');
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [isEvidencePanelOpen, setIsEvidencePanelOpen] = useState(false);

  const { data: incidents } = useQuery({
    queryKey: ['incidents'],
    queryFn: () => infraApi.getIncidents(),
    enabled: activeTab === 'incidents',
  });

  const handleViewEvidence = (incidentId: string) => {
    setSelectedIncidentId(incidentId);
    setIsEvidencePanelOpen(true);
  };

  const { data: tasks } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => infraApi.getTasks(),
    enabled: activeTab === 'tasks',
  });

  const { data: slaMetrics } = useQuery({
    queryKey: ['sla-metrics'],
    queryFn: () => infraApi.getSLAMetrics(12),
    enabled: activeTab === 'sla',
  });

  const tabs = [
    { id: 'incidents' as const, label: 'Incidents', icon: FileText },
    { id: 'tasks' as const, label: 'Tasks', icon: FileText },
    { id: 'sla' as const, label: 'SLA Metrics', icon: BarChart3 },
    { id: 'metrics' as const, label: 'Infrastructure Metrics', icon: BarChart3 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">InfraOps</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage incidents, tasks, and track SLA performance
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow">
        {activeTab === 'incidents' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jira ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Severity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Squad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {incidents?.map((incident) => (
                  <tr key={incident.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {incident.jira_id}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {incident.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          incident.severity === 'critical'
                            ? 'bg-red-100 text-red-800'
                            : incident.severity === 'high'
                            ? 'bg-orange-100 text-orange-800'
                            : incident.severity === 'medium'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {incident.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {incident.status}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {incident.squad}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleViewEvidence(incident.id)}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium"
                      >
                        <FileText size={16} />
                        Evidence
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jira ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Squad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assignee
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tasks?.map((task) => (
                  <tr key={task.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {task.jira_id}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {task.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {task.status}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {task.squad}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {task.assignee || 'Unassigned'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'sla' && (
          <div className="p-6">
            <div className="space-y-4">
              {slaMetrics?.map((metric) => (
                <div key={metric.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Week of {new Date(metric.week_start).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {metric.total_delivered_hours}h / {metric.total_requested_hours}h delivered
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-2xl font-bold ${
                        metric.sla_percentage >= 95
                          ? 'text-green-600'
                          : metric.sla_percentage >= 90
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      }`}
                    >
                      {metric.sla_percentage.toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'metrics' && (
          <div className="p-6">
            <InfrastructureMetrics />
          </div>
        )}
      </div>

      {/* Evidence Panel */}
      {selectedIncidentId && (
        <EvidencePanel
          incidentId={selectedIncidentId}
          isOpen={isEvidencePanelOpen}
          onClose={() => {
            setIsEvidencePanelOpen(false);
            setSelectedIncidentId(null);
          }}
        />
      )}
    </div>
  );
};

export default InfraOps;
