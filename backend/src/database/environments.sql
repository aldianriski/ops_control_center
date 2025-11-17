-- Add environment support to existing tables
-- This migration adds environment awareness to the system

-- Create environments table
CREATE TABLE IF NOT EXISTS environments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  description TEXT,
  color VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default environments
INSERT INTO environments (name, display_name, description, color) VALUES
  ('production', 'Production', 'Production environment', '#ef4444'),
  ('staging', 'Staging', 'Staging environment', '#f59e0b'),
  ('sandbox', 'Sandbox', 'Sandbox environment', '#8b5cf6'),
  ('development', 'Development', 'Development environment', '#3b82f6'),
  ('shared', 'Shared Services', 'Shared services environment', '#6b7280')
ON CONFLICT (name) DO NOTHING;

-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  description TEXT,
  color VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default teams
INSERT INTO teams (name, display_name, description, color) VALUES
  ('infra', 'Infrastructure', 'Infrastructure operations team', '#3b82f6'),
  ('secops', 'Security Operations', 'Security operations team', '#ef4444'),
  ('finops', 'Financial Operations', 'Financial operations team', '#10b981')
ON CONFLICT (name) DO NOTHING;

-- Create timeline events table for unified timeline
CREATE TABLE IF NOT EXISTS timeline_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('incident', 'security_incident', 'cost_anomaly', 'uptime_request', 'sop_execution', 'deployment', 'alert')),
  title VARCHAR(500) NOT NULL,
  description TEXT,
  severity VARCHAR(20) CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info')),
  environment VARCHAR(100),
  team VARCHAR(100),
  source_type VARCHAR(50),
  source_id VARCHAR(255),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255)
);

CREATE INDEX idx_timeline_events_created_at ON timeline_events(created_at DESC);
CREATE INDEX idx_timeline_events_environment ON timeline_events(environment);
CREATE INDEX idx_timeline_events_team ON timeline_events(team);
CREATE INDEX idx_timeline_events_type ON timeline_events(event_type);

-- Create evidence table for infra evidence panel
CREATE TABLE IF NOT EXISTS evidence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id UUID,
  title VARCHAR(500) NOT NULL,
  evidence_type VARCHAR(50) NOT NULL CHECK (evidence_type IN ('log', 'metric', 'screenshot', 'grafana_snapshot', 'document', 'other')),
  content TEXT,
  file_path VARCHAR(500),
  source_url VARCHAR(500),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(255),
  FOREIGN KEY (incident_id) REFERENCES incidents(id) ON DELETE CASCADE
);

CREATE INDEX idx_evidence_incident_id ON evidence(incident_id);
CREATE INDEX idx_evidence_type ON evidence(evidence_type);

-- Create infrastructure metrics table
CREATE TABLE IF NOT EXISTS infra_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  environment VARCHAR(100) NOT NULL,
  metric_type VARCHAR(100) NOT NULL CHECK (metric_type IN ('node_health', 'oom_events', 'nf_conntrack', 'ebs_throughput', 'nat_traffic')),
  node_name VARCHAR(255),
  metric_data JSONB NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_infra_metrics_environment ON infra_metrics(environment);
CREATE INDEX idx_infra_metrics_type ON infra_metrics(metric_type);
CREATE INDEX idx_infra_metrics_timestamp ON infra_metrics(timestamp DESC);

-- Create asset inventory table (SecOps)
CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  environment VARCHAR(100) NOT NULL,
  asset_type VARCHAR(50) NOT NULL CHECK (asset_type IN ('host', 'container', 'service', 'network_device', 'cloud_resource')),
  hostname VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45),
  tags JSONB,
  risk_level VARCHAR(20) CHECK (risk_level IN ('critical', 'high', 'medium', 'low')),
  owner VARCHAR(255),
  last_seen TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_assets_environment ON assets(environment);
CREATE INDEX idx_assets_type ON assets(asset_type);
CREATE INDEX idx_assets_risk ON assets(risk_level);

-- Add MITRE ATT&CK mapping to security incidents
ALTER TABLE security_incidents ADD COLUMN IF NOT EXISTS mitre_tactics TEXT[];
ALTER TABLE security_incidents ADD COLUMN IF NOT EXISTS mitre_techniques TEXT[];

-- Create recommendations table (FinOps)
CREATE TABLE IF NOT EXISTS finops_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  environment VARCHAR(100) NOT NULL,
  recommendation_type VARCHAR(50) NOT NULL CHECK (recommendation_type IN ('cost_optimization', 'right_sizing', 'reserved_instances', 'cleanup', 'other')),
  title VARCHAR(500) NOT NULL,
  description TEXT,
  estimated_savings NUMERIC(12, 2),
  impact VARCHAR(20) CHECK (impact IN ('high', 'medium', 'low')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'dismissed')),
  source VARCHAR(50) DEFAULT 'manual' CHECK (source IN ('ai', 'manual', 'rule')),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_recommendations_environment ON finops_recommendations(environment);
CREATE INDEX idx_recommendations_status ON finops_recommendations(status);

-- Create SOP executions table
CREATE TABLE IF NOT EXISTS sop_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sop_id UUID NOT NULL REFERENCES sops(id),
  executed_by VARCHAR(255) NOT NULL,
  environment VARCHAR(100),
  status VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'failed', 'cancelled')),
  steps_completed JSONB,
  evidence JSONB,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  notes TEXT
);

CREATE INDEX idx_sop_executions_sop_id ON sop_executions(sop_id);
CREATE INDEX idx_sop_executions_status ON sop_executions(status);

-- Create API tokens table (Admin)
CREATE TABLE IF NOT EXISTS api_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  token_name VARCHAR(255) NOT NULL,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  scopes TEXT[],
  expires_at TIMESTAMP,
  last_used TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_api_tokens_user_id ON api_tokens(user_id);
CREATE INDEX idx_api_tokens_hash ON api_tokens(token_hash);

-- Create alert thresholds table (Admin)
CREATE TABLE IF NOT EXISTS alert_thresholds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  threshold_name VARCHAR(255) NOT NULL,
  metric_type VARCHAR(100) NOT NULL,
  environment VARCHAR(100),
  operator VARCHAR(20) CHECK (operator IN ('gt', 'lt', 'eq', 'gte', 'lte')),
  threshold_value NUMERIC,
  severity VARCHAR(20) CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create report templates table (Admin)
CREATE TABLE IF NOT EXISTS report_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_name VARCHAR(255) NOT NULL,
  template_type VARCHAR(50) NOT NULL,
  template_content TEXT,
  metadata JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add version tracking to reports
ALTER TABLE reports ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS parent_report_id UUID REFERENCES reports(id);

-- Create AI summaries table
CREATE TABLE IF NOT EXISTS ai_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  summary_type VARCHAR(50) NOT NULL CHECK (summary_type IN ('daily', 'weekly', 'rca', 'cost_anomaly', 'incident_correlation')),
  environment VARCHAR(100),
  content TEXT NOT NULL,
  metadata JSONB,
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ai_summaries_type ON ai_summaries(summary_type);
CREATE INDEX idx_ai_summaries_generated_at ON ai_summaries(generated_at DESC);
