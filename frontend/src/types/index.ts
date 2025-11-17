// User & Authentication Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export enum UserRole {
  MANAGER = 'manager',
  HEAD_OF_ENGINEERING = 'head_of_engineering',
  VIEWER = 'viewer',
}

// Dashboard Types
export interface DashboardSummary {
  weekly_incidents: number;
  sla_percentage: number;
  aws_opex_mtd: number;
  aws_budget_variance: number;
  ics_credits_remaining: number;
}

// InfraOps Types
export interface Incident {
  id: string;
  jira_id: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  squad: string;
  created_at: string;
  resolved_at?: string;
}

export interface Task {
  id: string;
  jira_id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'blocked' | 'done';
  squad: string;
  assignee?: string;
  sop_id?: string;
}

export interface UptimeRequest {
  id: string;
  jira_id: string;
  requester: string;
  environment: string;
  requested_hours: number;
  delivered_hours: number;
  sla_met: boolean;
  window_start: string;
  window_end: string;
}

export interface SLAMetric {
  id: string;
  week_start: string;
  week_end: string;
  total_requested_hours: number;
  total_delivered_hours: number;
  sla_percentage: number;
}

// FinOps Types
export interface CostRecord {
  id: string;
  date: string;
  environment: string;
  service: string;
  resource?: string;
  cost_usd: number;
  ics_credits_applied: number;
}

export interface CostForecast {
  id: string;
  forecast_date: string;
  environment: string;
  predicted_cost: number;
  confidence_lower: number;
  confidence_upper: number;
  scenario: 'baseline' | 'high_load' | 'low_load';
}

export interface ICSCredit {
  id: string;
  balance: number;
  burn_rate_per_day: number;
  remaining_days: number;
  last_updated: string;
}

export interface FinOpsSummary {
  mtd_cost: number;
  forecast_eom: number;
  budget: number;
  variance: number;
}

// SOP Types
export interface SOP {
  id: string;
  title: string;
  description: string;
  category: 'provisioning' | 'security' | 'incident' | 'custom';
  steps: SOPStep[];
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface SOPStep {
  order: number;
  description: string;
  completed?: boolean;
}

// Report Types
export interface Report {
  id: string;
  type: 'weekly_ops' | 'monthly_finops';
  title: string;
  generated_at: string;
  period_start: string;
  period_end: string;
  file_path: string;
  format: 'pdf' | 'markdown';
  status: 'pending' | 'generating' | 'completed' | 'failed';
}
