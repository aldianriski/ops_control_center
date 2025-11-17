import { useQuery } from '@tanstack/react-query';
import { useAppStore } from '../store/appStore';
import { assetsApi } from '../api/extended';
import { useState } from 'react';
import SkeletonLoader from '../components/SkeletonLoader';
import { Server, Shield, AlertTriangle } from 'lucide-react';

const SecOps = () => {
  const { selectedEnvironment } = useAppStore();
  const [activeTab, setActiveTab] = useState<'vulnerabilities' | 'assets' | 'incidents'>('assets');

  const { data: assets, isLoading } = useQuery({
    queryKey: ['assets', selectedEnvironment],
    queryFn: () => assetsApi.getAssets({ environment: selectedEnvironment }),
    enabled: activeTab === 'assets',
  });

  const tabs = [
    { id: 'assets' as const, label: 'Asset Inventory', icon: Server },
    { id: 'vulnerabilities' as const, label: 'Vulnerabilities', icon: AlertTriangle },
    { id: 'incidents' as const, label: 'Security Incidents', icon: Shield },
  ];

  const riskColors: Record<string, string> = {
    critical: 'bg-red-100 text-red-800',
    high: 'bg-orange-100 text-orange-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-green-100 text-green-800',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Security Operations</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage assets, vulnerabilities, and security incidents
        </p>
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
                  {assets?.map((asset: any) => (
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
          )}

          {activeTab === 'vulnerabilities' && (
            <div className="p-6 text-center text-gray-500">
              Vulnerabilities view - Integration with security scanning tools
            </div>
          )}

          {activeTab === 'incidents' && (
            <div className="p-6 text-center text-gray-500">
              Security incidents view - Integrated with SIEM and threat intelligence
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SecOps;
