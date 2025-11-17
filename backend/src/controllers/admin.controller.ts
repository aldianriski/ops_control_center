import { Request, Response } from 'express';
import { query } from '../config/database';
import logger from '../config/logger';
import jiraService from '../services/jira.service';
import awsService from '../services/aws.service';

export const getIntegrationStatus = async (req: Request, res: Response) => {
  try {
    const result = await query('SELECT * FROM integration_status ORDER BY integration_name');

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error: any) {
    logger.error('Error getting integration status:', error.message);
    res.status(500).json({ success: false, error: 'Failed to get integration status' });
  }
};

export const testIntegration = async (req: Request, res: Response) => {
  try {
    const { integration } = req.params;

    let testResult = false;

    switch (integration) {
      case 'jira':
        testResult = await jiraService.testConnection();
        break;
      case 'aws_cost_explorer':
        testResult = await awsService.testConnection();
        break;
      default:
        return res.status(400).json({ success: false, error: 'Unknown integration' });
    }

    await query(
      `UPDATE integration_status
       SET status = $1, last_sync = CURRENT_TIMESTAMP
       WHERE integration_name = $2`,
      [testResult ? 'active' : 'error', integration]
    );

    res.json({
      success: true,
      data: { connected: testResult },
    });
  } catch (error: any) {
    logger.error('Error testing integration:', error.message);
    res.status(500).json({ success: false, error: 'Failed to test integration' });
  }
};

export const getSyncLogs = async (req: Request, res: Response) => {
  try {
    const { integration, limit = 50 } = req.query;

    let sql = 'SELECT * FROM sync_logs WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (integration) {
      sql += ` AND integration_name = $${paramIndex}`;
      params.push(integration);
      paramIndex++;
    }

    sql += ` ORDER BY started_at DESC LIMIT $${paramIndex}`;
    params.push(limit);

    const result = await query(sql, params);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error: any) {
    logger.error('Error getting sync logs:', error.message);
    res.status(500).json({ success: false, error: 'Failed to get sync logs' });
  }
};
