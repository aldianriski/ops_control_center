import logger from '../config/logger';
import { query } from '../config/database';
import { ForecastScenario } from '../types';

class ForecastService {
  /**
   * Generate cost forecasts using simple moving average
   */
  async generateForecasts(environment: string, daysToForecast: number = 30): Promise<void> {
    try {
      logger.info(`Generating ${daysToForecast}-day forecast for environment: ${environment}`);

      // Get historical data (last 30 days)
      const historicalData = await query(
        `SELECT date, SUM(cost_usd) as daily_cost
         FROM cost_records
         WHERE environment = $1
         AND date >= CURRENT_DATE - INTERVAL '30 days'
         GROUP BY date
         ORDER BY date ASC`,
        [environment]
      );

      if (historicalData.rows.length < 7) {
        logger.warn(`Not enough historical data for forecasting (${historicalData.rows.length} days)`);
        return;
      }

      const dailyCosts = historicalData.rows.map(row => parseFloat(row.daily_cost));

      // Calculate baseline forecast (simple moving average)
      const baselineForecast = this.calculateMovingAverage(dailyCosts, 7);

      // Calculate high and low scenarios
      const stdDev = this.calculateStdDev(dailyCosts);
      const highLoadForecast = baselineForecast + (stdDev * 1.5);
      const lowLoadForecast = Math.max(baselineForecast - (stdDev * 1.5), 0);

      // Calculate confidence intervals (95%)
      const confidenceLower = Math.max(baselineForecast - (1.96 * stdDev), 0);
      const confidenceUpper = baselineForecast + (1.96 * stdDev);

      // Generate forecasts for next N days
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 1);

      for (let i = 0; i < daysToForecast; i++) {
        const forecastDate = new Date(startDate);
        forecastDate.setDate(forecastDate.getDate() + i);
        const forecastDateStr = forecastDate.toISOString().split('T')[0];

        // Insert baseline forecast
        await this.saveForecast(
          forecastDateStr,
          environment,
          baselineForecast,
          confidenceLower,
          confidenceUpper,
          ForecastScenario.BASELINE
        );

        // Insert high load scenario
        await this.saveForecast(
          forecastDateStr,
          environment,
          highLoadForecast,
          highLoadForecast * 0.9,
          highLoadForecast * 1.1,
          ForecastScenario.HIGH_LOAD
        );

        // Insert low load scenario
        await this.saveForecast(
          forecastDateStr,
          environment,
          lowLoadForecast,
          lowLoadForecast * 0.9,
          lowLoadForecast * 1.1,
          ForecastScenario.LOW_LOAD
        );
      }

      logger.info(`Generated forecasts for ${daysToForecast} days for environment: ${environment}`);
    } catch (error: any) {
      logger.error('Error generating forecasts:', error.message);
      throw error;
    }
  }

  /**
   * Save forecast to database
   */
  private async saveForecast(
    forecastDate: string,
    environment: string,
    predictedCost: number,
    confidenceLower: number,
    confidenceUpper: number,
    scenario: ForecastScenario
  ): Promise<void> {
    await query(
      `INSERT INTO cost_forecasts (forecast_date, environment, predicted_cost, confidence_lower, confidence_upper, scenario)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (forecast_date, environment, scenario)
       DO UPDATE SET
       predicted_cost = EXCLUDED.predicted_cost,
       confidence_lower = EXCLUDED.confidence_lower,
       confidence_upper = EXCLUDED.confidence_upper`,
      [forecastDate, environment, predictedCost, confidenceLower, confidenceUpper, scenario]
    );
  }

  /**
   * Calculate moving average
   */
  private calculateMovingAverage(data: number[], window: number): number {
    const recentData = data.slice(-window);
    const sum = recentData.reduce((acc, val) => acc + val, 0);
    return sum / recentData.length;
  }

  /**
   * Calculate standard deviation
   */
  private calculateStdDev(data: number[]): number {
    const mean = data.reduce((acc, val) => acc + val, 0) / data.length;
    const squaredDiffs = data.map(val => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / data.length;
    return Math.sqrt(variance);
  }

  /**
   * Calculate ICS credit burn rate
   */
  async calculateICSBurnRate(): Promise<{ balance: number; burnRate: number }> {
    try {
      // Get current ICS balance
      const balanceResult = await query('SELECT balance FROM ics_credits ORDER BY last_updated DESC LIMIT 1');
      const currentBalance = balanceResult.rows.length > 0 ? parseFloat(balanceResult.rows[0].balance) : 0;

      // Calculate average daily ICS usage over last 30 days
      const usageResult = await query(
        `SELECT AVG(ics_credits_applied) as avg_daily_usage
         FROM cost_records
         WHERE date >= CURRENT_DATE - INTERVAL '30 days'
         AND ics_credits_applied > 0`
      );

      const burnRate = usageResult.rows.length > 0 ? parseFloat(usageResult.rows[0].avg_daily_usage || '0') : 0;

      return { balance: currentBalance, burnRate };
    } catch (error: any) {
      logger.error('Error calculating ICS burn rate:', error.message);
      throw error;
    }
  }

  /**
   * Detect cost anomalies (costs exceeding 2 std deviations)
   */
  async detectAnomalies(environment: string, days: number = 7): Promise<any[]> {
    try {
      const historicalData = await query(
        `SELECT date, SUM(cost_usd) as daily_cost
         FROM cost_records
         WHERE environment = $1
         AND date >= CURRENT_DATE - INTERVAL '30 days'
         GROUP BY date
         ORDER BY date ASC`,
        [environment]
      );

      const dailyCosts = historicalData.rows.map(row => ({
        date: row.date,
        cost: parseFloat(row.daily_cost),
      }));

      const costs = dailyCosts.map(d => d.cost);
      const mean = costs.reduce((acc, val) => acc + val, 0) / costs.length;
      const stdDev = this.calculateStdDev(costs);

      const threshold = mean + (2 * stdDev);
      const anomalies = dailyCosts.filter(d => d.cost > threshold);

      logger.info(`Detected ${anomalies.length} cost anomalies for environment: ${environment}`);
      return anomalies;
    } catch (error: any) {
      logger.error('Error detecting anomalies:', error.message);
      throw error;
    }
  }
}

export default new ForecastService();
