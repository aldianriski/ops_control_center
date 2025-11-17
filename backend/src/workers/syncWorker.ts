import cron from 'node-cron';
import logger from '../config/logger';
import jiraService from '../services/jira.service';
import awsService from '../services/aws.service';
import forecastService from '../services/forecast.service';
import { query } from '../config/database';

class SyncWorker {
  private syncInterval: string;

  constructor() {
    this.syncInterval = process.env.SYNC_INTERVAL_CRON || '0 */6 * * *'; // Every 6 hours by default
  }

  /**
   * Start all sync workers
   */
  start(): void {
    logger.info('Starting sync workers...');

    // Schedule Jira sync
    cron.schedule(this.syncInterval, async () => {
      await this.runJiraSync();
    });

    // Schedule AWS sync
    cron.schedule(this.syncInterval, async () => {
      await this.runAWSSync();
    });

    // Schedule forecast generation (daily at 2 AM)
    cron.schedule('0 2 * * *', async () => {
      await this.runForecastGeneration();
    });

    // Schedule SLA calculation (weekly on Monday at 3 AM)
    cron.schedule('0 3 * * 1', async () => {
      await this.calculateWeeklySLA();
    });

    logger.info('Sync workers started successfully');

    // Run initial sync
    this.runInitialSync();
  }

  /**
   * Run initial sync on startup
   */
  private async runInitialSync(): Promise<void> {
    logger.info('Running initial sync...');
    setTimeout(async () => {
      await this.runJiraSync();
      await this.runAWSSync();
      await this.runForecastGeneration();
    }, 5000); // Wait 5 seconds after startup
  }

  /**
   * Sync data from Jira
   */
  private async runJiraSync(): Promise<void> {
    const syncId = await this.logSyncStart('jira', 'full_sync');

    try {
      logger.info('Starting Jira sync...');

      const incidentsCount = await jiraService.syncIncidents();
      const tasksCount = await jiraService.syncTasks();
      const uptimeCount = await jiraService.syncUptimeRequests();

      const totalRecords = incidentsCount + tasksCount + uptimeCount;

      await this.logSyncComplete(syncId, totalRecords, 'success');
      await this.updateIntegrationStatus('jira', 'active', null);

      logger.info(`Jira sync completed: ${totalRecords} records synced`);
    } catch (error: any) {
      logger.error('Jira sync failed:', error.message);
      await this.logSyncComplete(syncId, 0, 'failed', error.message);
      await this.updateIntegrationStatus('jira', 'error', error.message);
    }
  }

  /**
   * Sync data from AWS
   */
  private async runAWSSync(): Promise<void> {
    const syncId = await this.logSyncStart('aws_cost_explorer', 'cost_sync');

    try {
      logger.info('Starting AWS cost sync...');

      // Sync last 7 days of costs
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const recordsCount = await awsService.syncCosts(startDate, endDate);

      // Update monthly budgets
      const currentMonth = new Date().toISOString().slice(0, 7) + '-01';
      await awsService.calculateMonthlyBudgets(currentMonth);

      await this.logSyncComplete(syncId, recordsCount, 'success');
      await this.updateIntegrationStatus('aws_cost_explorer', 'active', null);

      logger.info(`AWS cost sync completed: ${recordsCount} records synced`);
    } catch (error: any) {
      logger.error('AWS cost sync failed:', error.message);
      await this.logSyncComplete(syncId, 0, 'failed', error.message);
      await this.updateIntegrationStatus('aws_cost_explorer', 'error', error.message);
    }
  }

  /**
   * Generate forecasts
   */
  private async runForecastGeneration(): Promise<void> {
    try {
      logger.info('Starting forecast generation...');

      // Get all environments
      const environments = await query(
        `SELECT DISTINCT environment FROM cost_records WHERE date >= CURRENT_DATE - INTERVAL '30 days'`
      );

      for (const row of environments.rows) {
        await forecastService.generateForecasts(row.environment, 30);
      }

      logger.info('Forecast generation completed');
    } catch (error: any) {
      logger.error('Forecast generation failed:', error.message);
    }
  }

  /**
   * Calculate weekly SLA
   */
  private async calculateWeeklySLA(): Promise<void> {
    try {
      logger.info('Calculating weekly SLA...');

      // Get last week's data
      const lastWeekStart = new Date();
      lastWeekStart.setDate(lastWeekStart.getDate() - 7);
      const lastWeekEnd = new Date();

      const result = await query(
        `SELECT
           SUM(requested_hours) as total_requested,
           SUM(delivered_hours) as total_delivered
         FROM uptime_requests
         WHERE window_start >= $1 AND window_start < $2`,
        [lastWeekStart, lastWeekEnd]
      );

      if (result.rows.length > 0 && result.rows[0].total_requested > 0) {
        const totalRequested = parseFloat(result.rows[0].total_requested);
        const totalDelivered = parseFloat(result.rows[0].total_delivered);
        const slaPercentage = (totalDelivered / totalRequested) * 100;

        await query(
          `INSERT INTO sla_metrics (week_start, week_end, total_requested_hours, total_delivered_hours, sla_percentage)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (week_start, week_end) DO UPDATE SET
           total_requested_hours = EXCLUDED.total_requested_hours,
           total_delivered_hours = EXCLUDED.total_delivered_hours,
           sla_percentage = EXCLUDED.sla_percentage`,
          [lastWeekStart, lastWeekEnd, totalRequested, totalDelivered, slaPercentage]
        );

        logger.info(`Weekly SLA calculated: ${slaPercentage.toFixed(2)}%`);
      }
    } catch (error: any) {
      logger.error('Weekly SLA calculation failed:', error.message);
    }
  }

  /**
   * Log sync start
   */
  private async logSyncStart(integrationName: string, syncType: string): Promise<string> {
    const result = await query(
      `INSERT INTO sync_logs (integration_name, sync_type, status, started_at)
       VALUES ($1, $2, 'success', CURRENT_TIMESTAMP)
       RETURNING id`,
      [integrationName, syncType]
    );

    return result.rows[0].id;
  }

  /**
   * Log sync completion
   */
  private async logSyncComplete(
    syncId: string,
    recordsSynced: number,
    status: string,
    errorMessage?: string
  ): Promise<void> {
    await query(
      `UPDATE sync_logs
       SET status = $1, records_synced = $2, error_message = $3, completed_at = CURRENT_TIMESTAMP
       WHERE id = $4`,
      [status, recordsSynced, errorMessage || null, syncId]
    );
  }

  /**
   * Update integration status
   */
  private async updateIntegrationStatus(
    integrationName: string,
    status: string,
    lastError: string | null
  ): Promise<void> {
    await query(
      `UPDATE integration_status
       SET status = $1, last_sync = CURRENT_TIMESTAMP, last_error = $2
       WHERE integration_name = $3`,
      [status, lastError, integrationName]
    );
  }
}

export default new SyncWorker();
