import { Request, Response } from 'express';
import { query } from '../config/database';
import logger from '../config/logger';
import crypto from 'crypto';

// API Tokens
export const getAPITokens = async (req: Request, res: Response) => {
  try {
    const user_id = (req as any).user?.id;

    const result = await query(
      `SELECT id, user_id, token_name, scopes, expires_at, last_used, created_at, is_active
       FROM api_tokens
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [user_id]
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error: any) {
    logger.error('Error getting API tokens:', error.message);
    res.status(500).json({ success: false, error: 'Failed to get API tokens' });
  }
};

export const createAPIToken = async (req: Request, res: Response) => {
  try {
    const { token_name, scopes, expires_in_days } = req.body;
    const user_id = (req as any).user?.id;

    // Generate token
    const token = crypto.randomBytes(32).toString('hex');
    const token_hash = crypto.createHash('sha256').update(token).digest('hex');

    // Calculate expiration
    const expires_at = expires_in_days
      ? new Date(Date.now() + expires_in_days * 24 * 60 * 60 * 1000)
      : null;

    const result = await query(
      `INSERT INTO api_tokens (user_id, token_name, token_hash, scopes, expires_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, user_id, token_name, scopes, expires_at, created_at`,
      [user_id, token_name, token_hash, scopes, expires_at]
    );

    res.status(201).json({
      success: true,
      data: {
        ...result.rows[0],
        token, // Only returned once during creation
      },
      message: 'Save this token securely. It will not be shown again.',
    });
  } catch (error: any) {
    logger.error('Error creating API token:', error.message);
    res.status(500).json({ success: false, error: 'Failed to create API token' });
  }
};

export const revokeAPIToken = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user_id = (req as any).user?.id;

    const result = await query(
      `UPDATE api_tokens
       SET is_active = false
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Token not found' });
    }

    res.json({
      success: true,
      message: 'Token revoked successfully',
    });
  } catch (error: any) {
    logger.error('Error revoking API token:', error.message);
    res.status(500).json({ success: false, error: 'Failed to revoke API token' });
  }
};

// Alert Thresholds
export const getAlertThresholds = async (req: Request, res: Response) => {
  try {
    const { environment, is_active } = req.query;

    let sql = 'SELECT * FROM alert_thresholds WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (environment) {
      sql += ` AND environment = $${paramIndex}`;
      params.push(environment);
      paramIndex++;
    }

    if (is_active !== undefined) {
      sql += ` AND is_active = $${paramIndex}`;
      params.push(is_active === 'true');
      paramIndex++;
    }

    sql += ' ORDER BY created_at DESC';

    const result = await query(sql, params);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error: any) {
    logger.error('Error getting alert thresholds:', error.message);
    res.status(500).json({ success: false, error: 'Failed to get alert thresholds' });
  }
};

export const createAlertThreshold = async (req: Request, res: Response) => {
  try {
    const {
      threshold_name,
      metric_type,
      environment,
      operator,
      threshold_value,
      severity,
    } = req.body;

    const result = await query(
      `INSERT INTO alert_thresholds (threshold_name, metric_type, environment, operator, threshold_value, severity)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [threshold_name, metric_type, environment, operator, threshold_value, severity]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error: any) {
    logger.error('Error creating alert threshold:', error.message);
    res.status(500).json({ success: false, error: 'Failed to create alert threshold' });
  }
};

export const updateAlertThreshold = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      threshold_name,
      operator,
      threshold_value,
      severity,
      is_active,
    } = req.body;

    const result = await query(
      `UPDATE alert_thresholds
       SET threshold_name = $1, operator = $2, threshold_value = $3, severity = $4, is_active = $5, updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [threshold_name, operator, threshold_value, severity, is_active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Threshold not found' });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error: any) {
    logger.error('Error updating alert threshold:', error.message);
    res.status(500).json({ success: false, error: 'Failed to update alert threshold' });
  }
};

// Report Templates
export const getReportTemplates = async (req: Request, res: Response) => {
  try {
    const { template_type, is_active } = req.query;

    let sql = 'SELECT * FROM report_templates WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (template_type) {
      sql += ` AND template_type = $${paramIndex}`;
      params.push(template_type);
      paramIndex++;
    }

    if (is_active !== undefined) {
      sql += ` AND is_active = $${paramIndex}`;
      params.push(is_active === 'true');
      paramIndex++;
    }

    sql += ' ORDER BY created_at DESC';

    const result = await query(sql, params);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error: any) {
    logger.error('Error getting report templates:', error.message);
    res.status(500).json({ success: false, error: 'Failed to get report templates' });
  }
};

export const createReportTemplate = async (req: Request, res: Response) => {
  try {
    const { template_name, template_type, template_content, metadata } = req.body;

    const result = await query(
      `INSERT INTO report_templates (template_name, template_type, template_content, metadata)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [template_name, template_type, template_content, JSON.stringify(metadata)]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error: any) {
    logger.error('Error creating report template:', error.message);
    res.status(500).json({ success: false, error: 'Failed to create report template' });
  }
};

export const updateReportTemplate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { template_name, template_content, metadata, is_active } = req.body;

    const result = await query(
      `UPDATE report_templates
       SET template_name = $1, template_content = $2, metadata = $3, is_active = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [template_name, template_content, JSON.stringify(metadata), is_active, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Template not found' });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error: any) {
    logger.error('Error updating report template:', error.message);
    res.status(500).json({ success: false, error: 'Failed to update report template' });
  }
};

// Environments
export const getEnvironments = async (req: Request, res: Response) => {
  try {
    const result = await query('SELECT * FROM environments WHERE is_active = true ORDER BY name');

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error: any) {
    logger.error('Error getting environments:', error.message);
    res.status(500).json({ success: false, error: 'Failed to get environments' });
  }
};

// Teams
export const getTeams = async (req: Request, res: Response) => {
  try {
    const result = await query('SELECT * FROM teams WHERE is_active = true ORDER BY name');

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error: any) {
    logger.error('Error getting teams:', error.message);
    res.status(500).json({ success: false, error: 'Failed to get teams' });
  }
};
