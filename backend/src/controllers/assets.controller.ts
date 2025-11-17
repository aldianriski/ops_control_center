import { Request, Response } from 'express';
import { query } from '../config/database';
import logger from '../config/logger';

export const getAssets = async (req: Request, res: Response) => {
  try {
    const { environment, asset_type, risk_level, limit = 100, offset = 0 } = req.query;

    let sql = 'SELECT * FROM assets WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (environment) {
      sql += ` AND environment = $${paramIndex}`;
      params.push(environment);
      paramIndex++;
    }

    if (asset_type) {
      sql += ` AND asset_type = $${paramIndex}`;
      params.push(asset_type);
      paramIndex++;
    }

    if (risk_level) {
      sql += ` AND risk_level = $${paramIndex}`;
      params.push(risk_level);
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
    logger.error('Error getting assets:', error.message);
    res.status(500).json({ success: false, error: 'Failed to get assets' });
  }
};

export const createAsset = async (req: Request, res: Response) => {
  try {
    const {
      environment,
      asset_type,
      hostname,
      ip_address,
      tags,
      risk_level,
      owner,
    } = req.body;

    const result = await query(
      `INSERT INTO assets (environment, asset_type, hostname, ip_address, tags, risk_level, owner, last_seen)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       RETURNING *`,
      [environment, asset_type, hostname, ip_address, JSON.stringify(tags), risk_level, owner]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error: any) {
    logger.error('Error creating asset:', error.message);
    res.status(500).json({ success: false, error: 'Failed to create asset' });
  }
};

export const updateAsset = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { hostname, ip_address, tags, risk_level, owner } = req.body;

    const result = await query(
      `UPDATE assets
       SET hostname = $1, ip_address = $2, tags = $3, risk_level = $4, owner = $5, last_seen = NOW()
       WHERE id = $6
       RETURNING *`,
      [hostname, ip_address, JSON.stringify(tags), risk_level, owner, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Asset not found' });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error: any) {
    logger.error('Error updating asset:', error.message);
    res.status(500).json({ success: false, error: 'Failed to update asset' });
  }
};
