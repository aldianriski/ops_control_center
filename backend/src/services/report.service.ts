import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { marked } from 'marked';
import logger from '../config/logger';
import { query } from '../config/database';
import { ReportType, ReportFormat } from '../types';

class ReportService {
  private reportDir: string;

  constructor() {
    this.reportDir = process.env.REPORT_OUTPUT_DIR || './reports';
    this.ensureReportDir();
  }

  /**
   * Ensure report directory exists
   */
  private ensureReportDir(): void {
    if (!fs.existsSync(this.reportDir)) {
      fs.mkdirSync(this.reportDir, { recursive: true });
    }
  }

  /**
   * Generate weekly ops report
   */
  async generateWeeklyOpsReport(format: ReportFormat = ReportFormat.PDF): Promise<string> {
    try {
      logger.info('Generating weekly ops report...');

      const periodEnd = new Date();
      const periodStart = new Date();
      periodStart.setDate(periodStart.getDate() - 7);

      // Collect data
      const data = await this.collectWeeklyOpsData(periodStart, periodEnd);

      // Generate report
      const title = `Weekly Ops Report - ${periodStart.toISOString().split('T')[0]} to ${periodEnd.toISOString().split('T')[0]}`;
      const fileName = `weekly_ops_${periodEnd.toISOString().split('T')[0]}.${format}`;
      const filePath = path.join(this.reportDir, fileName);

      if (format === ReportFormat.PDF) {
        await this.generatePDFReport(filePath, title, data, 'weekly_ops');
      } else {
        await this.generateMarkdownReport(filePath, title, data, 'weekly_ops');
      }

      // Save report metadata to database
      await this.saveReportMetadata(
        ReportType.WEEKLY_OPS,
        title,
        periodStart,
        periodEnd,
        filePath,
        format
      );

      logger.info(`Weekly ops report generated: ${filePath}`);
      return filePath;
    } catch (error: any) {
      logger.error('Error generating weekly ops report:', error.message);
      throw error;
    }
  }

  /**
   * Generate monthly FinOps report
   */
  async generateMonthlyFinOpsReport(format: ReportFormat = ReportFormat.PDF): Promise<string> {
    try {
      logger.info('Generating monthly FinOps report...');

      const periodEnd = new Date();
      const periodStart = new Date(periodEnd.getFullYear(), periodEnd.getMonth(), 1);

      // Collect data
      const data = await this.collectMonthlyFinOpsData(periodStart, periodEnd);

      // Generate report
      const title = `Monthly FinOps Report - ${periodStart.toISOString().slice(0, 7)}`;
      const fileName = `monthly_finops_${periodStart.toISOString().slice(0, 7)}.${format}`;
      const filePath = path.join(this.reportDir, fileName);

      if (format === ReportFormat.PDF) {
        await this.generatePDFReport(filePath, title, data, 'monthly_finops');
      } else {
        await this.generateMarkdownReport(filePath, title, data, 'monthly_finops');
      }

      // Save report metadata
      await this.saveReportMetadata(
        ReportType.MONTHLY_FINOPS,
        title,
        periodStart,
        periodEnd,
        filePath,
        format
      );

      logger.info(`Monthly FinOps report generated: ${filePath}`);
      return filePath;
    } catch (error: any) {
      logger.error('Error generating monthly FinOps report:', error.message);
      throw error;
    }
  }

  /**
   * Collect weekly ops data
   */
  private async collectWeeklyOpsData(periodStart: Date, periodEnd: Date): Promise<any> {
    // Incidents
    const incidents = await query(
      `SELECT COUNT(*) as total, severity, status
       FROM incidents
       WHERE created_at >= $1 AND created_at <= $2
       GROUP BY severity, status`,
      [periodStart, periodEnd]
    );

    // Tasks
    const tasks = await query(
      `SELECT COUNT(*) as total, status, squad
       FROM tasks
       WHERE created_at >= $1 AND created_at <= $2
       GROUP BY status, squad`,
      [periodStart, periodEnd]
    );

    // SLA
    const sla = await query(
      `SELECT * FROM sla_metrics
       WHERE week_start >= $1 AND week_end <= $2
       ORDER BY week_start DESC
       LIMIT 1`,
      [periodStart, periodEnd]
    );

    // Uptime requests
    const uptime = await query(
      `SELECT COUNT(*) as total, SUM(requested_hours) as total_requested, SUM(delivered_hours) as total_delivered
       FROM uptime_requests
       WHERE created_at >= $1 AND created_at <= $2`,
      [periodStart, periodEnd]
    );

    return {
      incidents: incidents.rows,
      tasks: tasks.rows,
      sla: sla.rows[0] || {},
      uptime: uptime.rows[0] || {},
    };
  }

  /**
   * Collect monthly FinOps data
   */
  private async collectMonthlyFinOpsData(periodStart: Date, periodEnd: Date): Promise<any> {
    // Total costs
    const totalCost = await query(
      `SELECT SUM(cost_usd) as total, environment, service
       FROM cost_records
       WHERE date >= $1 AND date <= $2
       GROUP BY environment, service
       ORDER BY total DESC`,
      [periodStart, periodEnd]
    );

    // Budget vs actual
    const budget = await query(
      `SELECT * FROM monthly_budgets
       WHERE month = $1`,
      [periodStart]
    );

    // ICS credits
    const ics = await query(
      `SELECT * FROM ics_credits
       ORDER BY last_updated DESC
       LIMIT 1`
    );

    // Forecast
    const forecast = await query(
      `SELECT * FROM cost_forecasts
       WHERE forecast_date >= $1 AND forecast_date <= $2
       AND scenario = 'baseline'
       ORDER BY forecast_date ASC`,
      [periodEnd, new Date(periodEnd.getTime() + 30 * 24 * 60 * 60 * 1000)]
    );

    return {
      totalCost: totalCost.rows,
      budget: budget.rows,
      ics: ics.rows[0] || {},
      forecast: forecast.rows,
    };
  }

  /**
   * Generate PDF report
   */
  private async generatePDFReport(
    filePath: string,
    title: string,
    data: any,
    reportType: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument();
        const stream = fs.createWriteStream(filePath);

        doc.pipe(stream);

        // Title
        doc.fontSize(20).text(title, { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Generated on: ${new Date().toISOString()}`, { align: 'center' });
        doc.moveDown(2);

        if (reportType === 'weekly_ops') {
          this.addWeeklyOpsContent(doc, data);
        } else if (reportType === 'monthly_finops') {
          this.addMonthlyFinOpsContent(doc, data);
        }

        doc.end();

        stream.on('finish', () => resolve());
        stream.on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Add weekly ops content to PDF
   */
  private addWeeklyOpsContent(doc: PDFKit.PDFDocument, data: any): void {
    // Incidents section
    doc.fontSize(16).text('Incidents Summary', { underline: true });
    doc.moveDown();
    doc.fontSize(12).text(`Total Incidents: ${data.incidents.reduce((acc: number, row: any) => acc + parseInt(row.total), 0)}`);
    data.incidents.forEach((row: any) => {
      doc.text(`  - ${row.severity} / ${row.status}: ${row.total}`);
    });
    doc.moveDown(2);

    // Tasks section
    doc.fontSize(16).text('Tasks Summary', { underline: true });
    doc.moveDown();
    doc.fontSize(12).text(`Total Tasks: ${data.tasks.reduce((acc: number, row: any) => acc + parseInt(row.total), 0)}`);
    data.tasks.forEach((row: any) => {
      doc.text(`  - ${row.squad} / ${row.status}: ${row.total}`);
    });
    doc.moveDown(2);

    // SLA section
    if (data.sla.sla_percentage) {
      doc.fontSize(16).text('SLA Metrics', { underline: true });
      doc.moveDown();
      doc.fontSize(12).text(`SLA Percentage: ${parseFloat(data.sla.sla_percentage).toFixed(2)}%`);
      doc.text(`Total Requested Hours: ${data.sla.total_requested_hours}`);
      doc.text(`Total Delivered Hours: ${data.sla.total_delivered_hours}`);
      doc.moveDown(2);
    }

    // Uptime section
    if (data.uptime.total) {
      doc.fontSize(16).text('Uptime Requests', { underline: true });
      doc.moveDown();
      doc.fontSize(12).text(`Total Requests: ${data.uptime.total}`);
      doc.text(`Total Requested Hours: ${data.uptime.total_requested || 0}`);
      doc.text(`Total Delivered Hours: ${data.uptime.total_delivered || 0}`);
    }
  }

  /**
   * Add monthly FinOps content to PDF
   */
  private addMonthlyFinOpsContent(doc: PDFKit.PDFDocument, data: any): void {
    // Total cost section
    doc.fontSize(16).text('Total Costs by Environment & Service', { underline: true });
    doc.moveDown();
    const totalCost = data.totalCost.reduce((acc: number, row: any) => acc + parseFloat(row.total), 0);
    doc.fontSize(12).text(`Total Monthly Cost: $${totalCost.toFixed(2)}`);
    doc.moveDown();
    data.totalCost.slice(0, 10).forEach((row: any) => {
      doc.text(`  - ${row.environment} / ${row.service}: $${parseFloat(row.total).toFixed(2)}`);
    });
    doc.moveDown(2);

    // Budget section
    if (data.budget.length > 0) {
      doc.fontSize(16).text('Budget vs Actual', { underline: true });
      doc.moveDown();
      data.budget.forEach((row: any) => {
        doc.fontSize(12).text(`${row.environment}:`);
        doc.text(`  Budget: $${parseFloat(row.budget_usd).toFixed(2)}`);
        doc.text(`  Actual: $${parseFloat(row.actual_usd).toFixed(2)}`);
        doc.text(`  Variance: $${parseFloat(row.variance_usd).toFixed(2)} (${parseFloat(row.variance_percentage).toFixed(2)}%)`);
        doc.moveDown();
      });
      doc.moveDown(2);
    }

    // ICS credits section
    if (data.ics.balance) {
      doc.fontSize(16).text('ICS Credits', { underline: true });
      doc.moveDown();
      doc.fontSize(12).text(`Current Balance: $${parseFloat(data.ics.balance).toFixed(2)}`);
      doc.text(`Burn Rate: $${parseFloat(data.ics.burn_rate_per_day).toFixed(2)}/day`);
      doc.text(`Remaining Days: ${data.ics.remaining_days}`);
    }
  }

  /**
   * Generate Markdown report
   */
  private async generateMarkdownReport(
    filePath: string,
    title: string,
    data: any,
    reportType: string
  ): Promise<void> {
    let markdown = `# ${title}\n\n`;
    markdown += `**Generated on:** ${new Date().toISOString()}\n\n---\n\n`;

    if (reportType === 'weekly_ops') {
      markdown += this.generateWeeklyOpsMarkdown(data);
    } else if (reportType === 'monthly_finops') {
      markdown += this.generateMonthlyFinOpsMarkdown(data);
    }

    fs.writeFileSync(filePath, markdown, 'utf-8');
  }

  /**
   * Generate weekly ops markdown content
   */
  private generateWeeklyOpsMarkdown(data: any): string {
    let md = '## Incidents Summary\n\n';
    md += `**Total Incidents:** ${data.incidents.reduce((acc: number, row: any) => acc + parseInt(row.total), 0)}\n\n`;
    data.incidents.forEach((row: any) => {
      md += `- ${row.severity} / ${row.status}: ${row.total}\n`;
    });
    md += '\n';

    md += '## Tasks Summary\n\n';
    md += `**Total Tasks:** ${data.tasks.reduce((acc: number, row: any) => acc + parseInt(row.total), 0)}\n\n`;
    data.tasks.forEach((row: any) => {
      md += `- ${row.squad} / ${row.status}: ${row.total}\n`;
    });
    md += '\n';

    if (data.sla.sla_percentage) {
      md += '## SLA Metrics\n\n';
      md += `- **SLA Percentage:** ${parseFloat(data.sla.sla_percentage).toFixed(2)}%\n`;
      md += `- **Total Requested Hours:** ${data.sla.total_requested_hours}\n`;
      md += `- **Total Delivered Hours:** ${data.sla.total_delivered_hours}\n\n`;
    }

    return md;
  }

  /**
   * Generate monthly FinOps markdown content
   */
  private generateMonthlyFinOpsMarkdown(data: any): string {
    let md = '## Total Costs by Environment & Service\n\n';
    const totalCost = data.totalCost.reduce((acc: number, row: any) => acc + parseFloat(row.total), 0);
    md += `**Total Monthly Cost:** $${totalCost.toFixed(2)}\n\n`;
    data.totalCost.slice(0, 10).forEach((row: any) => {
      md += `- ${row.environment} / ${row.service}: $${parseFloat(row.total).toFixed(2)}\n`;
    });
    md += '\n';

    if (data.budget.length > 0) {
      md += '## Budget vs Actual\n\n';
      data.budget.forEach((row: any) => {
        md += `### ${row.environment}\n`;
        md += `- **Budget:** $${parseFloat(row.budget_usd).toFixed(2)}\n`;
        md += `- **Actual:** $${parseFloat(row.actual_usd).toFixed(2)}\n`;
        md += `- **Variance:** $${parseFloat(row.variance_usd).toFixed(2)} (${parseFloat(row.variance_percentage).toFixed(2)}%)\n\n`;
      });
    }

    if (data.ics.balance) {
      md += '## ICS Credits\n\n';
      md += `- **Current Balance:** $${parseFloat(data.ics.balance).toFixed(2)}\n`;
      md += `- **Burn Rate:** $${parseFloat(data.ics.burn_rate_per_day).toFixed(2)}/day\n`;
      md += `- **Remaining Days:** ${data.ics.remaining_days}\n`;
    }

    return md;
  }

  /**
   * Save report metadata to database
   */
  private async saveReportMetadata(
    type: ReportType,
    title: string,
    periodStart: Date,
    periodEnd: Date,
    filePath: string,
    format: ReportFormat
  ): Promise<void> {
    await query(
      `INSERT INTO reports (type, title, period_start, period_end, file_path, format, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'completed')`,
      [type, title, periodStart, periodEnd, filePath, format]
    );
  }
}

export default new ReportService();
