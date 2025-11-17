import { Request, Response } from 'express';
import { query } from '../config/database';
import logger from '../config/logger';

export const getSOPs = async (req: Request, res: Response) => {
  try {
    const { category, tags, search } = req.query;

    let sql = 'SELECT * FROM sops WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (category) {
      sql += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (tags) {
      const tagsArray = (tags as string).split(',');
      sql += ` AND tags && $${paramIndex}`;
      params.push(tagsArray);
      paramIndex++;
    }

    if (search) {
      sql += ` AND (title ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    sql += ' ORDER BY created_at DESC';

    const result = await query(sql, params);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error: any) {
    logger.error('Error getting SOPs:', error.message);
    res.status(500).json({ success: false, error: 'Failed to get SOPs' });
  }
};

export const getSOPById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query('SELECT * FROM sops WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'SOP not found' });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error: any) {
    logger.error('Error getting SOP:', error.message);
    res.status(500).json({ success: false, error: 'Failed to get SOP' });
  }
};

export const createSOP = async (req: Request, res: Response) => {
  try {
    const { title, description, category, steps, tags } = req.body;

    const result = await query(
      `INSERT INTO sops (title, description, category, steps, tags)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [title, description, category, JSON.stringify(steps), tags]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error: any) {
    logger.error('Error creating SOP:', error.message);
    res.status(500).json({ success: false, error: 'Failed to create SOP' });
  }
};

export const updateSOP = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, category, steps, tags } = req.body;

    const result = await query(
      `UPDATE sops
       SET title = $1, description = $2, category = $3, steps = $4, tags = $5
       WHERE id = $6
       RETURNING *`,
      [title, description, category, JSON.stringify(steps), tags, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'SOP not found' });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error: any) {
    logger.error('Error updating SOP:', error.message);
    res.status(500).json({ success: false, error: 'Failed to update SOP' });
  }
};
