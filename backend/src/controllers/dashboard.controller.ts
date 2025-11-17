import { Request, Response } from 'express';
import { query } from '../config/database';
import logger from '../config/logger';

export const getDashboardSummary = async (req: Request, res: Response) => {
  try {
    // Get weekly incidents count
    const incidentsResult = await query(
      `SELECT COUNT(*) as count
       FROM incidents
       WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'`
    );
    const weeklyIncidents = parseInt(incidentsResult.rows[0]?.count || '0');

    // Get latest SLA percentage
    const slaResult = await query(
      `SELECT sla_percentage
       FROM sla_metrics
       ORDER BY week_start DESC
       LIMIT 1`
    );
    const slaPercentage = parseFloat(slaResult.rows[0]?.sla_percentage || '0');

    // Get AWS OPEX month-to-date
    const opexResult = await query(
      `SELECT SUM(cost_usd) as total
       FROM cost_records
       WHERE DATE_TRUNC('month', date) = DATE_TRUNC('month', CURRENT_DATE)`
    );
    const awsOpexMtd = parseFloat(opexResult.rows[0]?.total || '0');

    // Get budget variance
    const budgetResult = await query(
      `SELECT SUM(variance_usd) as total_variance
       FROM monthly_budgets
       WHERE month = DATE_TRUNC('month', CURRENT_DATE)`
    );
    const budgetVariance = parseFloat(budgetResult.rows[0]?.total_variance || '0');

    // Get ICS credits remaining
    const icsResult = await query(
      `SELECT balance
       FROM ics_credits
       ORDER BY last_updated DESC
       LIMIT 1`
    );
    const icsCreditsRemaining = parseFloat(icsResult.rows[0]?.balance || '0');

    res.json({
      success: true,
      data: {
        weekly_incidents: weeklyIncidents,
        sla_percentage: slaPercentage,
        aws_opex_mtd: awsOpexMtd,
        aws_budget_variance: budgetVariance,
        ics_credits_remaining: icsCreditsRemaining,
      },
    });
  } catch (error: any) {
    logger.error('Error getting dashboard summary:', error.message);
    res.status(500).json({ success: false, error: 'Failed to get dashboard summary' });
  }
};
