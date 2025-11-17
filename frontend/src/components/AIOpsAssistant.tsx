import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { aiopsApi } from '../api/extended';
import { useAppStore } from '../store/appStore';
import { Sparkles, TrendingUp, AlertCircle, X } from 'lucide-react';

const AIOpsAssistant = () => {
  const { selectedEnvironment } = useAppStore();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeView, setActiveView] = useState<'daily' | 'weekly' | 'rca' | 'cost'>('daily');

  const { data: dailySummary } = useQuery({
    queryKey: ['aiops-daily', selectedEnvironment],
    queryFn: () => aiopsApi.getDailySummary(selectedEnvironment),
    enabled: activeView === 'daily',
  });

  const { data: weeklySummary } = useQuery({
    queryKey: ['aiops-weekly', selectedEnvironment],
    queryFn: () => aiopsApi.getWeeklySummary(selectedEnvironment),
    enabled: activeView === 'weekly',
  });

  const { data: correlations } = useQuery({
    queryKey: ['aiops-correlations', selectedEnvironment],
    queryFn: () => aiopsApi.correlateIncidents({ environment: selectedEnvironment }),
    refetchInterval: 60000, // Refresh every minute
  });

  const views = [
    { id: 'daily' as const, label: 'Daily Summary', icon: Sparkles },
    { id: 'weekly' as const, label: 'Weekly Summary', icon: TrendingUp },
  ];

  const renderContent = () => {
    if (activeView === 'daily' && dailySummary) {
      return (
        <div className="prose prose-sm max-w-none">
          <div className="whitespace-pre-wrap text-sm text-gray-700">
            {dailySummary.content || 'No daily summary available. AI summaries are generated automatically based on your operational data.'}
          </div>
        </div>
      );
    }

    if (activeView === 'weekly' && weeklySummary) {
      return (
        <div className="prose prose-sm max-w-none">
          <div className="whitespace-pre-wrap text-sm text-gray-700">
            {weeklySummary.content || 'No weekly summary available. Summaries are generated every Monday.'}
          </div>
        </div>
      );
    }

    return (
      <div className="text-center text-gray-500 py-8">
        <Sparkles size={48} className="mx-auto mb-4 text-gray-400" />
        <p className="text-sm">AI-powered insights and recommendations</p>
        <p className="text-xs text-gray-400 mt-2">
          Summaries are generated automatically from your operational data
        </p>
      </div>
    );
  };

  if (!isExpanded) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsExpanded(true)}
          className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
        >
          <Sparkles size={24} />
          <span className="font-medium">AIOps Assistant</span>
          {correlations?.total_incidents > 0 && (
            <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
              {correlations.total_incidents}
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 bg-white rounded-lg shadow-2xl border border-gray-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={20} />
          <h3 className="font-semibold">AIOps Assistant</h3>
        </div>
        <button onClick={() => setIsExpanded(false)} className="hover:bg-white/20 p-1 rounded">
          <X size={20} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        {views.map((view) => (
          <button
            key={view.id}
            onClick={() => setActiveView(view.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeView === view.id
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <view.icon size={16} />
            {view.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4 max-h-96 overflow-y-auto">
        {renderContent()}

        {/* Incident Correlations */}
        {correlations && correlations.correlated_groups?.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
              <AlertCircle size={16} className="text-orange-500" />
              Correlated Incidents
            </h4>
            <div className="space-y-2">
              {correlations.correlated_groups.map((group: any, idx: number) => (
                <div key={idx} className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-orange-900">
                    {group.squad} - {group.count} incidents
                  </p>
                  <p className="text-xs text-orange-700 mt-1">
                    Multiple incidents detected in a short timeframe
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
        <div className="grid grid-cols-2 gap-2">
          <button className="px-3 py-2 text-xs font-medium text-purple-600 bg-purple-50 rounded hover:bg-purple-100 transition-colors">
            Generate Report
          </button>
          <button className="px-3 py-2 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-colors">
            View Recommendations
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIOpsAssistant;
