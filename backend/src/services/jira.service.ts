import axios, { AxiosInstance } from 'axios';
import logger from '../config/logger';
import { query } from '../config/database';
import { Incident, Task, UptimeRequest, IncidentSeverity, IncidentStatus, TaskStatus } from '../types';

class JiraService {
  private client: AxiosInstance;
  private baseUrl: string;
  private email: string;
  private apiToken: string;
  private projectKey: string;

  constructor() {
    this.baseUrl = process.env.JIRA_BASE_URL || '';
    this.email = process.env.JIRA_EMAIL || '';
    this.apiToken = process.env.JIRA_API_TOKEN || '';
    this.projectKey = process.env.JIRA_PROJECT_KEY || 'INFRA';

    this.client = axios.create({
      baseURL: this.baseUrl,
      auth: {
        username: this.email,
        password: this.apiToken,
      },
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Sync incidents from Jira
   */
  async syncIncidents(): Promise<number> {
    try {
      logger.info('Syncing incidents from Jira...');

      const jql = `project = ${this.projectKey} AND type = Incident ORDER BY created DESC`;
      const response = await this.client.get('/rest/api/3/search', {
        params: {
          jql,
          maxResults: 100,
          fields: 'summary,description,priority,status,created,resolutiondate,customfield_10001',
        },
      });

      const issues = response.data.issues || [];
      let syncedCount = 0;

      for (const issue of issues) {
        const severity = this.mapPriorityToSeverity(issue.fields.priority?.name);
        const status = this.mapJiraStatusToIncidentStatus(issue.fields.status?.name);
        const squad = issue.fields.customfield_10001 || 'Unknown';

        await query(
          `INSERT INTO incidents (jira_id, title, description, severity, status, squad, created_at, resolved_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (jira_id) DO UPDATE SET
           title = EXCLUDED.title,
           description = EXCLUDED.description,
           severity = EXCLUDED.severity,
           status = EXCLUDED.status,
           squad = EXCLUDED.squad,
           resolved_at = EXCLUDED.resolved_at`,
          [
            issue.key,
            issue.fields.summary,
            issue.fields.description || '',
            severity,
            status,
            squad,
            new Date(issue.fields.created),
            issue.fields.resolutiondate ? new Date(issue.fields.resolutiondate) : null,
          ]
        );

        syncedCount++;
      }

      logger.info(`Synced ${syncedCount} incidents from Jira`);
      return syncedCount;
    } catch (error: any) {
      logger.error('Error syncing incidents from Jira:', error.message);
      throw error;
    }
  }

  /**
   * Sync tasks from Jira
   */
  async syncTasks(): Promise<number> {
    try {
      logger.info('Syncing tasks from Jira...');

      const jql = `project = ${this.projectKey} AND type IN (Task, Story, Bug) ORDER BY created DESC`;
      const response = await this.client.get('/rest/api/3/search', {
        params: {
          jql,
          maxResults: 100,
          fields: 'summary,description,status,assignee,customfield_10001',
        },
      });

      const issues = response.data.issues || [];
      let syncedCount = 0;

      for (const issue of issues) {
        const status = this.mapJiraStatusToTaskStatus(issue.fields.status?.name);
        const squad = issue.fields.customfield_10001 || 'Unknown';
        const assignee = issue.fields.assignee?.displayName || null;

        await query(
          `INSERT INTO tasks (jira_id, title, description, status, squad, assignee)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (jira_id) DO UPDATE SET
           title = EXCLUDED.title,
           description = EXCLUDED.description,
           status = EXCLUDED.status,
           squad = EXCLUDED.squad,
           assignee = EXCLUDED.assignee`,
          [
            issue.key,
            issue.fields.summary,
            issue.fields.description || '',
            status,
            squad,
            assignee,
          ]
        );

        syncedCount++;
      }

      logger.info(`Synced ${syncedCount} tasks from Jira`);
      return syncedCount;
    } catch (error: any) {
      logger.error('Error syncing tasks from Jira:', error.message);
      throw error;
    }
  }

  /**
   * Sync uptime requests from Jira
   */
  async syncUptimeRequests(): Promise<number> {
    try {
      logger.info('Syncing uptime requests from Jira...');

      const jql = `project = ${this.projectKey} AND type = "Uptime Request" ORDER BY created DESC`;
      const response = await this.client.get('/rest/api/3/search', {
        params: {
          jql,
          maxResults: 100,
          fields: 'summary,customfield_10002,customfield_10003,customfield_10004,customfield_10005,customfield_10006',
        },
      });

      const issues = response.data.issues || [];
      let syncedCount = 0;

      for (const issue of issues) {
        const requester = issue.fields.customfield_10002 || 'Unknown';
        const environment = issue.fields.customfield_10003 || 'Unknown';
        const requestedHours = parseFloat(issue.fields.customfield_10004 || '0');
        const deliveredHours = parseFloat(issue.fields.customfield_10005 || '0');
        const windowStart = issue.fields.customfield_10006?.start || new Date();
        const windowEnd = issue.fields.customfield_10006?.end || new Date();

        const slaMet = deliveredHours >= requestedHours;

        await query(
          `INSERT INTO uptime_requests (jira_id, requester, environment, requested_hours, delivered_hours, sla_met, window_start, window_end)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (jira_id) DO UPDATE SET
           requester = EXCLUDED.requester,
           environment = EXCLUDED.environment,
           requested_hours = EXCLUDED.requested_hours,
           delivered_hours = EXCLUDED.delivered_hours,
           sla_met = EXCLUDED.sla_met,
           window_start = EXCLUDED.window_start,
           window_end = EXCLUDED.window_end`,
          [
            issue.key,
            requester,
            environment,
            requestedHours,
            deliveredHours,
            slaMet,
            windowStart,
            windowEnd,
          ]
        );

        syncedCount++;
      }

      logger.info(`Synced ${syncedCount} uptime requests from Jira`);
      return syncedCount;
    } catch (error: any) {
      logger.error('Error syncing uptime requests from Jira:', error.message);
      throw error;
    }
  }

  /**
   * Map Jira priority to incident severity
   */
  private mapPriorityToSeverity(priority?: string): IncidentSeverity {
    if (!priority) return IncidentSeverity.MEDIUM;

    const priorityLower = priority.toLowerCase();
    if (priorityLower.includes('critical') || priorityLower.includes('highest')) {
      return IncidentSeverity.CRITICAL;
    } else if (priorityLower.includes('high')) {
      return IncidentSeverity.HIGH;
    } else if (priorityLower.includes('low') || priorityLower.includes('lowest')) {
      return IncidentSeverity.LOW;
    }
    return IncidentSeverity.MEDIUM;
  }

  /**
   * Map Jira status to incident status
   */
  private mapJiraStatusToIncidentStatus(status?: string): IncidentStatus {
    if (!status) return IncidentStatus.OPEN;

    const statusLower = status.toLowerCase();
    if (statusLower.includes('in progress') || statusLower.includes('investigating')) {
      return IncidentStatus.IN_PROGRESS;
    } else if (statusLower.includes('resolved') || statusLower.includes('fixed')) {
      return IncidentStatus.RESOLVED;
    } else if (statusLower.includes('closed') || statusLower.includes('done')) {
      return IncidentStatus.CLOSED;
    }
    return IncidentStatus.OPEN;
  }

  /**
   * Map Jira status to task status
   */
  private mapJiraStatusToTaskStatus(status?: string): TaskStatus {
    if (!status) return TaskStatus.TODO;

    const statusLower = status.toLowerCase();
    if (statusLower.includes('in progress')) {
      return TaskStatus.IN_PROGRESS;
    } else if (statusLower.includes('blocked') || statusLower.includes('waiting')) {
      return TaskStatus.BLOCKED;
    } else if (statusLower.includes('done') || statusLower.includes('closed')) {
      return TaskStatus.DONE;
    }
    return TaskStatus.TODO;
  }

  /**
   * Test Jira connection
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.client.get('/rest/api/3/myself');
      logger.info('Jira connection test successful');
      return true;
    } catch (error: any) {
      logger.error('Jira connection test failed:', error.message);
      return false;
    }
  }
}

export default new JiraService();
