import { Request, Response } from 'express';
import { query } from '../config/database';
import logger from '../config/logger';

export const getTimelineEvents = async (req: Request, res: Response) => {
  try {
    const { environment, team, event_type, limit = 50, offset = 0 } = req.query;

    let sql = 'SELECT * FROM timeline_events WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (environment) {
      sql += ` AND environment = $${paramIndex}`;
      params.push(environment);
      paramIndex++;
    }

    if (team) {
      sql += ` AND team = $${paramIndex}`;
      params.push(team);
      paramIndex++;
    }

    if (event_type) {
      sql += ` AND event_type = $${paramIndex}`;
      params.push(event_type);
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
    logger.error('Error getting timeline events:', error.message);
    res.status(500).json({ success: false, error: 'Failed to get timeline events' });
  }
};

export const createTimelineEvent = async (req: Request, res: Response) => {
  try {
    const {
      event_type,
      title,
      description,
      severity,
      environment,
      team,
      source_type,
      source_id,
      metadata,
      created_by,
    } = req.body;

    const result = await query(
      `INSERT INTO timeline_events (event_type, title, description, severity, environment, team, source_type, source_id, metadata, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [event_type, title, description, severity, environment, team, source_type, source_id, JSON.stringify(metadata), created_by]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error: any) {
    logger.error('Error creating timeline event:', error.message);
    res.status(500).json({ success: false, error: 'Failed to create timeline event' });
  }
};
