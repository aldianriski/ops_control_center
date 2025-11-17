import { useState, useEffect } from 'react';
import { Activity, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface RateLimitInfo {
  limit: number; // Total requests allowed
  remaining: number; // Requests remaining
  reset: number; // Unix timestamp when limit resets
  used: number; // Requests used
}

interface RateLimitIndicatorProps {
  position?: 'header' | 'standalone';
  showDetails?: boolean;
}

const RateLimitIndicator = ({ position = 'header', showDetails = false }: RateLimitIndicatorProps) => {
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo>({
    limit: 1000,
    remaining: 847,
    reset: Date.now() + 3600000, // 1 hour from now
    used: 153,
  });

  const [isExpanded, setIsExpanded] = useState(false);

  // Update reset time countdown
  useEffect(() => {
    const interval = setInterval(() => {
      // In production, this would fetch from API response headers
      // For demo, we simulate rate limit updates
      setRateLimitInfo((prev) => ({
        ...prev,
        remaining: Math.max(0, prev.remaining - Math.floor(Math.random() * 2)),
        used: prev.limit - Math.max(0, prev.remaining - Math.floor(Math.random() * 2)),
      }));
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const getTimeUntilReset = (): string => {
    const now = Date.now();
    const diff = rateLimitInfo.reset - now;

    if (diff <= 0) return '0m';

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  const getUsagePercentage = (): number => {
    return (rateLimitInfo.used / rateLimitInfo.limit) * 100;
  };

  const getStatusColor = (): { bg: string; text: string; border: string; icon: JSX.Element } => {
    const percentage = getUsagePercentage();

    if (percentage >= 90) {
      return {
        bg: 'bg-red-50',
        text: 'text-red-700',
        border: 'border-red-200',
        icon: <AlertTriangle size={16} className="text-red-600" />,
      };
    } else if (percentage >= 70) {
      return {
        bg: 'bg-yellow-50',
        text: 'text-yellow-700',
        border: 'border-yellow-200',
        icon: <Info size={16} className="text-yellow-600" />,
      };
    } else {
      return {
        bg: 'bg-green-50',
        text: 'text-green-700',
        border: 'border-green-200',
        icon: <CheckCircle size={16} className="text-green-600" />,
      };
    }
  };

  const statusColor = getStatusColor();

  if (position === 'header') {
    return (
      <div className="relative">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${statusColor.bg} ${statusColor.text} ${statusColor.border} text-xs font-medium transition-colors hover:opacity-80`}
          title="API Rate Limit Status"
        >
          <Activity size={14} />
          <span>
            {rateLimitInfo.remaining}/{rateLimitInfo.limit}
          </span>
        </button>

        {/* Expanded Details Dropdown */}
        {isExpanded && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsExpanded(false)} />
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Activity size={18} className="text-blue-600" />
                    API Rate Limit
                  </h3>
                  <span className="text-xs text-gray-500">Resets in {getTimeUntilReset()}</span>
                </div>

                {/* Progress Bar */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-700">Usage</span>
                    <span className="text-xs text-gray-500">
                      {rateLimitInfo.used} / {rateLimitInfo.limit} requests
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        getUsagePercentage() >= 90
                          ? 'bg-red-500'
                          : getUsagePercentage() >= 70
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}
                      style={{ width: `${getUsagePercentage()}%` }}
                    />
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Remaining</p>
                    <p className="text-xl font-bold text-gray-900">{rateLimitInfo.remaining}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Used</p>
                    <p className="text-xl font-bold text-gray-900">{rateLimitInfo.used}</p>
                  </div>
                </div>

                {/* Warning Message */}
                {getUsagePercentage() >= 70 && (
                  <div
                    className={`flex items-start gap-2 p-3 rounded-md ${
                      getUsagePercentage() >= 90 ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'
                    }`}
                  >
                    {statusColor.icon}
                    <div className="flex-1">
                      <p className={`text-xs font-medium ${statusColor.text}`}>
                        {getUsagePercentage() >= 90 ? 'Rate limit almost reached' : 'High API usage detected'}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {getUsagePercentage() >= 90
                          ? 'Reduce API calls to avoid being rate limited.'
                          : 'Monitor your API usage to avoid rate limiting.'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Info */}
                <div className="pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Rate limits help ensure fair usage. The limit resets every hour at the top of the hour.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // Standalone view for admin page
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Activity size={20} className="text-blue-600" />
          API Rate Limit Status
        </h3>
        <span className="text-sm text-gray-500">Resets in {getTimeUntilReset()}</span>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-700">Current Usage</span>
          <span className="text-sm text-gray-600">
            {rateLimitInfo.used} / {rateLimitInfo.limit} requests ({getUsagePercentage().toFixed(1)}%)
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className={`h-4 rounded-full transition-all duration-500 flex items-center justify-end pr-2 ${
              getUsagePercentage() >= 90
                ? 'bg-gradient-to-r from-red-500 to-red-600'
                : getUsagePercentage() >= 70
                ? 'bg-gradient-to-r from-yellow-400 to-yellow-500'
                : 'bg-gradient-to-r from-green-400 to-green-500'
            }`}
            style={{ width: `${getUsagePercentage()}%` }}
          >
            {getUsagePercentage() > 10 && (
              <span className="text-xs font-bold text-white">{getUsagePercentage().toFixed(0)}%</span>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <p className="text-sm text-blue-600 font-medium mb-1">Total Limit</p>
          <p className="text-2xl font-bold text-blue-900">{rateLimitInfo.limit}</p>
          <p className="text-xs text-blue-600 mt-1">requests/hour</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <p className="text-sm text-green-600 font-medium mb-1">Remaining</p>
          <p className="text-2xl font-bold text-green-900">{rateLimitInfo.remaining}</p>
          <p className="text-xs text-green-600 mt-1">requests left</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <p className="text-sm text-gray-600 font-medium mb-1">Used</p>
          <p className="text-2xl font-bold text-gray-900">{rateLimitInfo.used}</p>
          <p className="text-xs text-gray-600 mt-1">requests made</p>
        </div>
      </div>

      {/* Status Alert */}
      {getUsagePercentage() >= 70 && (
        <div
          className={`flex items-start gap-3 p-4 rounded-lg ${
            getUsagePercentage() >= 90
              ? 'bg-red-50 border border-red-200'
              : 'bg-yellow-50 border border-yellow-200'
          }`}
        >
          {statusColor.icon}
          <div className="flex-1">
            <p className={`text-sm font-semibold ${statusColor.text} mb-1`}>
              {getUsagePercentage() >= 90 ? 'Critical: Rate Limit Almost Reached' : 'Warning: High API Usage'}
            </p>
            <p className="text-sm text-gray-700">
              {getUsagePercentage() >= 90
                ? 'Your application is approaching the rate limit. Further requests may be throttled or rejected. Consider implementing request caching or reducing API call frequency.'
                : 'Your API usage is higher than usual. Monitor your application to ensure efficient API usage and avoid rate limiting.'}
            </p>
          </div>
        </div>
      )}

      {/* Info Section */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">Rate Limit Information</h4>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-0.5">•</span>
            <span>Rate limits are enforced per API token and reset every hour</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-0.5">•</span>
            <span>When the limit is reached, requests will receive a 429 Too Many Requests error</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-0.5">•</span>
            <span>Response headers include X-RateLimit-Limit, X-RateLimit-Remaining, and X-RateLimit-Reset</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 mt-0.5">•</span>
            <span>Contact your administrator if you need a higher rate limit for your use case</span>
          </li>
        </ul>
      </div>

      {/* Best Practices */}
      <div className="mt-4 bg-blue-50 rounded-lg p-4 border border-blue-200">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">Best Practices</h4>
        <ul className="space-y-1 text-xs text-blue-800">
          <li>• Implement exponential backoff for failed requests</li>
          <li>• Cache responses when possible to reduce API calls</li>
          <li>• Use webhooks for real-time updates instead of polling</li>
          <li>• Batch multiple operations into single API calls</li>
        </ul>
      </div>
    </div>
  );
};

export default RateLimitIndicator;
