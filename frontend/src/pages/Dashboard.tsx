import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { dashboardApi } from '../api';
import KPICard from '../components/KPICard';
import UnifiedTimeline from '../components/UnifiedTimeline';
import SkeletonLoader from '../components/SkeletonLoader';
import DashboardSelector from '../components/DashboardSelector';
import DashboardBuilder from '../components/DashboardBuilder';
import GrafanaDashboard from '../components/GrafanaDashboard';
import useDashboardStore from '../store/dashboardStore';
import {
  AlertCircle,
  CheckCircle,
  DollarSign,
  TrendingDown,
  CreditCard,
  LayoutDashboard,
  BarChart3,
} from 'lucide-react';

const Dashboard = () => {
  const [activeView, setActiveView] = useState<'overview' | 'custom'>('overview');
  const { dashboards, addDashboard } = useDashboardStore();

  const { data: summary, isLoading } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: dashboardApi.getSummary,
  });

  // Initialize with a default dashboard if none exists
  useEffect(() => {
    if (dashboards.length === 0) {
      addDashboard({
        name: 'My Dashboard',
        description: 'Personalized operational dashboard',
        isDefault: true,
        widgets: [],
        layout: [],
      });
    }
  }, [dashboards.length, addDashboard]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <SkeletonLoader type="card" count={4} />
        <SkeletonLoader type="card" count={1} />
        <SkeletonLoader type="list" count={5} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Real-time operational visibility across InfraOps, SecOps, and FinOps
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          <button
            onClick={() => setActiveView('overview')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeView === 'overview'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="font-medium">Overview</span>
          </button>
          <button
            onClick={() => setActiveView('custom')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeView === 'custom'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="font-medium">Custom</span>
          </button>
        </div>
      </div>

      {/* Conditional Rendering based on active view */}
      {activeView === 'custom' ? (
        <>
          <DashboardSelector />
          <DashboardBuilder />
        </>
      ) : (
        <>
          {/* Original Overview Content */}

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

      {/* Grafana Dashboard Integration */}
      <GrafanaDashboard
        title="System Performance Metrics"
        dashboardId="system-overview"
        height={450}
        refresh="30s"
        timeRange={{ from: 'now-6h', to: 'now' }}
      />

      {/* Unified Timeline */}
      <UnifiedTimeline />

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
        </>
      )}
    </div>
  );
};

export default Dashboard;
