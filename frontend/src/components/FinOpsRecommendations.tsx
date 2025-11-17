import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '../store/appStore';
import { recommendationsApi } from '../api/extended';
import {
  DollarSign,
  TrendingDown,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import { format } from 'date-fns';
import DetailPanel from './DetailPanel';

interface Recommendation {
  id: string;
  environment: string;
  recommendation_type: 'rightsizing' | 'reserved_instances' | 'spot_instances' | 'unused_resources' | 'storage_optimization' | 'other';
  title: string;
  description: string;
  estimated_monthly_savings: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed' | 'dismissed';
  source: 'ai' | 'manual' | 'aws_cost_explorer';
  affected_resources?: string[];
  implementation_steps?: string[];
  created_at: string;
  updated_at: string;
}

const FinOpsRecommendations = () => {
  const { selectedEnvironment } = useAppStore();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRec, setSelectedRec] = useState<Recommendation | null>(null);

  const { data: recommendations = [], isLoading } = useQuery({
    queryKey: ['recommendations', selectedEnvironment, statusFilter],
    queryFn: () =>
      recommendationsApi.getRecommendations({
        environment: selectedEnvironment,
        ...(statusFilter !== 'all' && { status: statusFilter }),
      }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Recommendation['status'] }) =>
      recommendationsApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recommendations'] });
      setSelectedRec(null);
    },
  });

  const priorityColors: Record<Recommendation['priority'], string> = {
    critical: 'bg-red-100 text-red-800 border-red-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-green-100 text-green-800 border-green-200',
  };

  const statusIcons: Record<Recommendation['status'], JSX.Element> = {
    pending: <Clock size={18} className="text-gray-500" />,
    in_progress: <AlertCircle size={18} className="text-blue-500" />,
    completed: <CheckCircle size={18} className="text-green-500" />,
    dismissed: <XCircle size={18} className="text-gray-400" />,
  };

  const statusColors: Record<Recommendation['status'], string> = {
    pending: 'bg-gray-100 text-gray-700',
    in_progress: 'bg-blue-100 text-blue-700',
    completed: 'bg-green-100 text-green-700',
    dismissed: 'bg-gray-100 text-gray-500',
  };

  const typeLabels: Record<Recommendation['recommendation_type'], string> = {
    rightsizing: 'Rightsizing',
    reserved_instances: 'Reserved Instances',
    spot_instances: 'Spot Instances',
    unused_resources: 'Unused Resources',
    storage_optimization: 'Storage Optimization',
    other: 'Other',
  };

  const totalSavings = recommendations.reduce(
    (sum: number, rec: Recommendation) =>
      rec.status !== 'dismissed' ? sum + rec.estimated_monthly_savings : sum,
    0
  );

  const completedSavings = recommendations
    .filter((rec: Recommendation) => rec.status === 'completed')
    .reduce((sum: number, rec: Recommendation) => sum + rec.estimated_monthly_savings, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg shadow p-6 border border-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700">Potential Savings</p>
              <p className="text-3xl font-bold text-green-900 mt-2">
                ${totalSavings.toLocaleString()}
              </p>
              <p className="text-xs text-green-600 mt-1">per month</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <TrendingDown size={28} className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow p-6 border border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">Realized Savings</p>
              <p className="text-3xl font-bold text-blue-900 mt-2">
                ${completedSavings.toLocaleString()}
              </p>
              <p className="text-xs text-blue-600 mt-1">implemented</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <CheckCircle size={28} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg shadow p-6 border border-purple-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-700">Active Recommendations</p>
              <p className="text-3xl font-bold text-purple-900 mt-2">
                {recommendations.filter((r: Recommendation) => r.status === 'pending' || r.status === 'in_progress').length}
              </p>
              <p className="text-xs text-purple-600 mt-1">pending action</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <AlertCircle size={28} className="text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Cost Optimization Recommendations</h2>
            <div className="flex gap-2">
              {['all', 'pending', 'in_progress', 'completed', 'dismissed'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    statusFilter === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status === 'all' ? 'All' : status.replace('_', ' ').charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Recommendations List */}
        <div className="p-6">
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-gray-50 rounded-lg p-6 animate-pulse">
                  <div className="h-5 bg-gray-200 rounded w-2/3 mb-3" />
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                </div>
              ))}
            </div>
          ) : recommendations.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">No recommendations found</p>
              <p className="text-sm text-gray-400 mt-1">
                {statusFilter === 'all'
                  ? 'Check back later for cost optimization suggestions'
                  : `No ${statusFilter.replace('_', ' ')} recommendations`}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {recommendations.map((rec: Recommendation) => (
                <div
                  key={rec.id}
                  onClick={() => setSelectedRec(rec)}
                  className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {statusIcons[rec.status]}
                        <h3 className="text-lg font-semibold text-gray-900">{rec.title}</h3>
                        <span
                          className={`px-3 py-1 text-xs font-semibold rounded-full border ${
                            priorityColors[rec.priority]
                          }`}
                        >
                          {rec.priority.toUpperCase()}
                        </span>
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${statusColors[rec.status]}`}>
                          {rec.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{rec.description}</p>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-2">
                          <DollarSign size={16} className="text-green-600" />
                          <span className="font-semibold text-green-700">
                            ${rec.estimated_monthly_savings.toLocaleString()}/mo savings
                          </span>
                        </div>
                        <div className="text-gray-500">
                          Type: <span className="font-medium">{typeLabels[rec.recommendation_type]}</span>
                        </div>
                        <div className="text-gray-500">
                          Source: <span className="font-medium">{rec.source.toUpperCase()}</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-gray-400 flex-shrink-0 mt-2" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail Panel */}
      {selectedRec && (
        <DetailPanel
          isOpen={!!selectedRec}
          onClose={() => setSelectedRec(null)}
          title={selectedRec.title}
        >
          <div className="space-y-6">
            {/* Overview */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 uppercase mb-3">Overview</h4>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Type:</span>
                  <span className="text-sm font-medium">{typeLabels[selectedRec.recommendation_type]}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Priority:</span>
                  <span className={`text-sm font-semibold px-2 py-0.5 rounded ${priorityColors[selectedRec.priority]}`}>
                    {selectedRec.priority.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Estimated Savings:</span>
                  <span className="text-sm font-bold text-green-700">
                    ${selectedRec.estimated_monthly_savings.toLocaleString()}/month
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Created:</span>
                  <span className="text-sm">{format(new Date(selectedRec.created_at), 'MMM dd, yyyy HH:mm')}</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 uppercase mb-3">Description</h4>
              <p className="text-sm text-gray-700 leading-relaxed">{selectedRec.description}</p>
            </div>

            {/* Affected Resources */}
            {selectedRec.affected_resources && selectedRec.affected_resources.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 uppercase mb-3">Affected Resources</h4>
                <div className="bg-blue-50 rounded-lg p-4">
                  <ul className="space-y-1">
                    {selectedRec.affected_resources.map((resource, idx) => (
                      <li key={idx} className="text-sm text-gray-700 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                        {resource}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Implementation Steps */}
            {selectedRec.implementation_steps && selectedRec.implementation_steps.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 uppercase mb-3">Implementation Steps</h4>
                <ol className="space-y-2">
                  {selectedRec.implementation_steps.map((step, idx) => (
                    <li key={idx} className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-semibold">
                        {idx + 1}
                      </span>
                      <span className="text-sm text-gray-700 pt-0.5">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Status Actions */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 uppercase mb-3">Update Status</h4>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => updateStatusMutation.mutate({ id: selectedRec.id, status: 'in_progress' })}
                  disabled={selectedRec.status === 'in_progress' || updateStatusMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium"
                >
                  Start Implementation
                </button>
                <button
                  onClick={() => updateStatusMutation.mutate({ id: selectedRec.id, status: 'completed' })}
                  disabled={selectedRec.status === 'completed' || updateStatusMutation.isPending}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium"
                >
                  Mark Complete
                </button>
                <button
                  onClick={() => updateStatusMutation.mutate({ id: selectedRec.id, status: 'pending' })}
                  disabled={selectedRec.status === 'pending' || updateStatusMutation.isPending}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium"
                >
                  Reset to Pending
                </button>
                <button
                  onClick={() => updateStatusMutation.mutate({ id: selectedRec.id, status: 'dismissed' })}
                  disabled={selectedRec.status === 'dismissed' || updateStatusMutation.isPending}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </DetailPanel>
      )}
    </div>
  );
};

export default FinOpsRecommendations;
