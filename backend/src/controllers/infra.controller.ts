import { Request, Response } from 'express';
import { query } from '../config/database';
import logger from '../config/logger';

export const getIncidents = async (req: Request, res: Response) => {
  try {
    const { severity, status, squad, limit = 100, offset = 0 } = req.query;

    let sql = 'SELECT * FROM incidents WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (severity) {
      sql += ` AND severity = $${paramIndex}`;
      params.push(severity);
      paramIndex++;
    }

    if (status) {
      sql += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (squad) {
      sql += ` AND squad = $${paramIndex}`;
      params.push(squad);
      paramIndex++;
    }

    sql += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await query(sql, params);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        total: result.rowCount,
      },
    });
  } catch (error: any) {
    logger.error('Error getting incidents:', error.message);
    res.status(500).json({ success: false, error: 'Failed to get incidents' });
  }
};

export const getTasks = async (req: Request, res: Response) => {
  try {
    const { status, squad, limit = 100, offset = 0 } = req.query;

    let sql = 'SELECT * FROM tasks WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (status) {
      sql += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (squad) {
      sql += ` AND squad = $${paramIndex}`;
      params.push(squad);
      paramIndex++;
    }

    sql += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await query(sql, params);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        total: result.rowCount,
      },
    });
  } catch (error: any) {
    logger.error('Error getting tasks:', error.message);
    res.status(500).json({ success: false, error: 'Failed to get tasks' });
  }
};

export const getUptimeRequests = async (req: Request, res: Response) => {
  try {
    const { environment, limit = 100, offset = 0 } = req.query;

    let sql = 'SELECT * FROM uptime_requests WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (environment) {
      sql += ` AND environment = $${paramIndex}`;
      params.push(environment);
      paramIndex++;
    }

    sql += ` ORDER BY window_start DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await query(sql, params);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        total: result.rowCount,
      },
    });
  } catch (error: any) {
    logger.error('Error getting uptime requests:', error.message);
    res.status(500).json({ success: false, error: 'Failed to get uptime requests' });
  }
};

export const getSLAMetrics = async (req: Request, res: Response) => {
  try {
    const { weeks = 12 } = req.query;

    const result = await query(
      `SELECT * FROM sla_metrics
       ORDER BY week_start DESC
       LIMIT $1`,
      [weeks]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error: any) {
    logger.error('Error getting SLA metrics:', error.message);
    res.status(500).json({ success: false, error: 'Failed to get SLA metrics' });
  }
};
