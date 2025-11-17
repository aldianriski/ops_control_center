import { Request, Response } from 'express';
import { query } from '../config/database';
import logger from '../config/logger';
import reportService from '../services/report.service';
import { ReportFormat } from '../types';
import fs from 'fs';

export const getReports = async (req: Request, res: Response) => {
  try {
    const { type, limit = 50 } = req.query;

    let sql = 'SELECT * FROM reports WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (type) {
      sql += ` AND type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    sql += ` ORDER BY generated_at DESC LIMIT $${paramIndex}`;
    params.push(limit);

    const result = await query(sql, params);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error: any) {
    logger.error('Error getting reports:', error.message);
    res.status(500).json({ success: false, error: 'Failed to get reports' });
  }
};

export const generateWeeklyReport = async (req: Request, res: Response) => {
  try {
    const { format = 'pdf' } = req.body;
    const reportFormat = format === 'markdown' ? ReportFormat.MARKDOWN : ReportFormat.PDF;

    const filePath = await reportService.generateWeeklyOpsReport(reportFormat);

    res.json({
      success: true,
      message: 'Weekly report generated successfully',
      data: { file_path: filePath },
    });
  } catch (error: any) {
    logger.error('Error generating weekly report:', error.message);
    res.status(500).json({ success: false, error: 'Failed to generate weekly report' });
  }
};

export const generateMonthlyReport = async (req: Request, res: Response) => {
  try {
    const { format = 'pdf' } = req.body;
    const reportFormat = format === 'markdown' ? ReportFormat.MARKDOWN : ReportFormat.PDF;

    const filePath = await reportService.generateMonthlyFinOpsReport(reportFormat);

    res.json({
      success: true,
      message: 'Monthly report generated successfully',
      data: { file_path: filePath },
    });
  } catch (error: any) {
    logger.error('Error generating monthly report:', error.message);
    res.status(500).json({ success: false, error: 'Failed to generate monthly report' });
  }
};

export const downloadReport = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await query('SELECT * FROM reports WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Report not found' });
    }

    const report = result.rows[0];
    const filePath = report.file_path;

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: 'Report file not found' });
    }

    res.download(filePath);
  } catch (error: any) {
    logger.error('Error downloading report:', error.message);
    res.status(500).json({ success: false, error: 'Failed to download report' });
  }
};
