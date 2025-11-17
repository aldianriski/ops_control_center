import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { infraApi } from '../../api';
import WidgetWrapper from './WidgetWrapper';
import { WidgetConfig } from '../../store/dashboardStore';
import { AlertTriangle } from 'lucide-react';

interface RecentIncidentsWidgetProps {
  widget: WidgetConfig;
  onRemove?: () => void;
  onConfigure?: () => void;
  isEditMode?: boolean;
}

const RecentIncidentsWidget: React.FC<RecentIncidentsWidgetProps> = ({
  widget,
  onRemove,
  onConfigure,
  isEditMode,
}) => {
  const limit = widget.config.limit || 5;
  const severityFilter = widget.config.severityFilter || null;

  const { data: incidents, isLoading } = useQuery({
    queryKey: ['incidents', 'widget', widget.id],
    queryFn: () => infraApi.getIncidents(severityFilter ? { severity: severityFilter } : {}),
    refetchInterval: (widget.refreshInterval || 30) * 1000,
  });

  const recentIncidents = incidents?.slice(0, limit) || [];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      default:
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    }
  };

  return (
    <WidgetWrapper
      title={widget.title}
      onRemove={onRemove}
      onConfigure={onConfigure}
      isEditMode={isEditMode}
      refreshInterval={widget.refreshInterval}
      lastUpdated={new Date()}
    >
      {isLoading ? (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : recentIncidents.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-gray-500">
          <AlertTriangle className="w-12 h-12 mb-2" />
          <p>No incidents found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {recentIncidents.map((incident: any) => (
            <div
              key={incident.id}
              className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      {incident.jira_id}
                    </span>
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getSeverityColor(incident.severity)}`}>
                      {incident.severity}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                    {incident.title}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                    <span>{incident.squad}</span>
                    <span>•</span>
                    <span>{incident.status}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </WidgetWrapper>
  );
};

export default RecentIncidentsWidget;
