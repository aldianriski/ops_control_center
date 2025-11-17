import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { finopsApi } from '../api';
import { generateForecast, analyzeCostTrends, ForecastDataPoint } from '../services/forecastService';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  ComposedChart,
  ReferenceLine,
} from 'recharts';
import {
  ChartBarIcon,
  ExclamationTriangleIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  MinusIcon,
  LightBulbIcon,
} from '@heroicons/react/24/outline';

const CostForecastPanel: React.FC = () => {
  const { data: costBreakdown, isLoading } = useQuery({
    queryKey: ['cost-breakdown-forecast'],
    queryFn: () => finopsApi.getCostBreakdown(),
  });

  // Process data and generate forecast
  const { forecastResult, trendAnalysis } = useMemo(() => {
    if (!costBreakdown || costBreakdown.length === 0) {
      return { forecastResult: null, trendAnalysis: null };
    }

    // Aggregate daily costs
    const dailyCosts = new Map<string, number>();
    costBreakdown.forEach((record: any) => {
      const date = record.date.split('T')[0];
      const current = dailyCosts.get(date) || 0;
      dailyCosts.set(date, current + record.cost_usd);
    });

    // Convert to forecast data points
    const historicalData: ForecastDataPoint[] = Array.from(dailyCosts.entries())
      .map(([date, actual]) => ({ date, actual }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-60); // Last 60 days

    const forecastResult = generateForecast(historicalData, 30);
    const trendAnalysis = analyzeCostTrends(historicalData);

    return { forecastResult, trendAnalysis };
  }, [costBreakdown]);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (!forecastResult) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <div className="text-center text-gray-500">
          <ChartBarIcon className="w-12 h-12 mx-auto mb-2 text-gray-400" />
          <p>Insufficient data for forecasting</p>
        </div>
      </div>
    );
  }

  const getTrendIcon = () => {
    switch (forecastResult.trend) {
      case 'increasing':
        return <TrendingUpIcon className="w-5 h-5 text-red-600" />;
      case 'decreasing':
        return <TrendingDownIcon className="w-5 h-5 text-green-600" />;
      default:
        return <MinusIcon className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTrendColor = () => {
    switch (forecastResult.trend) {
      case 'increasing':
        return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      case 'decreasing':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  // Prepare chart data
  const chartData = forecastResult.forecast.map(point => ({
    date: point.date,
    actual: point.actual > 0 ? point.actual : null,
    predicted: point.predicted,
    lowerBound: point.lowerBound,
    upperBound: point.upperBound,
    isAnomaly: point.isAnomaly,
  }));

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              AI Cost Forecast & Anomaly Detection
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              30-day prediction with {forecastResult.confidence.toFixed(0)}% confidence
            </p>
          </div>
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${getTrendColor()}`}>
            {getTrendIcon()}
            <span className="text-sm font-medium capitalize">{forecastResult.trend}</span>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Predicted Next 30 Days</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            ${forecastResult.totalPredicted.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Average Daily Cost</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            ${trendAnalysis?.averageDailyCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Anomalies Detected</p>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {forecastResult.anomalies.length}
            </p>
            {forecastResult.anomalies.length > 0 && (
              <ExclamationTriangleIcon className="w-5 h-5 text-orange-600" />
            )}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="p-6">
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
              }}
              formatter={(value: any) => [`$${value.toFixed(2)}`, '']}
              labelFormatter={(label) => new Date(label).toLocaleDateString()}
            />
            <Legend />

            {/* Confidence interval */}
            <Area
              type="monotone"
              dataKey="upperBound"
              stackId="1"
              stroke="none"
              fill="#818cf8"
              fillOpacity={0.1}
              name="Upper Bound"
            />
            <Area
              type="monotone"
              dataKey="lowerBound"
              stackId="1"
              stroke="none"
              fill="#fff"
              fillOpacity={1}
              name="Lower Bound"
            />

            {/* Actual costs */}
            <Line
              type="monotone"
              dataKey="actual"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 3 }}
              name="Actual Cost"
              connectNulls={false}
            />

            {/* Predicted costs */}
            <Line
              type="monotone"
              dataKey="predicted"
              stroke="#8b5cf6"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="Predicted Cost"
            />

            {/* Today marker */}
            <ReferenceLine
              x={today}
              stroke="#ef4444"
              strokeDasharray="3 3"
              label={{ value: 'Today', position: 'top', fill: '#ef4444' }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Insights */}
      {trendAnalysis && trendAnalysis.insights.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-start gap-3">
            <LightBulbIcon className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">AI Insights</p>
              <ul className="space-y-1">
                {trendAnalysis.insights.map((insight, index) => (
                  <li key={index} className="text-sm text-gray-700 dark:text-gray-300">
                    {insight}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Anomalies */}
      {forecastResult.anomalies.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-start gap-3">
            <ExclamationTriangleIcon className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">Recent Anomalies</p>
              <div className="space-y-2">
                {forecastResult.anomalies.slice(-3).map((anomaly, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700 dark:text-gray-300">
                      {new Date(anomaly.date).toLocaleDateString()}
                    </span>
                    <span className="font-medium text-orange-600">
                      ${anomaly.actual.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CostForecastPanel;
