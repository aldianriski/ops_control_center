import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api';
import KPICard from '../components/KPICard';
import {
  AlertCircle,
  CheckCircle,
  DollarSign,
  TrendingDown,
  CreditCard,
} from 'lucide-react';

const Dashboard = () => {
  const { data: summary, isLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: dashboardApi.getSummary,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Real-time operational visibility across InfraOps, SecOps, and FinOps
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Weekly Incidents"
          value={summary?.weekly_incidents || 0}
          icon={AlertCircle}
          variant="warning"
        />
        <KPICard
          title="SLA Delivered"
          value={`${(summary?.sla_percentage || 0).toFixed(1)}%`}
          icon={CheckCircle}
          variant={
            (summary?.sla_percentage || 0) >= 95
              ? 'success'
              : (summary?.sla_percentage || 0) >= 90
              ? 'warning'
              : 'danger'
          }
        />
        <KPICard
          title="AWS OPEX MTD"
          value={`$${(summary?.aws_opex_mtd || 0).toLocaleString()}`}
          icon={DollarSign}
          variant="default"
        />
        <KPICard
          title="Budget Variance"
          value={`$${(summary?.aws_budget_variance || 0).toLocaleString()}`}
          icon={TrendingDown}
          variant={
            (summary?.aws_budget_variance || 0) < 0 ? 'success' : 'warning'
          }
        />
      </div>

      {/* ICS Credits Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">ICS Credits</h3>
            <p className="mt-1 text-3xl font-semibold text-gray-900">
              ${(summary?.ics_credits_remaining || 0).toLocaleString()}
            </p>
            <p className="mt-1 text-sm text-gray-500">Credits remaining</p>
          </div>
          <div className="p-3 rounded-full bg-purple-50 text-purple-600">
            <CreditCard size={32} />
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">InfraOps Summary</h3>
          <p className="text-sm text-gray-600">
            View incidents, tasks, SLA metrics, and uptime requests
          </p>
          <a
            href="/infra"
            className="mt-4 inline-block text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            Go to InfraOps →
          </a>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">FinOps Summary</h3>
          <p className="text-sm text-gray-600">
            Cost breakdown, forecasts, and budget tracking
          </p>
          <a
            href="/finops"
            className="mt-4 inline-block text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            Go to FinOps →
          </a>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Reports</h3>
          <p className="text-sm text-gray-600">
            Generate and download weekly/monthly reports
          </p>
          <a
            href="/reports"
            className="mt-4 inline-block text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            View Reports →
          </a>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
