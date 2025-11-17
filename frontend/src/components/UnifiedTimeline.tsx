import { useQuery } from '@tanstack/react-query';
import { timelineApi } from '../api/extended';
import { useAppStore } from '../store/appStore';
import {
  AlertCircle,
  Shield,
  DollarSign,
  Clock,
  BookOpen,
  Rocket,
  Bell,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const eventIcons: Record<string, any> = {
  incident: AlertCircle,
  security_incident: Shield,
  cost_anomaly: DollarSign,
  uptime_request: Clock,
  sop_execution: BookOpen,
  deployment: Rocket,
  alert: Bell,
};

const severityColors: Record<string, string> = {
  critical: 'text-red-600 bg-red-50',
  high: 'text-orange-600 bg-orange-50',
  medium: 'text-yellow-600 bg-yellow-50',
  low: 'text-blue-600 bg-blue-50',
  info: 'text-gray-600 bg-gray-50',
};

const UnifiedTimeline = () => {
  const { selectedEnvironment, selectedTeam } = useAppStore();

  const { data: events, isLoading } = useQuery({
    queryKey: ['timeline', selectedEnvironment, selectedTeam],
    queryFn: () =>
      timelineApi.getEvents({
        environment: selectedEnvironment,
        team: selectedTeam,
        limit: '20',
      }),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="animate-pulse space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Unified Timeline</h3>
        <p className="text-sm text-gray-500 mt-1">Recent events across all operations</p>
      </div>
      <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
        {events?.map((event: any) => {
          const Icon = eventIcons[event.event_type] || Bell;
          return (
            <div key={event.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start gap-4">
                <div
                  className={`p-2 rounded-full ${
                    severityColors[event.severity] || severityColors.info
                  }`}
                >
                  <Icon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {event.title}
                    </p>
                    <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">
                      {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  {event.description && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {event.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                      {event.event_type.replace('_', ' ')}
                    </span>
                    {event.environment && (
                      <span className="text-xs text-gray-500">{event.environment}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UnifiedTimeline;
