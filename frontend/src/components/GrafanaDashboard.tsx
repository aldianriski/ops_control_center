import React, { useState } from 'react';
import { BarChart3, Maximize, RefreshCw, Settings } from 'lucide-react';

interface GrafanaDashboardProps {
  dashboardId?: string;
  panelId?: number;
  title?: string;
  height?: number;
  refresh?: string; // e.g., '5s', '1m', '5m'
  timeRange?: {
    from: string;
    to: string;
  };
}

const GrafanaDashboard: React.FC<GrafanaDashboardProps> = ({
  dashboardId = 'default',
  panelId,
  title = 'Grafana Dashboard',
  height = 400,
  refresh = '30s',
  timeRange = { from: 'now-1h', to: 'now' },
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  // Get Grafana URL from environment or use default
  const grafanaUrl = import.meta.env.VITE_GRAFANA_URL || 'https://grafana.example.com';

  // Build iframe URL
  const buildIframeUrl = () => {
    const params = new URLSearchParams({
      orgId: '1',
      refresh,
      from: timeRange.from,
      to: timeRange.to,
      theme: 'light',
      kiosk: 'tv', // Kiosk mode to hide Grafana UI
    });

    if (panelId) {
      // Embed a specific panel
      return `${grafanaUrl}/d-solo/${dashboardId}?${params.toString()}&panelId=${panelId}`;
    } else {
      // Embed entire dashboard
      return `${grafanaUrl}/d/${dashboardId}?${params.toString()}`;
    }
  };

  const handleRefresh = () => {
    setIsLoading(true);
    // Trigger iframe reload
    const iframe = document.getElementById(`grafana-${dashboardId}-${panelId}`) as HTMLIFrameElement;
    if (iframe) {
      iframe.src = iframe.src;
    }
  };

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <>
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden ${
        isFullscreen ? 'fixed inset-4 z-50' : ''
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Powered by Grafana • Refresh: {refresh}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={handleFullscreen}
              className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              <Maximize className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="px-4 py-3 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800">
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-700 dark:text-gray-300 font-medium">Dashboard ID:</span>
                <code className="px-2 py-1 bg-white dark:bg-gray-800 rounded text-xs">{dashboardId}</code>
              </div>
              {panelId && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 dark:text-gray-300 font-medium">Panel ID:</span>
                  <code className="px-2 py-1 bg-white dark:bg-gray-800 rounded text-xs">{panelId}</code>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-gray-700 dark:text-gray-300 font-medium">Time Range:</span>
                <code className="px-2 py-1 bg-white dark:bg-gray-800 rounded text-xs">
                  {timeRange.from} → {timeRange.to}
                </code>
              </div>
              <div className="pt-2">
                <a
                  href={`${grafanaUrl}/d/${dashboardId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 dark:text-indigo-400 hover:underline text-xs"
                >
                  Open in Grafana →
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-800/80 z-10">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Loading dashboard...</p>
            </div>
          </div>
        )}

        {/* Grafana iFrame */}
        <div className="relative" style={{ height: isFullscreen ? 'calc(100vh - 140px)' : height }}>
          <iframe
            id={`grafana-${dashboardId}-${panelId}`}
            src={buildIframeUrl()}
            width="100%"
            height="100%"
            frameBorder="0"
            onLoad={() => setIsLoading(false)}
            className="w-full h-full"
            title={title}
          />
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Embedded from {grafanaUrl}</span>
            <span>Last updated: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>

      {/* Fullscreen Overlay */}
      {isFullscreen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={handleFullscreen}
        />
      )}
    </>
  );
};

export default GrafanaDashboard;
