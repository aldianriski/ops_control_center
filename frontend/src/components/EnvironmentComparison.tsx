import React from 'react';
import { useQuery } from '@tanstack/react-query';
import useComparisonStore, { ComparisonMetric } from '../store/comparisonStore';
import { infraApi, finopsApi } from '../api';
import { assetsApi } from '../api/extended';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  X,
  ArrowRightLeft,
} from 'lucide-react';

const EnvironmentComparison: React.FC = () => {
  const { selectedEnvironments, comparisonType, isComparisonMode, setComparisonMode, clearSelection, toggleEnvironment } = useComparisonStore();

  // Fetch data for each environment
  const { data: incidentsData } = useQuery({
    queryKey: ['incidents-comparison', selectedEnvironments],
    queryFn: async () => {
      const results = await Promise.all(
        selectedEnvironments.map(async (env) => {
          const incidents = await infraApi.getIncidents({ environment: env });
          return {
            environment: env,
            data: {
              total: incidents.length,
              critical: incidents.filter((i: any) => i.severity === 'critical').length,
              high: incidents.filter((i: any) => i.severity === 'high').length,
              open: incidents.filter((i: any) => i.status !== 'resolved').length,
            },
          };
        })
      );
      return results;
    },
    enabled: isComparisonMode && selectedEnvironments.length > 0 && comparisonType === 'incidents',
  });

  const { data: costsData } = useQuery({
    queryKey: ['costs-comparison', selectedEnvironments],
    queryFn: async () => {
      const results = await Promise.all(
        selectedEnvironments.map(async (env) => {
          const costs = await finopsApi.getCostBreakdown({ environment: env });
          const total = costs.reduce((sum: number, c: any) => sum + c.cost_usd, 0);
          const withCredits = costs.reduce((sum: number, c: any) => sum + (c.cost_usd - c.ics_credits_applied), 0);
          return {
            environment: env,
            data: {
              total_cost: total,
              net_cost: withCredits,
              records: costs.length,
              avg_daily: total / 30,
            },
          };
        })
      );
      return results;
    },
    enabled: isComparisonMode && selectedEnvironments.length > 0 && comparisonType === 'costs',
  });

  const { data: assetsData } = useQuery({
    queryKey: ['assets-comparison', selectedEnvironments],
    queryFn: async () => {
      const results = await Promise.all(
        selectedEnvironments.map(async (env) => {
          const assets = await assetsApi.getAssets({ environment: env });
          return {
            environment: env,
            data: {
              total: assets.length,
              high_risk: assets.filter((a: any) => a.risk_level === 'high' || a.risk_level === 'critical').length,
              servers: assets.filter((a: any) => a.asset_type === 'server').length,
              databases: assets.filter((a: any) => a.asset_type === 'database').length,
            },
          };
        })
      );
      return results;
    },
    enabled: isComparisonMode && selectedEnvironments.length > 0 && comparisonType === 'assets',
  });

  const { data: slaData } = useQuery({
    queryKey: ['sla-comparison', selectedEnvironments],
    queryFn: async () => {
      const results = await Promise.all(
        selectedEnvironments.map(async (env) => {
          const metrics = await infraApi.getSLAMetrics(4); // Last 4 weeks
          return {
            environment: env,
            data: {
              avg_sla: metrics.reduce((sum: number, m: any) => sum + m.sla_percentage, 0) / metrics.length,
              delivered_hours: metrics.reduce((sum: number, m: any) => sum + m.total_delivered_hours, 0),
              requested_hours: metrics.reduce((sum: number, m: any) => sum + m.total_requested_hours, 0),
            },
          };
        })
      );
      return results;
    },
    enabled: isComparisonMode && selectedEnvironments.length > 0 && comparisonType === 'sla',
  });

  if (!isComparisonMode || selectedEnvironments.length < 2) {
    return null;
  }

  const getMetrics = (): ComparisonMetric[] => {
    switch (comparisonType) {
      case 'incidents':
        return [
          { label: 'Total Incidents', key: 'total', format: 'number' },
          { label: 'Critical', key: 'critical', format: 'number' },
          { label: 'High Priority', key: 'high', format: 'number' },
          { label: 'Open', key: 'open', format: 'number' },
        ];
      case 'costs':
        return [
          { label: 'Total Cost', key: 'total_cost', format: 'currency' },
          { label: 'Net Cost', key: 'net_cost', format: 'currency' },
          { label: 'Cost Records', key: 'records', format: 'number' },
          { label: 'Avg Daily', key: 'avg_daily', format: 'currency' },
        ];
      case 'assets':
        return [
          { label: 'Total Assets', key: 'total', format: 'number' },
          { label: 'High Risk', key: 'high_risk', format: 'number' },
          { label: 'Servers', key: 'servers', format: 'number' },
          { label: 'Databases', key: 'databases', format: 'number' },
        ];
      case 'sla':
        return [
          { label: 'Avg SLA %', key: 'avg_sla', format: 'percentage' },
          { label: 'Delivered Hours', key: 'delivered_hours', format: 'number' },
          { label: 'Requested Hours', key: 'requested_hours', format: 'number' },
        ];
      default:
        return [];
    }
  };

  const getData = () => {
    switch (comparisonType) {
      case 'incidents':
        return incidentsData || [];
      case 'costs':
        return costsData || [];
      case 'assets':
        return assetsData || [];
      case 'sla':
        return slaData || [];
      default:
        return [];
    }
  };

  const formatValue = (value: number, format?: string) => {
    switch (format) {
      case 'currency':
        return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      case 'percentage':
        return `${value.toFixed(1)}%`;
      default:
        return value.toLocaleString();
    }
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <TrendingUp className="w-4 h-4 text-red-600" />;
    if (current < previous) return <TrendingDown className="w-4 h-4 text-green-600" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const metrics = getMetrics();
  const data = getData();

  return (
    <div className="fixed bottom-0 inset-x-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-2xl z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <ArrowRightLeft className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Environment Comparison
            </h3>
            <span className="px-2 py-1 text-xs font-medium bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 rounded-full">
              {selectedEnvironments.length} environments
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Comparison Type Selector */}
            <select
              value={comparisonType}
              onChange={(e) => useComparisonStore.getState().setComparisonType(e.target.value as any)}
              className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="incidents">Incidents</option>
              <option value="costs">Costs</option>
              <option value="assets">Assets</option>
              <option value="sla">SLA</option>
            </select>

            <button
              onClick={() => setComparisonMode(false)}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Close comparison"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-900">
                  Metric
                </th>
                {selectedEnvironments.map((env) => (
                  <th
                    key={env}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-900"
                  >
                    <div className="flex items-center justify-between">
                      <span>{env}</span>
                      <button
                        onClick={() => toggleEnvironment(env)}
                        className="ml-2 text-gray-400 hover:text-red-600 transition-colors"
                        title="Remove"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {metrics.map((metric) => (
                <tr key={metric.key} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                    {metric.label}
                  </td>
                  {data.map((envData: any, index: number) => {
                    const value = envData.data[metric.key] || 0;
                    const prevValue = index > 0 ? (data[index - 1].data[metric.key] || 0) : value;
                    const diff = value - prevValue;
                    const diffPercent = prevValue > 0 ? ((diff / prevValue) * 100).toFixed(1) : '0';

                    return (
                      <td key={envData.environment} className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {formatValue(value, metric.format)}
                          </span>
                          {index > 0 && diff !== 0 && (
                            <div className="flex items-center gap-1 text-xs">
                              {getTrendIcon(value, prevValue)}
                              <span className={value > prevValue ? 'text-red-600' : 'text-green-600'}>
                                {diffPercent}%
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EnvironmentComparison;
