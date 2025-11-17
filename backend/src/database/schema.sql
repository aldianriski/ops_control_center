-- Edot Ops Control Center Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('manager', 'head_of_engineering', 'viewer')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Incidents table (InfraOps)
CREATE TABLE IF NOT EXISTS incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  jira_id VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  status VARCHAR(20) NOT NULL CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  squad VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_incidents_jira_id ON incidents(jira_id);
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_created_at ON incidents(created_at);

-- Tasks table (InfraOps)
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  jira_id VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  status VARCHAR(20) NOT NULL CHECK (status IN ('todo', 'in_progress', 'blocked', 'done')),
  squad VARCHAR(100),
  assignee VARCHAR(255),
  sop_id UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tasks_jira_id ON tasks(jira_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_squad ON tasks(squad);

-- Uptime requests table (InfraOps)
CREATE TABLE IF NOT EXISTS uptime_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  jira_id VARCHAR(50) UNIQUE NOT NULL,
  requester VARCHAR(255) NOT NULL,
  environment VARCHAR(100) NOT NULL,
  requested_hours NUMERIC(10, 2) NOT NULL,
  delivered_hours NUMERIC(10, 2) NOT NULL DEFAULT 0,
  sla_met BOOLEAN DEFAULT false,
  window_start TIMESTAMP NOT NULL,
  window_end TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_uptime_requests_window_start ON uptime_requests(window_start);

-- SLA metrics table (InfraOps)
CREATE TABLE IF NOT EXISTS sla_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  total_requested_hours NUMERIC(10, 2) NOT NULL,
  total_delivered_hours NUMERIC(10, 2) NOT NULL,
  sla_percentage NUMERIC(5, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(week_start, week_end)
);

CREATE INDEX idx_sla_metrics_week_start ON sla_metrics(week_start);

-- Vulnerabilities table (SecOps)
CREATE TABLE IF NOT EXISTS vulnerabilities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  system VARCHAR(255) NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  cve_id VARCHAR(50),
  status VARCHAR(30) NOT NULL CHECK (status IN ('open', 'in_progress', 'remediated', 'accepted_risk')),
  owner VARCHAR(255),
  discovered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  remediated_at TIMESTAMP,
  sop_id UUID
);

CREATE INDEX idx_vulnerabilities_severity ON vulnerabilities(severity);
CREATE INDEX idx_vulnerabilities_status ON vulnerabilities(status);
CREATE INDEX idx_vulnerabilities_system ON vulnerabilities(system);

-- Security incidents table (SecOps)
CREATE TABLE IF NOT EXISTS security_incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  jira_id VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  status VARCHAR(20) NOT NULL CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  ttp_profile VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP
);

CREATE INDEX idx_security_incidents_jira_id ON security_incidents(jira_id);
CREATE INDEX idx_security_incidents_status ON security_incidents(status);

-- Cost records table (FinOps)
CREATE TABLE IF NOT EXISTS cost_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  environment VARCHAR(100) NOT NULL,
  service VARCHAR(255) NOT NULL,
  resource VARCHAR(255),
  cost_usd NUMERIC(12, 2) NOT NULL,
  ics_credits_applied NUMERIC(12, 2) DEFAULT 0,
  tags JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(date, environment, service, resource)
);

CREATE INDEX idx_cost_records_date ON cost_records(date);
CREATE INDEX idx_cost_records_environment ON cost_records(environment);
CREATE INDEX idx_cost_records_service ON cost_records(service);

-- Cost forecasts table (FinOps)
CREATE TABLE IF NOT EXISTS cost_forecasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  forecast_date DATE NOT NULL,
  environment VARCHAR(100) NOT NULL,
  predicted_cost NUMERIC(12, 2) NOT NULL,
  confidence_lower NUMERIC(12, 2) NOT NULL,
  confidence_upper NUMERIC(12, 2) NOT NULL,
  scenario VARCHAR(20) NOT NULL CHECK (scenario IN ('baseline', 'high_load', 'low_load')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(forecast_date, environment, scenario)
);

CREATE INDEX idx_cost_forecasts_date ON cost_forecasts(forecast_date);
CREATE INDEX idx_cost_forecasts_environment ON cost_forecasts(environment);

-- ICS credits table (FinOps)
CREATE TABLE IF NOT EXISTS ics_credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  balance NUMERIC(12, 2) NOT NULL,
  burn_rate_per_day NUMERIC(12, 2) NOT NULL,
  remaining_days INTEGER,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Monthly budgets table (FinOps)
CREATE TABLE IF NOT EXISTS monthly_budgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  month DATE NOT NULL,
  environment VARCHAR(100) NOT NULL,
  budget_usd NUMERIC(12, 2) NOT NULL,
  actual_usd NUMERIC(12, 2) DEFAULT 0,
  variance_usd NUMERIC(12, 2) DEFAULT 0,
  variance_percentage NUMERIC(5, 2) DEFAULT 0,
  UNIQUE(month, environment)
);

CREATE INDEX idx_monthly_budgets_month ON monthly_budgets(month);

-- SOPs table
CREATE TABLE IF NOT EXISTS sops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(500) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL CHECK (category IN ('provisioning', 'security', 'incident', 'custom')),
  steps JSONB NOT NULL,
  tags TEXT[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sops_category ON sops(category);
CREATE INDEX idx_sops_tags ON sops USING GIN(tags);

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(50) NOT NULL CHECK (type IN ('weekly_ops', 'monthly_finops')),
  title VARCHAR(500) NOT NULL,
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  format VARCHAR(20) NOT NULL CHECK (format IN ('pdf', 'markdown')),
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'generating', 'completed', 'failed'))
);

CREATE INDEX idx_reports_type ON reports(type);
CREATE INDEX idx_reports_generated_at ON reports(generated_at);

-- Integration status table
CREATE TABLE IF NOT EXISTS integration_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  integration_name VARCHAR(100) UNIQUE NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'inactive', 'error')),
  last_sync TIMESTAMP,
  last_error TEXT,
  config JSONB,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sync logs table
CREATE TABLE IF NOT EXISTS sync_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  integration_name VARCHAR(100) NOT NULL,
  sync_type VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'failed')),
  records_synced INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sync_logs_integration ON sync_logs(integration_name);
CREATE INDEX idx_sync_logs_started_at ON sync_logs(started_at);

-- Trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_incidents_updated_at BEFORE UPDATE ON incidents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sops_updated_at BEFORE UPDATE ON sops FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user (password: admin123 - CHANGE IN PRODUCTION!)
INSERT INTO users (email, password_hash, name, role)
VALUES (
  'admin@edot.com',
  '$2a$10$8ZqQX5X5X5X5X5X5X5X5XeK0pZ9ZqQX5X5X5X5X5X5X5X5X5X5X5X',
  'Admin User',
  'manager'
) ON CONFLICT (email) DO NOTHING;

-- Insert sample integration status
INSERT INTO integration_status (integration_name, status, last_sync) VALUES
  ('jira', 'inactive', NULL),
  ('aws_cost_explorer', 'inactive', NULL),
  ('sop_kb', 'inactive', NULL)
ON CONFLICT (integration_name) DO NOTHING;
