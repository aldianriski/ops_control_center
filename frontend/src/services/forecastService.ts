/**
 * Cost Forecasting Service
 * Uses simple linear regression for cost prediction
 * Detects anomalies using statistical methods
 */

export interface ForecastDataPoint {
  date: string;
  actual: number;
  predicted?: number;
  lowerBound?: number;
  upperBound?: number;
  isAnomaly?: boolean;
}

export interface ForecastResult {
  forecast: ForecastDataPoint[];
  trend: 'increasing' | 'decreasing' | 'stable';
  confidence: number;
  totalPredicted: number;
  anomalies: ForecastDataPoint[];
}

export interface AnomalyDetectionResult {
  isAnomaly: boolean;
  score: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  reason: string;
  expectedValue: number;
  actualValue: number;
  deviation: number;
}

/**
 * Linear regression to predict future costs
 */
function linearRegression(data: number[]): { slope: number; intercept: number } {
  const n = data.length;
  const x = Array.from({ length: n }, (_, i) => i);
  const y = data;

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
}

/**
 * Calculate standard deviation
 */
function standardDeviation(values: number[]): number {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(variance);
}

/**
 * Detect anomalies using Z-score method
 */
export function detectAnomaly(
  value: number,
  historicalData: number[],
  threshold: number = 2.5
): AnomalyDetectionResult {
  const mean = historicalData.reduce((a, b) => a + b, 0) / historicalData.length;
  const stdDev = standardDeviation(historicalData);
  const zScore = Math.abs((value - mean) / stdDev);
  const deviation = ((value - mean) / mean) * 100;

  let severity: AnomalyDetectionResult['severity'] = 'low';
  if (zScore > 4) severity = 'critical';
  else if (zScore > 3) severity = 'high';
  else if (zScore > 2.5) severity = 'medium';

  let reason = 'Normal behavior';
  if (zScore > threshold) {
    if (value > mean) {
      reason = `Cost spike detected: ${Math.abs(deviation).toFixed(1)}% above expected`;
    } else {
      reason = `Unusual cost drop: ${Math.abs(deviation).toFixed(1)}% below expected`;
    }
  }

  return {
    isAnomaly: zScore > threshold,
    score: zScore,
    severity,
    reason,
    expectedValue: mean,
    actualValue: value,
    deviation,
  };
}

/**
 * Generate cost forecast for next N days
 */
export function generateForecast(
  historicalData: ForecastDataPoint[],
  daysToForecast: number = 30
): ForecastResult {
  // Extract actual values
  const actualValues = historicalData.map(d => d.actual);

  // Calculate trend using linear regression
  const { slope, intercept } = linearRegression(actualValues);

  // Calculate confidence based on R-squared
  const mean = actualValues.reduce((a, b) => a + b, 0) / actualValues.length;
  const predictedValues = actualValues.map((_, i) => slope * i + intercept);
  const ssRes = actualValues.reduce((sum, actual, i) => {
    return sum + Math.pow(actual - predictedValues[i], 2);
  }, 0);
  const ssTot = actualValues.reduce((sum, actual) => {
    return sum + Math.pow(actual - mean, 2);
  }, 0);
  const rSquared = 1 - (ssRes / ssTot);
  const confidence = Math.max(0, Math.min(100, rSquared * 100));

  // Determine trend
  let trend: ForecastResult['trend'] = 'stable';
  if (slope > mean * 0.01) trend = 'increasing';
  else if (slope < -mean * 0.01) trend = 'decreasing';

  // Calculate standard deviation for confidence intervals
  const stdDev = standardDeviation(actualValues);
  const confidenceInterval = 1.96 * stdDev; // 95% confidence

  // Detect anomalies in historical data
  const anomalies: ForecastDataPoint[] = [];
  historicalData.forEach((point, index) => {
    if (index >= 7) { // Need at least 7 days of history
      const recentData = actualValues.slice(Math.max(0, index - 30), index);
      const anomalyResult = detectAnomaly(point.actual, recentData);
      if (anomalyResult.isAnomaly) {
        anomalies.push({
          ...point,
          isAnomaly: true,
        });
      }
    }
  });

  // Generate forecast
  const forecast: ForecastDataPoint[] = [];
  const startIndex = historicalData.length;

  // Add historical data with predictions
  historicalData.forEach((point, index) => {
    const predicted = slope * index + intercept;
    forecast.push({
      ...point,
      predicted,
      lowerBound: predicted - confidenceInterval,
      upperBound: predicted + confidenceInterval,
    });
  });

  // Add future predictions
  for (let i = 0; i < daysToForecast; i++) {
    const index = startIndex + i;
    const predicted = slope * index + intercept;
    const date = new Date();
    date.setDate(date.getDate() + i + 1);

    forecast.push({
      date: date.toISOString().split('T')[0],
      actual: 0, // No actual data for future
      predicted: Math.max(0, predicted), // Ensure non-negative
      lowerBound: Math.max(0, predicted - confidenceInterval),
      upperBound: Math.max(0, predicted + confidenceInterval),
    });
  }

  // Calculate total predicted cost
  const totalPredicted = forecast
    .slice(startIndex)
    .reduce((sum, point) => sum + (point.predicted || 0), 0);

  return {
    forecast,
    trend,
    confidence,
    totalPredicted,
    anomalies,
  };
}

/**
 * Analyze cost trends and provide insights
 */
export function analyzeCostTrends(data: ForecastDataPoint[]): {
  averageDailyCost: number;
  weekOverWeekChange: number;
  monthOverMonthChange: number;
  insights: string[];
} {
  const actualValues = data.map(d => d.actual);
  const averageDailyCost = actualValues.reduce((a, b) => a + b, 0) / actualValues.length;

  // Week over week
  const lastWeek = actualValues.slice(-7);
  const previousWeek = actualValues.slice(-14, -7);
  const lastWeekAvg = lastWeek.reduce((a, b) => a + b, 0) / lastWeek.length;
  const prevWeekAvg = previousWeek.reduce((a, b) => a + b, 0) / previousWeek.length;
  const weekOverWeekChange = ((lastWeekAvg - prevWeekAvg) / prevWeekAvg) * 100;

  // Month over month
  const lastMonth = actualValues.slice(-30);
  const previousMonth = actualValues.slice(-60, -30);
  const lastMonthAvg = lastMonth.reduce((a, b) => a + b, 0) / lastMonth.length;
  const prevMonthAvg = previousMonth.reduce((a, b) => a + b, 0) / previousMonth.length;
  const monthOverMonthChange = ((lastMonthAvg - prevMonthAvg) / prevMonthAvg) * 100;

  // Generate insights
  const insights: string[] = [];

  if (weekOverWeekChange > 10) {
    insights.push(`⚠️ Costs increased ${weekOverWeekChange.toFixed(1)}% this week`);
  } else if (weekOverWeekChange < -10) {
    insights.push(`✅ Costs decreased ${Math.abs(weekOverWeekChange).toFixed(1)}% this week`);
  }

  if (monthOverMonthChange > 15) {
    insights.push(`📈 Significant monthly increase: ${monthOverMonthChange.toFixed(1)}%`);
  }

  // Detect anomalies
  const recentData = actualValues.slice(-7);
  const anomalyResult = detectAnomaly(recentData[recentData.length - 1], actualValues.slice(-30, -7));
  if (anomalyResult.isAnomaly) {
    insights.push(`🔍 ${anomalyResult.reason}`);
  }

  if (insights.length === 0) {
    insights.push('✨ Costs are trending normally');
  }

  return {
    averageDailyCost,
    weekOverWeekChange,
    monthOverMonthChange,
    insights,
  };
}
