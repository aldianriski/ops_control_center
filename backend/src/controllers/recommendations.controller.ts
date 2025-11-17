import { Request, Response } from 'express';
import { query } from '../config/database';
import logger from '../config/logger';

export const getRecommendations = async (req: Request, res: Response) => {
  try {
    const { environment, status, recommendation_type, limit = 50 } = req.query;

    let sql = 'SELECT * FROM finops_recommendations WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (environment) {
      sql += ` AND environment = $${paramIndex}`;
      params.push(environment);
      paramIndex++;
    }

    if (status) {
      sql += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (recommendation_type) {
      sql += ` AND recommendation_type = $${paramIndex}`;
      params.push(recommendation_type);
      paramIndex++;
    }

    sql += ` ORDER BY created_at DESC LIMIT $${paramIndex}`;
    params.push(limit);

    const result = await query(sql, params);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error: any) {
    logger.error('Error getting recommendations:', error.message);
    res.status(500).json({ success: false, error: 'Failed to get recommendations' });
  }
};

export const createRecommendation = async (req: Request, res: Response) => {
  try {
    const {
      environment,
      recommendation_type,
      title,
      description,
      estimated_savings,
      impact,
      source,
      metadata,
    } = req.body;

    const result = await query(
      `INSERT INTO finops_recommendations (environment, recommendation_type, title, description, estimated_savings, impact, source, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [environment, recommendation_type, title, description, estimated_savings, impact, source, JSON.stringify(metadata)]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error: any) {
    logger.error('Error creating recommendation:', error.message);
    res.status(500).json({ success: false, error: 'Failed to create recommendation' });
  }
};

export const updateRecommendationStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await query(
      `UPDATE finops_recommendations
       SET status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Recommendation not found' });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error: any) {
    logger.error('Error updating recommendation:', error.message);
    res.status(500).json({ success: false, error: 'Failed to update recommendation' });
  }
};
