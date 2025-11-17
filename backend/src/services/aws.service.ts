import axios from 'axios';
import logger from '../config/logger';
import { query } from '../config/database';
import crypto from 'crypto';

interface AWSCredentials {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
}

class AWSService {
  private credentials: AWSCredentials;
  private costExplorerEndpoint: string;

  constructor() {
    this.credentials = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      region: process.env.AWS_REGION || 'us-east-1',
    };
    this.costExplorerEndpoint = `https://ce.${this.credentials.region}.amazonaws.com`;
  }

  /**
   * Sync AWS costs from Cost Explorer
   */
  async syncCosts(startDate: string, endDate: string): Promise<number> {
    try {
      logger.info(`Syncing AWS costs from ${startDate} to ${endDate}...`);

      const costs = await this.getCostAndUsage(startDate, endDate);
      let syncedCount = 0;

      for (const result of costs.ResultsByTime || []) {
        const date = result.TimePeriod.Start;

        // Parse cost by service and environment (using tags)
        for (const group of result.Groups || []) {
          const service = group.Keys[0] || 'Unknown';
          const environment = group.Keys[1] || 'Unknown';
          const cost = parseFloat(group.Metrics.UnblendedCost.Amount);

          if (cost > 0) {
            await query(
              `INSERT INTO cost_records (date, environment, service, cost_usd)
               VALUES ($1, $2, $3, $4)
               ON CONFLICT (date, environment, service, resource)
               WHERE resource IS NULL
               DO UPDATE SET cost_usd = EXCLUDED.cost_usd`,
              [date, environment, service, cost]
            );

            syncedCount++;
          }
        }
      }

      logger.info(`Synced ${syncedCount} cost records from AWS`);
      return syncedCount;
    } catch (error: any) {
      logger.error('Error syncing costs from AWS:', error.message);
      throw error;
    }
  }

  /**
   * Get cost and usage data from AWS Cost Explorer
   */
  private async getCostAndUsage(startDate: string, endDate: string): Promise<any> {
    const payload = {
      TimePeriod: {
        Start: startDate,
        End: endDate,
      },
      Granularity: 'DAILY',
      Metrics: ['UnblendedCost'],
      GroupBy: [
        {
          Type: 'DIMENSION',
          Key: 'SERVICE',
        },
        {
          Type: 'TAG',
          Key: 'Environment',
        },
      ],
    };

    try {
      const response = await this.makeAwsRequest('GetCostAndUsage', payload);
      return response;
    } catch (error: any) {
      logger.error('Error getting cost and usage:', error.message);
      throw error;
    }
  }

  /**
   * Update ICS credits
   */
  async updateICSCredits(balance: number, burnRatePerDay: number): Promise<void> {
    try {
      const remainingDays = burnRatePerDay > 0 ? Math.floor(balance / burnRatePerDay) : 999;

      await query(
        `INSERT INTO ics_credits (id, balance, burn_rate_per_day, remaining_days)
         VALUES (uuid_generate_v4(), $1, $2, $3)
         ON CONFLICT (id) DO UPDATE SET
         balance = EXCLUDED.balance,
         burn_rate_per_day = EXCLUDED.burn_rate_per_day,
         remaining_days = EXCLUDED.remaining_days,
         last_updated = CURRENT_TIMESTAMP`,
        [balance, burnRatePerDay, remainingDays]
      );

      logger.info(`Updated ICS credits: balance=${balance}, burn_rate=${burnRatePerDay}`);
    } catch (error: any) {
      logger.error('Error updating ICS credits:', error.message);
      throw error;
    }
  }

  /**
   * Calculate monthly budget variance
   */
  async calculateMonthlyBudgets(month: string): Promise<void> {
    try {
      const result = await query(
        `SELECT environment, SUM(cost_usd) as total_cost
         FROM cost_records
         WHERE DATE_TRUNC('month', date) = $1
         GROUP BY environment`,
        [month]
      );

      for (const row of result.rows) {
        const environment = row.environment;
        const actualCost = parseFloat(row.total_cost);

        // Get budget for this environment (you may want to store this in a config table)
        const budgetResult = await query(
          `SELECT budget_usd FROM monthly_budgets
           WHERE month = $1 AND environment = $2`,
          [month, environment]
        );

        if (budgetResult.rows.length > 0) {
          const budget = parseFloat(budgetResult.rows[0].budget_usd);
          const variance = actualCost - budget;
          const variancePercentage = (variance / budget) * 100;

          await query(
            `UPDATE monthly_budgets
             SET actual_usd = $1, variance_usd = $2, variance_percentage = $3
             WHERE month = $4 AND environment = $5`,
            [actualCost, variance, variancePercentage, month, environment]
          );
        }
      }

      logger.info(`Calculated monthly budgets for ${month}`);
    } catch (error: any) {
      logger.error('Error calculating monthly budgets:', error.message);
      throw error;
    }
  }

  /**
   * Make signed AWS API request (AWS Signature V4)
   */
  private async makeAwsRequest(operation: string, payload: any): Promise<any> {
    const service = 'ce';
    const host = `${service}.${this.credentials.region}.amazonaws.com`;
    const amzTarget = `AWSInsightsIndexService.${operation}`;
    const contentType = 'application/x-amz-json-1.1';

    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.substr(0, 8);

    const payloadString = JSON.stringify(payload);
    const payloadHash = crypto.createHash('sha256').update(payloadString).digest('hex');

    // Create canonical request
    const canonicalHeaders = `content-type:${contentType}\nhost:${host}\nx-amz-date:${amzDate}\nx-amz-target:${amzTarget}\n`;
    const signedHeaders = 'content-type;host;x-amz-date;x-amz-target';
    const canonicalRequest = `POST\n/\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;

    // Create string to sign
    const algorithm = 'AWS4-HMAC-SHA256';
    const credentialScope = `${dateStamp}/${this.credentials.region}/${service}/aws4_request`;
    const canonicalRequestHash = crypto.createHash('sha256').update(canonicalRequest).digest('hex');
    const stringToSign = `${algorithm}\n${amzDate}\n${credentialScope}\n${canonicalRequestHash}`;

    // Calculate signature
    const kDate = crypto.createHmac('sha256', `AWS4${this.credentials.secretAccessKey}`).update(dateStamp).digest();
    const kRegion = crypto.createHmac('sha256', kDate).update(this.credentials.region).digest();
    const kService = crypto.createHmac('sha256', kRegion).update(service).digest();
    const kSigning = crypto.createHmac('sha256', kService).update('aws4_request').digest();
    const signature = crypto.createHmac('sha256', kSigning).update(stringToSign).digest('hex');

    // Create authorization header
    const authorizationHeader = `${algorithm} Credential=${this.credentials.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    try {
      const response = await axios.post(`https://${host}/`, payloadString, {
        headers: {
          'Content-Type': contentType,
          'X-Amz-Date': amzDate,
          'X-Amz-Target': amzTarget,
          'Authorization': authorizationHeader,
        },
      });

      return response.data;
    } catch (error: any) {
      logger.error(`AWS API error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Test AWS connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      await this.getCostAndUsage(startDate, endDate);
      logger.info('AWS Cost Explorer connection test successful');
      return true;
    } catch (error: any) {
      logger.error('AWS Cost Explorer connection test failed:', error.message);
      return false;
    }
  }
}

export default new AWSService();
