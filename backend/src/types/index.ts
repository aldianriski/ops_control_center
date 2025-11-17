// User & Authentication Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  created_at: Date;
  updated_at: Date;
}

export enum UserRole {
  MANAGER = 'manager',
  HEAD_OF_ENGINEERING = 'head_of_engineering',
  VIEWER = 'viewer',
}

// InfraOps Types
export interface Incident {
  id: string;
  jira_id: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  squad: string;
  created_at: Date;
  resolved_at?: Date;
  updated_at: Date;
}

export enum IncidentSeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export enum IncidentStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
}

export interface Task {
  id: string;
  jira_id: string;
  title: string;
  description: string;
  status: TaskStatus;
  squad: string;
  assignee?: string;
  sop_id?: string;
  created_at: Date;
  updated_at: Date;
}

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  BLOCKED = 'blocked',
  DONE = 'done',
}

export interface UptimeRequest {
  id: string;
  jira_id: string;
  requester: string;
  environment: string;
  requested_hours: number;
  delivered_hours: number;
  sla_met: boolean;
  window_start: Date;
  window_end: Date;
  created_at: Date;
}

export interface SLAMetric {
  id: string;
  week_start: Date;
  week_end: Date;
  total_requested_hours: number;
  total_delivered_hours: number;
  sla_percentage: number;
  created_at: Date;
}

// SecOps Types
export interface Vulnerability {
  id: string;
  system: string;
  title: string;
  description: string;
  severity: VulnerabilitySeverity;
  cve_id?: string;
  status: VulnerabilityStatus;
  owner?: string;
  discovered_at: Date;
  remediated_at?: Date;
  sop_id?: string;
}

export enum VulnerabilitySeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export enum VulnerabilityStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  REMEDIATED = 'remediated',
  ACCEPTED_RISK = 'accepted_risk',
}

export interface SecurityIncident {
  id: string;
  jira_id: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  ttp_profile?: string;
  created_at: Date;
  resolved_at?: Date;
}

// FinOps Types
export interface CostRecord {
  id: string;
  date: Date;
  environment: string;
  service: string;
  resource?: string;
  cost_usd: number;
  ics_credits_applied: number;
  tags?: Record<string, string>;
  created_at: Date;
}

export interface CostForecast {
  id: string;
  forecast_date: Date;
  environment: string;
  predicted_cost: number;
  confidence_lower: number;
  confidence_upper: number;
  scenario: ForecastScenario;
  created_at: Date;
}

export enum ForecastScenario {
  BASELINE = 'baseline',
  HIGH_LOAD = 'high_load',
  LOW_LOAD = 'low_load',
}

export interface ICSCredit {
  id: string;
  balance: number;
  burn_rate_per_day: number;
  remaining_days: number;
  last_updated: Date;
}

export interface MonthlyBudget {
  id: string;
  month: Date;
  environment: string;
  budget_usd: number;
  actual_usd: number;
  variance_usd: number;
  variance_percentage: number;
}

// SOP Types
export interface SOP {
  id: string;
  title: string;
  description: string;
  category: SOPCategory;
  steps: SOPStep[];
  tags: string[];
  created_at: Date;
  updated_at: Date;
}

export enum SOPCategory {
  PROVISIONING = 'provisioning',
  SECURITY = 'security',
  INCIDENT = 'incident',
  CUSTOM = 'custom',
}

export interface SOPStep {
  order: number;
  description: string;
  completed?: boolean;
}

// Report Types
export interface Report {
  id: string;
  type: ReportType;
  title: string;
  generated_at: Date;
  period_start: Date;
  period_end: Date;
  file_path: string;
  format: ReportFormat;
  status: ReportStatus;
}

export enum ReportType {
  WEEKLY_OPS = 'weekly_ops',
  MONTHLY_FINOPS = 'monthly_finops',
}

export enum ReportFormat {
  PDF = 'pdf',
  MARKDOWN = 'markdown',
}

export enum ReportStatus {
  PENDING = 'pending',
  GENERATING = 'generating',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

// Dashboard Types
export interface DashboardSummary {
  weekly_incidents: number;
  sla_percentage: number;
  aws_opex_mtd: number;
  aws_budget_variance: number;
  ics_credits_remaining: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
