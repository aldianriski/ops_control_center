import { Request, Response } from 'express';
import { query } from '../config/database';
import logger from '../config/logger';

export const getFinOpsSummary = async (req: Request, res: Response) => {
  try {
    // MTD cost
    const mtdResult = await query(
      `SELECT SUM(cost_usd) as total
       FROM cost_records
       WHERE DATE_TRUNC('month', date) = DATE_TRUNC('month', CURRENT_DATE)`
    );
    const mtdCost = parseFloat(mtdResult.rows[0]?.total || '0');

    // Forecast for end of month
    const eomDate = new Date();
    eomDate.setMonth(eomDate.getMonth() + 1);
    eomDate.setDate(0); // Last day of current month

    const forecastResult = await query(
      `SELECT SUM(predicted_cost) as total
       FROM cost_forecasts
       WHERE forecast_date >= CURRENT_DATE
       AND forecast_date <= $1
       AND scenario = 'baseline'`,
      [eomDate]
    );
    const forecastEom = mtdCost + parseFloat(forecastResult.rows[0]?.total || '0');

    // Budget
    const budgetResult = await query(
      `SELECT SUM(budget_usd) as budget, SUM(variance_usd) as variance
       FROM monthly_budgets
       WHERE month = DATE_TRUNC('month', CURRENT_DATE)`
    );
    const budget = parseFloat(budgetResult.rows[0]?.budget || '0');
    const variance = parseFloat(budgetResult.rows[0]?.variance || '0');

    res.json({
      success: true,
      data: {
        mtd_cost: mtdCost,
        forecast_eom: forecastEom,
        budget,
        variance,
      },
    });
  } catch (error: any) {
    logger.error('Error getting FinOps summary:', error.message);
    res.status(500).json({ success: false, error: 'Failed to get FinOps summary' });
  }
};

export const getCostBreakdown = async (req: Request, res: Response) => {
  try {
    const { environment, service, startDate, endDate } = req.query;

    let sql = 'SELECT * FROM cost_records WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (environment) {
      sql += ` AND environment = $${paramIndex}`;
      params.push(environment);
      paramIndex++;
    }

    if (service) {
      sql += ` AND service = $${paramIndex}`;
      params.push(service);
      paramIndex++;
    }

    if (startDate) {
      sql += ` AND date >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      sql += ` AND date <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    sql += ' ORDER BY date DESC, cost_usd DESC';

    const result = await query(sql, params);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error: any) {
    logger.error('Error getting cost breakdown:', error.message);
    res.status(500).json({ success: false, error: 'Failed to get cost breakdown' });
  }
};

export const getForecast = async (req: Request, res: Response) => {
  try {
    const { environment, scenario = 'baseline', days = 30 } = req.query;

    let sql = 'SELECT * FROM cost_forecasts WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (environment) {
      sql += ` AND environment = $${paramIndex}`;
      params.push(environment);
      paramIndex++;
    }

    sql += ` AND scenario = $${paramIndex}`;
    params.push(scenario);
    paramIndex++;

    sql += ` AND forecast_date >= CURRENT_DATE AND forecast_date <= CURRENT_DATE + INTERVAL '${days} days'`;
    sql += ' ORDER BY forecast_date ASC';

    const result = await query(sql, params);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error: any) {
    logger.error('Error getting forecast:', error.message);
    res.status(500).json({ success: false, error: 'Failed to get forecast' });
  }
};

export const getICSCredits = async (req: Request, res: Response) => {
  try {
    const result = await query(
      'SELECT * FROM ics_credits ORDER BY last_updated DESC LIMIT 1'
    );

    res.json({
      success: true,
      data: result.rows[0] || {},
    });
  } catch (error: any) {
    logger.error('Error getting ICS credits:', error.message);
    res.status(500).json({ success: false, error: 'Failed to get ICS credits' });
  }
};
