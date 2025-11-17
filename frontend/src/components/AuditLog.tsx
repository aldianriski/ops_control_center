import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import {
  History,
  User,
  Calendar,
  Filter,
  Download,
  FileText,
  Trash2,
  Edit,
  Plus,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';
import { exportToCSV } from '../utils/export';
import toast from 'react-hot-toast';

interface AuditLogEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  resource_type: string;
  resource_id: string;
  details: string;
  ip_address?: string;
  user_agent?: string;
  status: 'success' | 'failed';
}

const AuditLog = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Get filter params from URL
  const userFilter = searchParams.get('user') || '';
  const actionFilter = searchParams.get('action') || '';
  const resourceFilter = searchParams.get('resource') || '';
  const statusFilter = searchParams.get('status') || '';

  // Mock data - in production, this would come from API
  const { data: auditLogs = [], isLoading } = useQuery({
    queryKey: ['audit-logs', userFilter, actionFilter, resourceFilter, statusFilter],
    queryFn: async (): Promise<AuditLogEntry[]> => {
      await new Promise((resolve) => setTimeout(resolve, 500));

      const mockData: AuditLogEntry[] = [
        {
          id: '1',
          timestamp: '2025-01-17T10:30:00Z',
          user: 'john.doe@example.com',
          action: 'CREATE',
          resource_type: 'API_TOKEN',
          resource_id: 'token-123',
          details: 'Created new API token "Production Access"',
          ip_address: '192.168.1.100',
          user_agent: 'Mozilla/5.0',
          status: 'success',
        },
        {
          id: '2',
          timestamp: '2025-01-17T09:15:00Z',
          user: 'jane.smith@example.com',
          action: 'UPDATE',
          resource_type: 'ALERT_THRESHOLD',
          resource_id: 'threshold-456',
          details: 'Updated CPU threshold from 80% to 90%',
          ip_address: '192.168.1.101',
          user_agent: 'Mozilla/5.0',
          status: 'success',
        },
        {
          id: '3',
          timestamp: '2025-01-17T08:45:00Z',
          user: 'admin@example.com',
          action: 'DELETE',
          resource_type: 'USER',
          resource_id: 'user-789',
          details: 'Deleted user account',
          ip_address: '192.168.1.1',
          user_agent: 'Mozilla/5.0',
          status: 'success',
        },
        {
          id: '4',
          timestamp: '2025-01-17T07:30:00Z',
          user: 'test.user@example.com',
          action: 'LOGIN',
          resource_type: 'AUTH',
          resource_id: 'session-001',
          details: 'Failed login attempt',
          ip_address: '192.168.1.200',
          user_agent: 'Mozilla/5.0',
          status: 'failed',
        },
        {
          id: '5',
          timestamp: '2025-01-17T06:00:00Z',
          user: 'system',
          action: 'GENERATE',
          resource_type: 'REPORT',
          resource_id: 'report-weekly-001',
          details: 'Generated weekly operations report',
          ip_address: 'internal',
          user_agent: 'System',
          status: 'success',
        },
        {
          id: '6',
          timestamp: '2025-01-16T18:20:00Z',
          user: 'john.doe@example.com',
          action: 'UPDATE',
          resource_type: 'SOP',
          resource_id: 'sop-123',
          details: 'Updated SOP "Server Provisioning" steps',
          ip_address: '192.168.1.100',
          user_agent: 'Mozilla/5.0',
          status: 'success',
        },
        {
          id: '7',
          timestamp: '2025-01-16T16:00:00Z',
          user: 'jane.smith@example.com',
          action: 'CREATE',
          resource_type: 'INCIDENT',
          resource_id: 'incident-789',
          details: 'Created incident "Database connection timeout"',
          ip_address: '192.168.1.101',
          user_agent: 'Mozilla/5.0',
          status: 'success',
        },
      ];

      // Apply filters
      let filtered = mockData;
      if (userFilter) {
        filtered = filtered.filter((log) => log.user.includes(userFilter));
      }
      if (actionFilter) {
        filtered = filtered.filter((log) => log.action === actionFilter);
      }
      if (resourceFilter) {
        filtered = filtered.filter((log) => log.resource_type === resourceFilter);
      }
      if (statusFilter) {
        filtered = filtered.filter((log) => log.status === statusFilter);
      }

      return filtered;
    },
  });

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    setSearchParams(params);
  };

  const clearAllFilters = () => {
    setSearchParams({});
  };

  const handleExport = () => {
    if (auditLogs.length > 0) {
      exportToCSV(auditLogs, 'audit-logs', [
        'timestamp',
        'user',
        'action',
        'resource_type',
        'resource_id',
        'details',
        'status',
      ]);
    } else {
      toast.error('No audit logs to export');
    }
  };

  const handleViewDetails = (entry: AuditLogEntry) => {
    setSelectedEntry(entry);
    setShowDetails(true);
  };

  const actionIcons: Record<string, JSX.Element> = {
    CREATE: <Plus size={16} className="text-green-600" />,
    UPDATE: <Edit size={16} className="text-blue-600" />,
    DELETE: <Trash2 size={16} className="text-red-600" />,
    LOGIN: <User size={16} className="text-purple-600" />,
    GENERATE: <FileText size={16} className="text-orange-600" />,
    VIEW: <Eye size={16} className="text-gray-600" />,
  };

  const actionColors: Record<string, string> = {
    CREATE: 'bg-green-100 text-green-800 border-green-200',
    UPDATE: 'bg-blue-100 text-blue-800 border-blue-200',
    DELETE: 'bg-red-100 text-red-800 border-red-200',
    LOGIN: 'bg-purple-100 text-purple-800 border-purple-200',
    GENERATE: 'bg-orange-100 text-orange-800 border-orange-200',
    VIEW: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  const statusColors: Record<string, string> = {
    success: 'text-green-600',
    failed: 'text-red-600',
  };

  const activeFilterCount = [userFilter, actionFilter, resourceFilter, statusFilter].filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <History size={28} className="text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Audit Logs</h2>
            <p className="text-sm text-gray-600 mt-1">
              Track user actions and system changes
            </p>
          </div>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          <Download size={16} />
          Export to CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-600" />
            <span className="font-medium text-gray-900">Filters</span>
            {activeFilterCount > 0 && (
              <span className="px-2 py-0.5 bg-blue-600 text-white text-xs font-semibold rounded-full">
                {activeFilterCount}
              </span>
            )}
          </div>
          {activeFilterCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear All
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
            <input
              type="text"
              placeholder="Filter by user..."
              value={userFilter}
              onChange={(e) => handleFilterChange('user', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
            <select
              value={actionFilter}
              onChange={(e) => handleFilterChange('action', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Actions</option>
              <option value="CREATE">Create</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Delete</option>
              <option value="LOGIN">Login</option>
              <option value="GENERATE">Generate</option>
              <option value="VIEW">View</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Resource Type</label>
            <select
              value={resourceFilter}
              onChange={(e) => handleFilterChange('resource', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Resources</option>
              <option value="API_TOKEN">API Token</option>
              <option value="ALERT_THRESHOLD">Alert Threshold</option>
              <option value="USER">User</option>
              <option value="AUTH">Authentication</option>
              <option value="REPORT">Report</option>
              <option value="SOP">SOP</option>
              <option value="INCIDENT">Incident</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            <p className="mt-2 text-sm text-gray-600">Loading audit logs...</p>
          </div>
        ) : auditLogs.length === 0 ? (
          <div className="p-12 text-center">
            <History size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">No audit logs found</p>
            {activeFilterCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="mt-2 text-sm text-blue-600 hover:text-blue-700"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Resource
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-gray-400" />
                        {format(new Date(log.timestamp), 'MMM dd, HH:mm')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        <User size={14} className="text-gray-400" />
                        {log.user}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full border ${
                          actionColors[log.action] || 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {actionIcons[log.action]}
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex flex-col">
                        <span className="font-medium">{log.resource_type}</span>
                        <span className="text-xs text-gray-500">{log.resource_id}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-md truncate">
                      {log.details}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${statusColors[log.status]}`}>
                        {log.status === 'success' ? '✓ Success' : '✗ Failed'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleViewDetails(log)}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetails && selectedEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Audit Log Details</h3>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 uppercase">Timestamp</label>
                <p className="mt-1 text-gray-900">
                  {format(new Date(selectedEntry.timestamp), 'MMMM dd, yyyy HH:mm:ss')}
                </p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 uppercase">User</label>
                <p className="mt-1 text-gray-900">{selectedEntry.user}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 uppercase">Action</label>
                <p className="mt-1">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full border ${
                      actionColors[selectedEntry.action]
                    }`}
                  >
                    {actionIcons[selectedEntry.action]}
                    {selectedEntry.action}
                  </span>
                </p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 uppercase">Resource</label>
                <p className="mt-1 text-gray-900">
                  {selectedEntry.resource_type} ({selectedEntry.resource_id})
                </p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 uppercase">Details</label>
                <p className="mt-1 text-gray-900">{selectedEntry.details}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 uppercase">IP Address</label>
                <p className="mt-1 text-gray-900">{selectedEntry.ip_address || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 uppercase">User Agent</label>
                <p className="mt-1 text-gray-900 text-sm break-words">{selectedEntry.user_agent || 'N/A'}</p>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 uppercase">Status</label>
                <p className={`mt-1 font-medium ${statusColors[selectedEntry.status]}`}>
                  {selectedEntry.status === 'success' ? '✓ Success' : '✗ Failed'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLog;
