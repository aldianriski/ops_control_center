import { useQuery } from '@tanstack/react-query';
import { finopsApi } from '../api';
import KPICard from '../components/KPICard';
import FinOpsRecommendations from '../components/FinOpsRecommendations';
import TableFilter from '../components/TableFilter';
import { DollarSign, TrendingUp, CreditCard } from 'lucide-react';
import { useState } from 'react';

const FinOps = () => {
  const [filteredCostBreakdown, setFilteredCostBreakdown] = useState<any[]>([]);

  const { data: summary } = useQuery({
    queryKey: ['finops-summary'],
    queryFn: finopsApi.getSummary,
  });

  const { data: icsCredits } = useQuery({
    queryKey: ['ics-credits'],
    queryFn: finopsApi.getICSCredits,
  });

  const { data: costBreakdown } = useQuery({
    queryKey: ['cost-breakdown'],
    queryFn: () => finopsApi.getCostBreakdown(),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">FinOps</h1>
        <p className="mt-1 text-sm text-gray-500">
          AWS cost tracking, forecasting, and budget management
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard
          title="MTD Cost"
          value={`$${(summary?.mtd_cost || 0).toLocaleString()}`}
          icon={DollarSign}
          variant="default"
        />
        <KPICard
          title="Forecast EOM"
          value={`$${(summary?.forecast_eom || 0).toLocaleString()}`}
          icon={TrendingUp}
          variant="warning"
        />
        <KPICard
          title="Budget Variance"
          value={`$${(summary?.variance || 0).toLocaleString()}`}
          icon={DollarSign}
          variant={(summary?.variance || 0) > 0 ? 'danger' : 'success'}
        />
      </div>

      {/* ICS Credits */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">ICS Credits</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-gray-600">Current Balance</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">
              ${(icsCredits?.balance || 0).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Burn Rate</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">
              ${(icsCredits?.burn_rate_per_day || 0).toFixed(2)}/day
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Remaining Days</p>
            <p className="mt-1 text-2xl font-semibold text-gray-900">
              {icsCredits?.remaining_days || 0} days
            </p>
          </div>
        </div>
      </div>

      {/* Cost Breakdown */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Cost Breakdown</h3>
        </div>
        <div className="p-4 border-b border-gray-200">
          <TableFilter
            data={costBreakdown || []}
            columns={[
              { key: 'date', label: 'Date', filterable: false },
              { key: 'environment', label: 'Environment', filterable: true },
              { key: 'service', label: 'Service', filterable: true },
              { key: 'cost_usd', label: 'Cost', filterable: false },
              { key: 'ics_credits_applied', label: 'ICS Credits', filterable: false },
            ]}
            onFilteredDataChange={setFilteredCostBreakdown}
            placeholder="Search cost records..."
          />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Environment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ICS Credits
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCostBreakdown.map((record) => (
                <tr key={record.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(record.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.environment}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {record.service}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ${record.cost_usd.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${record.ics_credits_applied.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FinOps Recommendations */}
      <FinOpsRecommendations />
    </div>
  );
};

export default FinOps;
