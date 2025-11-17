import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { infraApi } from '../api';
import EvidencePanel from '../components/EvidencePanel';
import InfrastructureMetrics from '../components/InfrastructureMetrics';
import TableFilter, { FilterState } from '../components/TableFilter';
import SavedFilterViews from '../components/SavedFilterViews';
import ConnectionStatusBadge from '../components/ConnectionStatusBadge';
import { exportToCSV } from '../utils/export';
import { useWebSocket, WebSocketMessage } from '../hooks/useWebSocket';
import { FileText, BarChart3, Download } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

const InfraOps = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as 'incidents' | 'tasks' | 'sla' | 'metrics') || 'incidents';
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [isEvidencePanelOpen, setIsEvidencePanelOpen] = useState(false);
  const [filteredIncidents, setFilteredIncidents] = useState<any[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<any[]>([]);
  const [incidentsFilterState, setIncidentsFilterState] = useState<FilterState>({ searchQuery: '', activeFilters: {} });
  const [tasksFilterState, setTasksFilterState] = useState<FilterState>({ searchQuery: '', activeFilters: {} });
  const [externalIncidentsFilter, setExternalIncidentsFilter] = useState<FilterState | null>(null);
  const [externalTasksFilter, setExternalTasksFilter] = useState<FilterState | null>(null);

  const setActiveTab = (tab: 'incidents' | 'tasks' | 'sla' | 'metrics') => {
    setSearchParams({ tab });
  };

  // Real-time updates via WebSocket
  useWebSocket({
    autoConnect: true,
    onMessage: (message: WebSocketMessage) => {
      if (message.type === 'incident') {
        queryClient.invalidateQueries({ queryKey: ['incidents'] });
        toast.success(`Incident ${message.action}: ${message.data.jira_id}`, { duration: 2000 });
      } else if (message.type === 'task') {
        queryClient.invalidateQueries({ queryKey: ['tasks'] });
        toast.info(`Task ${message.action}: ${message.data.jira_id}`, { duration: 2000 });
      }
    },
  });

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

  const handleExport = () => {
    switch (activeTab) {
      case 'incidents':
        if (incidents && incidents.length > 0) {
          exportToCSV(incidents, `infraops-incidents`, [
            'jira_id',
            'title',
            'severity',
            'status',
            'squad',
            'created_at',
          ]);
        } else {
          toast.error('No incidents to export');
        }
        break;
      case 'tasks':
        if (tasks && tasks.length > 0) {
          exportToCSV(tasks, `infraops-tasks`, [
            'jira_id',
            'title',
            'status',
            'squad',
            'assignee',
          ]);
        } else {
          toast.error('No tasks to export');
        }
        break;
      case 'sla':
        if (slaMetrics && slaMetrics.length > 0) {
          exportToCSV(slaMetrics, `infraops-sla-metrics`, [
            'week_start',
            'total_requested_hours',
            'total_delivered_hours',
            'sla_percentage',
          ]);
        } else {
          toast.error('No SLA metrics to export');
        }
        break;
      default:
        toast.error('Export not available for this tab');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">InfraOps</h1>
            <ConnectionStatusBadge />
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Manage incidents, tasks, and track SLA performance
          </p>
        </div>
        <div className="flex items-center gap-3">
          {(activeTab === 'incidents' || activeTab === 'tasks') && (
            <SavedFilterViews
              page="infraops"
              currentFilters={activeTab === 'incidents' ? incidentsFilterState : tasksFilterState}
              onLoadFilters={(filters) => {
                if (activeTab === 'incidents') {
                  setExternalIncidentsFilter(filters as FilterState);
                } else {
                  setExternalTasksFilter(filters as FilterState);
                }
              }}
            />
          )}
          {activeTab !== 'metrics' && (
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              <Download size={16} />
              Export to CSV
            </button>
          )}
        </div>
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
          <div className="space-y-4">
            <div className="p-4 pb-0">
              <TableFilter
                data={incidents || []}
                columns={[
                  { key: 'jira_id', label: 'Jira ID', filterable: false },
                  { key: 'title', label: 'Title', filterable: false },
                  { key: 'severity', label: 'Severity', filterable: true },
                  { key: 'status', label: 'Status', filterable: true },
                  { key: 'squad', label: 'Squad', filterable: true },
                ]}
                onFilteredDataChange={setFilteredIncidents}
                onFilterStateChange={setIncidentsFilterState}
                externalFilterState={externalIncidentsFilter}
                placeholder="Search incidents..."
              />
            </div>
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
                {filteredIncidents.map((incident) => (
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
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="space-y-4">
            <div className="p-4 pb-0">
              <TableFilter
                data={tasks || []}
                columns={[
                  { key: 'jira_id', label: 'Jira ID', filterable: false },
                  { key: 'title', label: 'Title', filterable: false },
                  { key: 'status', label: 'Status', filterable: true },
                  { key: 'squad', label: 'Squad', filterable: true },
                  { key: 'assignee', label: 'Assignee', filterable: true },
                ]}
                onFilteredDataChange={setFilteredTasks}
                onFilterStateChange={setTasksFilterState}
                externalFilterState={externalTasksFilter}
                placeholder="Search tasks..."
              />
            </div>
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
                {filteredTasks.map((task) => (
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
