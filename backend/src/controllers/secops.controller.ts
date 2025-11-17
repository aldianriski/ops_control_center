import { Request, Response } from 'express';
import { query } from '../config/database';
import logger from '../config/logger';

export const getVulnerabilities = async (req: Request, res: Response) => {
  try {
    const { severity, status, system, limit = 100, offset = 0 } = req.query;

    let sql = 'SELECT * FROM vulnerabilities WHERE 1=1';
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

    if (system) {
      sql += ` AND system = $${paramIndex}`;
      params.push(system);
      paramIndex++;
    }

    sql += ` ORDER BY discovered_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
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
    logger.error('Error getting vulnerabilities:', error.message);
    res.status(500).json({ success: false, error: 'Failed to get vulnerabilities' });
  }
};

export const getSecurityIncidents = async (req: Request, res: Response) => {
  try {
    const { severity, status, limit = 100, offset = 0 } = req.query;

    let sql = 'SELECT * FROM security_incidents WHERE 1=1';
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
    logger.error('Error getting security incidents:', error.message);
    res.status(500).json({ success: false, error: 'Failed to get security incidents' });
  }
};
