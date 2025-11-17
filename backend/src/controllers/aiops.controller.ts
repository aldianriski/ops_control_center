import { Request, Response } from 'express';
import { query } from '../config/database';
import logger from '../config/logger';

export const getDailySummary = async (req: Request, res: Response) => {
  try {
    const { environment } = req.query;

    // Get latest daily summary
    let sql = `SELECT * FROM ai_summaries WHERE summary_type = 'daily'`;
    const params: any[] = [];

    if (environment) {
      sql += ` AND environment = $1`;
      params.push(environment);
    }

    sql += ` ORDER BY generated_at DESC LIMIT 1`;

    const result = await query(sql, params);

    res.json({
      success: true,
      data: result.rows[0] || null,
    });
  } catch (error: any) {
    logger.error('Error getting daily summary:', error.message);
    res.status(500).json({ success: false, error: 'Failed to get daily summary' });
  }
};

export const getWeeklySummary = async (req: Request, res: Response) => {
  try {
    const { environment } = req.query;

    let sql = `SELECT * FROM ai_summaries WHERE summary_type = 'weekly'`;
    const params: any[] = [];

    if (environment) {
      sql += ` AND environment = $1`;
      params.push(environment);
    }

    sql += ` ORDER BY generated_at DESC LIMIT 1`;

    const result = await query(sql, params);

    res.json({
      success: true,
      data: result.rows[0] || null,
    });
  } catch (error: any) {
    logger.error('Error getting weekly summary:', error.message);
    res.status(500).json({ success: false, error: 'Failed to get weekly summary' });
  }
};

export const generateRCA = async (req: Request, res: Response) => {
  try {
    const { incident_id } = req.params;

    // Get incident details
    const incidentResult = await query('SELECT * FROM incidents WHERE id = $1', [incident_id]);

    if (incidentResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Incident not found' });
    }

    const incident = incidentResult.rows[0];

    // Get related evidence
    const evidenceResult = await query('SELECT * FROM evidence WHERE incident_id = $1', [incident_id]);

    // Generate RCA using AI (placeholder - integrate with actual AI service)
    const rcaContent = await generateRCAContent(incident, evidenceResult.rows);

    // Save RCA summary
    const result = await query(
      `INSERT INTO ai_summaries (summary_type, content, metadata)
       VALUES ('rca', $1, $2)
       RETURNING *`,
      [rcaContent, JSON.stringify({ incident_id, incident_title: incident.title })]
    );

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error: any) {
    logger.error('Error generating RCA:', error.message);
    res.status(500).json({ success: false, error: 'Failed to generate RCA' });
  }
};

export const explainCostAnomaly = async (req: Request, res: Response) => {
  try {
    const { date, environment, service } = req.body;

    // Get cost data for the anomaly
    const costResult = await query(
      `SELECT * FROM cost_records
       WHERE date = $1 AND environment = $2 AND service = $3`,
      [date, environment, service]
    );

    if (costResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Cost data not found' });
    }

    // Generate explanation using AI
    const explanation = await generateCostAnomalyExplanation(costResult.rows);

    // Save explanation
    const result = await query(
      `INSERT INTO ai_summaries (summary_type, environment, content, metadata)
       VALUES ('cost_anomaly', $1, $2, $3)
       RETURNING *`,
      [environment, explanation, JSON.stringify({ date, service })]
    );

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error: any) {
    logger.error('Error explaining cost anomaly:', error.message);
    res.status(500).json({ success: false, error: 'Failed to explain cost anomaly' });
  }
};

export const correlateIncidents = async (req: Request, res: Response) => {
  try {
    const { environment, hours = 24 } = req.query;

    // Get recent incidents
    const result = await query(
      `SELECT * FROM incidents
       WHERE created_at >= NOW() - INTERVAL '${hours} hours'
       ${environment ? 'AND squad = $1' : ''}
       ORDER BY created_at DESC`,
      environment ? [environment] : []
    );

    // Correlate incidents (placeholder - implement actual correlation logic)
    const correlations = correlateIncidentsLogic(result.rows);

    res.json({
      success: true,
      data: correlations,
    });
  } catch (error: any) {
    logger.error('Error correlating incidents:', error.message);
    res.status(500).json({ success: false, error: 'Failed to correlate incidents' });
  }
};

// Helper functions (placeholder implementations)
async function generateRCAContent(incident: any, evidence: any[]): Promise<string> {
  // This would integrate with an actual AI service (OpenAI, Claude, etc.)
  const summary = `## Root Cause Analysis: ${incident.title}

**Incident ID:** ${incident.jira_id}
**Severity:** ${incident.severity}
**Status:** ${incident.status}

### Summary
Based on the analysis of ${evidence.length} pieces of evidence, the root cause appears to be related to ${incident.description}.

### Timeline
- Incident created: ${incident.created_at}
- Evidence collected: ${evidence.length} items

### Evidence Analysis
${evidence.map((e, i) => `${i + 1}. ${e.title} (${e.evidence_type})`).join('\n')}

### Root Cause
[AI-generated root cause analysis would appear here]

### Recommended Actions
1. Review the evidence collected
2. Implement preventive measures
3. Update runbooks and SOPs

### Impact Assessment
Squad: ${incident.squad}
Duration: ${incident.resolved_at ? 'Resolved' : 'Ongoing'}
`;

  return summary;
}

async function generateCostAnomalyExplanation(costRecords: any[]): Promise<string> {
  const totalCost = costRecords.reduce((sum, r) => sum + parseFloat(r.cost_usd), 0);

  return `## Cost Anomaly Explanation

**Total Cost:** $${totalCost.toFixed(2)}
**Services Affected:** ${costRecords.length}

### Analysis
An unusual cost spike was detected on ${costRecords[0].date} in the ${costRecords[0].environment} environment.

### Breakdown
${costRecords.map(r => `- ${r.service}: $${parseFloat(r.cost_usd).toFixed(2)}`).join('\n')}

### Possible Causes
1. Increased traffic or usage
2. Resource scaling events
3. Configuration changes
4. Data transfer costs

### Recommendations
- Review resource utilization metrics
- Check for autoscaling events
- Verify configuration changes
- Implement cost alerts
`;
}

function correlateIncidentsLogic(incidents: any[]): any {
  // Group incidents by time window and common attributes
  const correlations = {
    total_incidents: incidents.length,
    correlated_groups: [],
    patterns: [],
  };

  // Simple correlation: group by squad and time proximity
  const groups: { [key: string]: any[] } = {};

  incidents.forEach(incident => {
    const key = incident.squad;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(incident);
  });

  Object.entries(groups).forEach(([squad, squadIncidents]) => {
    if (squadIncidents.length > 1) {
      correlations.correlated_groups.push({
        squad,
        count: squadIncidents.length,
        incidents: squadIncidents.map(i => ({
          id: i.id,
          title: i.title,
          severity: i.severity,
        })),
      });
    }
  });

  return correlations;
}
