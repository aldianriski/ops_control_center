import { Request, Response } from 'express';
import { query } from '../config/database';
import logger from '../config/logger';

export const getEvidence = async (req: Request, res: Response) => {
  try {
    const { incident_id } = req.params;

    const result = await query(
      'SELECT * FROM evidence WHERE incident_id = $1 ORDER BY created_at DESC',
      [incident_id]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error: any) {
    logger.error('Error getting evidence:', error.message);
    res.status(500).json({ success: false, error: 'Failed to get evidence' });
  }
};

export const createEvidence = async (req: Request, res: Response) => {
  try {
    const { incident_id } = req.params;
    const { title, evidence_type, content, file_path, source_url, metadata } = req.body;
    const created_by = (req as any).user?.email || 'system';

    const result = await query(
      `INSERT INTO evidence (incident_id, title, evidence_type, content, file_path, source_url, metadata, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [incident_id, title, evidence_type, content, file_path, source_url, JSON.stringify(metadata), created_by]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error: any) {
    logger.error('Error creating evidence:', error.message);
    res.status(500).json({ success: false, error: 'Failed to create evidence' });
  }
};

export const getInfraMetrics = async (req: Request, res: Response) => {
  try {
    const { environment, metric_type, hours = 24 } = req.query;

    let sql = 'SELECT * FROM infra_metrics WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (environment) {
      sql += ` AND environment = $${paramIndex}`;
      params.push(environment);
      paramIndex++;
    }

    if (metric_type) {
      sql += ` AND metric_type = $${paramIndex}`;
      params.push(metric_type);
      paramIndex++;
    }

    sql += ` AND timestamp >= NOW() - INTERVAL '${hours} hours'`;
    sql += ' ORDER BY timestamp DESC LIMIT 1000';

    const result = await query(sql, params);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error: any) {
    logger.error('Error getting infra metrics:', error.message);
    res.status(500).json({ success: false, error: 'Failed to get infra metrics' });
  }
};
