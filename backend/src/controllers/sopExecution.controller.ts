import { Request, Response } from 'express';
import { query } from '../config/database';
import logger from '../config/logger';

export const getSOPExecutions = async (req: Request, res: Response) => {
  try {
    const { sop_id, status, environment } = req.query;

    let sql = 'SELECT * FROM sop_executions WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (sop_id) {
      sql += ` AND sop_id = $${paramIndex}`;
      params.push(sop_id);
      paramIndex++;
    }

    if (status) {
      sql += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (environment) {
      sql += ` AND environment = $${paramIndex}`;
      params.push(environment);
      paramIndex++;
    }

    sql += ' ORDER BY started_at DESC';

    const result = await query(sql, params);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error: any) {
    logger.error('Error getting SOP executions:', error.message);
    res.status(500).json({ success: false, error: 'Failed to get SOP executions' });
  }
};

export const startSOPExecution = async (req: Request, res: Response) => {
  try {
    const { sop_id, environment } = req.body;
    const executed_by = (req as any).user?.email || 'unknown';

    const result = await query(
      `INSERT INTO sop_executions (sop_id, executed_by, environment, status, steps_completed)
       VALUES ($1, $2, $3, 'in_progress', '[]'::jsonb)
       RETURNING *`,
      [sop_id, executed_by, environment]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error: any) {
    logger.error('Error starting SOP execution:', error.message);
    res.status(500).json({ success: false, error: 'Failed to start SOP execution' });
  }
};

export const updateSOPExecution = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { steps_completed, evidence, status, notes } = req.body;

    let updateFields = [];
    let params: any[] = [];
    let paramIndex = 1;

    if (steps_completed !== undefined) {
      updateFields.push(`steps_completed = $${paramIndex}`);
      params.push(JSON.stringify(steps_completed));
      paramIndex++;
    }

    if (evidence !== undefined) {
      updateFields.push(`evidence = $${paramIndex}`);
      params.push(JSON.stringify(evidence));
      paramIndex++;
    }

    if (status !== undefined) {
      updateFields.push(`status = $${paramIndex}`);
      params.push(status);
      paramIndex++;

      if (status === 'completed') {
        updateFields.push(`completed_at = NOW()`);
      }
    }

    if (notes !== undefined) {
      updateFields.push(`notes = $${paramIndex}`);
      params.push(notes);
      paramIndex++;
    }

    params.push(id);

    const result = await query(
      `UPDATE sop_executions
       SET ${updateFields.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'SOP execution not found' });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error: any) {
    logger.error('Error updating SOP execution:', error.message);
    res.status(500).json({ success: false, error: 'Failed to update SOP execution' });
  }
};
