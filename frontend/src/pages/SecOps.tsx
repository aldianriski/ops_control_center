import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { assetsApi } from '../api/extended';
import VulnerabilityCharts from '../components/VulnerabilityCharts';
import MitreAttackMapping from '../components/MitreAttackMapping';
import TableFilter from '../components/TableFilter';
import ConnectionStatusBadge from '../components/ConnectionStatusBadge';
import { exportToCSV } from '../utils/export';
import { useWebSocket, WebSocketMessage } from '../hooks/useWebSocket';
import { useState } from 'react';
import SkeletonLoader from '../components/SkeletonLoader';
import { Server, Shield, AlertTriangle, Target, Download } from 'lucide-react';
import toast from 'react-hot-toast';

const SecOps = () => {
  const queryClient = useQueryClient();
  const { selectedEnvironment } = useAppStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as 'vulnerabilities' | 'assets' | 'incidents' | 'mitre') || 'assets';
  const [filteredAssets, setFilteredAssets] = useState<any[]>([]);

  const setActiveTab = (tab: 'vulnerabilities' | 'assets' | 'incidents' | 'mitre') => {
    setSearchParams({ tab });
  };

  // Real-time updates via WebSocket
  useWebSocket({
    autoConnect: true,
    onMessage: (message: WebSocketMessage) => {
      if (message.type === 'asset') {
        queryClient.invalidateQueries({ queryKey: ['assets', selectedEnvironment] });
        toast.info(`Asset ${message.action}: ${message.data.hostname}`, { duration: 2000 });
      } else if (message.type === 'alert') {
        toast.warning(`Security Alert: ${message.data.metric}`, { duration: 3000 });
      }
    },
  });

  const { data: assets, isLoading } = useQuery({
    queryKey: ['assets', selectedEnvironment],
    queryFn: () => assetsApi.getAssets({ environment: selectedEnvironment }),
    enabled: activeTab === 'assets',
  });

  const tabs = [
    { id: 'assets' as const, label: 'Asset Inventory', icon: Server },
    { id: 'vulnerabilities' as const, label: 'Vulnerabilities', icon: AlertTriangle },
    { id: 'incidents' as const, label: 'Security Incidents', icon: Shield },
    { id: 'mitre' as const, label: 'MITRE ATT&CK', icon: Target },
  ];

  const riskColors: Record<string, string> = {
    critical: 'bg-red-100 text-red-800',
    high: 'bg-orange-100 text-orange-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-green-100 text-green-800',
  };

  const handleExport = () => {
    if (activeTab === 'assets') {
      if (assets && assets.length > 0) {
        exportToCSV(assets, `secops-assets-${selectedEnvironment}`, [
          'hostname',
          'asset_type',
          'ip_address',
          'risk_level',
          'owner',
          'environment',
        ]);
      } else {
        toast.error('No assets to export');
      }
    } else {
      toast.error('Export only available for Assets tab');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Security Operations</h1>
            <ConnectionStatusBadge />
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Manage assets, vulnerabilities, and security incidents
          </p>
        </div>
        {activeTab === 'assets' && (
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            <Download size={16} />
            Export to CSV
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {isLoading ? (
        <SkeletonLoader type="table" count={5} />
      ) : (
        <div className="bg-white rounded-lg shadow">
          {activeTab === 'assets' && (
            <div className="space-y-4">
              <div className="p-4 pb-0">
                <TableFilter
                  data={assets || []}
                  columns={[
                    { key: 'hostname', label: 'Hostname', filterable: false },
                    { key: 'asset_type', label: 'Type', filterable: true },
                    { key: 'ip_address', label: 'IP Address', filterable: false },
                    { key: 'risk_level', label: 'Risk Level', filterable: true },
                    { key: 'owner', label: 'Owner', filterable: true },
                  ]}
                  onFilteredDataChange={setFilteredAssets}
                  placeholder="Search assets..."
                />
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hostname
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      IP Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Risk Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Owner
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAssets.map((asset: any) => (
                    <tr key={asset.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {asset.hostname}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {asset.asset_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {asset.ip_address || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            riskColors[asset.risk_level] || 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {asset.risk_level}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {asset.owner || 'Unassigned'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          )}

          {activeTab === 'vulnerabilities' && (
            <div className="p-6">
              <VulnerabilityCharts />
            </div>
          )}

          {activeTab === 'incidents' && (
            <div className="p-6 text-center text-gray-500">
              Security incidents view - Integrated with SIEM and threat intelligence
            </div>
          )}

          {activeTab === 'mitre' && (
            <div className="p-6">
              <MitreAttackMapping />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SecOps;
