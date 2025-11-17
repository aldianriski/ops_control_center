# Backend Type Definitions

This document provides TypeScript type definitions that the backend API should implement. These types ensure consistency between frontend and backend data structures.

## Table of Contents

1. [Authentication Types](#authentication-types)
2. [InfraOps Types](#infraops-types)
3. [SecOps Types](#secops-types)
4. [FinOps Types](#finops-types)
5. [Reports Types](#reports-types)
6. [SOPs Types](#sops-types)
7. [Admin Types](#admin-types)
8. [Audit Log Types](#audit-log-types)
9. [WebSocket Types](#websocket-types)
10. [Common Types](#common-types)

---

## Authentication Types

```typescript
// User object returned after authentication
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'engineer' | 'viewer';
  team: string;
  permissions: string[];
  avatar?: string;
  createdAt: string; // ISO 8601 date string
  lastLogin: string; // ISO 8601 date string
}

// Login request
interface LoginRequest {
  email: string;
  password: string;
}

// Login response
interface LoginResponse {
  user: User;
  token: string;
  expiresAt: string; // ISO 8601 date string
}

// Token refresh response
interface TokenRefreshResponse {
  token: string;
  expiresAt: string; // ISO 8601 date string
}
```

---

## InfraOps Types

### Incident

```typescript
interface Incident {
  id: string;
  jira_id: string; // e.g., "INC-1234"
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  squad: string; // Team responsible
  environment: 'production' | 'staging' | 'development';
  created_at: string; // ISO 8601 date string
  updated_at: string; // ISO 8601 date string
  resolved_at?: string; // ISO 8601 date string
  assignee?: string;
  tags?: string[];
  affected_services?: string[];
  root_cause?: string;
  resolution?: string;
}

// Create incident request
interface CreateIncidentRequest {
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  squad: string;
  environment: 'production' | 'staging' | 'development';
  affected_services?: string[];
}

// Update incident request
interface UpdateIncidentRequest {
  title?: string;
  description?: string;
  severity?: 'critical' | 'high' | 'medium' | 'low';
  status?: 'open' | 'investigating' | 'resolved' | 'closed';
  assignee?: string;
  root_cause?: string;
  resolution?: string;
}
```

### Evidence

```typescript
interface Evidence {
  id: string;
  incident_id: string;
  title: string;
  type: 'log' | 'metric' | 'screenshot' | 'document' | 'command';
  content: string; // Could be text, URL, or base64 for images
  metadata?: Record<string, any>; // Additional context
  uploaded_by: string; // User ID or name
  uploaded_at: string; // ISO 8601 date string
}

// Upload evidence request
interface UploadEvidenceRequest {
  incident_id: string;
  title: string;
  type: 'log' | 'metric' | 'screenshot' | 'document' | 'command';
  content: string;
  metadata?: Record<string, any>;
}
```

### Task

```typescript
interface Task {
  id: string;
  jira_id: string; // e.g., "TASK-5678"
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'critical' | 'high' | 'medium' | 'low';
  squad: string;
  assignee?: string;
  environment?: 'production' | 'staging' | 'development';
  estimated_hours?: number;
  actual_hours?: number;
  created_at: string; // ISO 8601 date string
  updated_at: string; // ISO 8601 date string
  due_date?: string; // ISO 8601 date string
  completed_at?: string; // ISO 8601 date string
  tags?: string[];
}

// Create task request
interface CreateTaskRequest {
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  squad: string;
  assignee?: string;
  estimated_hours?: number;
  due_date?: string;
}
```

### SLA Metrics

```typescript
interface SLAMetric {
  id: string;
  week_start: string; // ISO 8601 date string (Monday)
  week_end: string; // ISO 8601 date string (Sunday)
  total_requested_hours: number;
  total_delivered_hours: number;
  sla_percentage: number; // 0-100
  squad?: string; // Optional: per-squad metrics
  environment?: string; // Optional: per-environment metrics
  created_at: string; // ISO 8601 date string
}

// Query parameters for SLA metrics
interface SLAMetricsQuery {
  weeks?: number; // Number of weeks to fetch (default: 12)
  squad?: string; // Filter by squad
  environment?: string; // Filter by environment
}
```

### Infrastructure Metrics

```typescript
interface InfrastructureMetric {
  id: string;
  metric_name: string; // e.g., "cpu_usage", "memory_usage", "disk_usage"
  metric_type: 'cpu' | 'memory' | 'disk' | 'network' | 'custom';
  value: number;
  unit: string; // e.g., "%", "GB", "ms", "requests/sec"
  environment: 'production' | 'staging' | 'development';
  service?: string; // Service name
  host?: string; // Hostname
  timestamp: string; // ISO 8601 date string
  tags?: Record<string, string>;
}

// Time-series data for charts
interface MetricTimeSeries {
  metric_name: string;
  data_points: {
    timestamp: string; // ISO 8601 date string
    value: number;
  }[];
  aggregation: 'avg' | 'sum' | 'min' | 'max' | 'count';
}
```

---

## SecOps Types

### Asset

```typescript
interface Asset {
  id: string;
  hostname: string;
  ip_address: string;
  asset_type: 'server' | 'container' | 'database' | 'load_balancer' | 'storage' | 'network_device';
  environment: 'production' | 'staging' | 'development';
  status: 'active' | 'inactive' | 'maintenance' | 'decommissioned';
  os?: string; // Operating system
  os_version?: string;
  owner?: string; // Team or person responsible
  tags?: string[];
  metadata?: Record<string, any>;
  last_scanned_at?: string; // ISO 8601 date string
  vulnerability_count?: number; // Denormalized count
  created_at: string; // ISO 8601 date string
  updated_at: string; // ISO 8601 date string
}

// Create asset request
interface CreateAssetRequest {
  hostname: string;
  ip_address: string;
  asset_type: 'server' | 'container' | 'database' | 'load_balancer' | 'storage' | 'network_device';
  environment: 'production' | 'staging' | 'development';
  os?: string;
  os_version?: string;
  owner?: string;
  tags?: string[];
}
```

### Vulnerability

```typescript
interface Vulnerability {
  id: string;
  asset_id: string;
  cve_id?: string; // e.g., "CVE-2024-1234"
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  cvss_score?: number; // 0.0-10.0
  status: 'open' | 'in_progress' | 'mitigated' | 'accepted' | 'false_positive';
  affected_package?: string;
  affected_version?: string;
  fixed_version?: string;
  discovered_at: string; // ISO 8601 date string
  updated_at: string; // ISO 8601 date string
  resolved_at?: string; // ISO 8601 date string
  assignee?: string;
  remediation?: string;
  references?: string[]; // URLs to advisories
  mitre_tactics?: string[]; // MITRE ATT&CK tactics
  mitre_techniques?: string[]; // MITRE ATT&CK techniques
}

// Update vulnerability request
interface UpdateVulnerabilityRequest {
  status?: 'open' | 'in_progress' | 'mitigated' | 'accepted' | 'false_positive';
  assignee?: string;
  remediation?: string;
}
```

### MITRE ATT&CK Mapping

```typescript
interface MitreTactic {
  id: string; // MITRE ID, e.g., "TA0001"
  name: string;
  description: string;
  url: string; // Link to MITRE ATT&CK page
}

interface MitreTechnique {
  id: string; // MITRE ID, e.g., "T1071"
  name: string;
  description: string;
  tactic_id: string; // Parent tactic ID
  detection_count: number; // How many times detected
  last_detected?: string; // ISO 8601 date string
  url: string; // Link to MITRE ATT&CK page
}

interface MitreDetection {
  id: string;
  technique_id: string;
  asset_id?: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'active' | 'investigating' | 'resolved';
  detected_at: string; // ISO 8601 date string
  resolved_at?: string; // ISO 8601 date string
}
```

---

## FinOps Types

### Cost Summary

```typescript
interface CostSummary {
  total_cost: number;
  currency: string; // e.g., "USD"
  period: 'daily' | 'weekly' | 'monthly';
  period_start: string; // ISO 8601 date string
  period_end: string; // ISO 8601 date string
  breakdown_by_environment: {
    environment: string;
    cost: number;
    percentage: number;
  }[];
  breakdown_by_service: {
    service: string;
    cost: number;
    percentage: number;
  }[];
  comparison?: {
    previous_period_cost: number;
    change_percentage: number;
    change_amount: number;
  };
}
```

### Cloud Credits

```typescript
interface CloudCredit {
  id: string;
  provider: 'aws' | 'gcp' | 'azure' | 'digitalocean' | 'other';
  credit_type: 'promotional' | 'support' | 'commitment' | 'discount';
  amount: number;
  currency: string;
  remaining: number;
  start_date: string; // ISO 8601 date string
  expiry_date: string; // ISO 8601 date string
  status: 'active' | 'expired' | 'exhausted';
  description?: string;
  created_at: string; // ISO 8601 date string
}
```

### Cost Breakdown

```typescript
interface CostBreakdown {
  id: string;
  environment: 'production' | 'staging' | 'development';
  service: string; // e.g., "EC2", "RDS", "S3"
  resource_id?: string;
  resource_name?: string;
  cost: number;
  currency: string;
  usage_amount?: number;
  usage_unit?: string; // e.g., "GB-hours", "requests"
  date: string; // ISO 8601 date string
  tags?: Record<string, string>;
}

// Query parameters
interface CostBreakdownQuery {
  environment?: string;
  service?: string;
  start_date?: string; // ISO 8601 date string
  end_date?: string; // ISO 8601 date string
  group_by?: 'service' | 'environment' | 'date';
}
```

### Cost Recommendations

```typescript
interface CostRecommendation {
  id: string;
  type: 'rightsizing' | 'idle_resource' | 'reserved_instance' | 'spot_instance' | 'storage_optimization';
  title: string;
  description: string;
  potential_savings: number;
  currency: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed' | 'dismissed';
  resource_id?: string;
  resource_type?: string;
  environment?: string;
  created_at: string; // ISO 8601 date string
  completed_at?: string; // ISO 8601 date string
}
```

---

## Reports Types

### Report

```typescript
interface Report {
  id: string;
  name: string;
  type: 'incident_summary' | 'sla_report' | 'vulnerability_report' | 'cost_report' | 'custom';
  status: 'generating' | 'completed' | 'failed';
  format: 'pdf' | 'html' | 'json';
  file_url?: string; // URL to download the report
  file_size?: number; // Size in bytes
  parameters: Record<string, any>; // Report generation parameters
  generated_by: string; // User ID or name
  generated_at: string; // ISO 8601 date string
  period_start?: string; // ISO 8601 date string
  period_end?: string; // ISO 8601 date string
  version?: number;
}

// Generate report request
interface GenerateReportRequest {
  name: string;
  type: 'incident_summary' | 'sla_report' | 'vulnerability_report' | 'cost_report' | 'custom';
  format: 'pdf' | 'html' | 'json';
  parameters?: Record<string, any>;
  period_start?: string;
  period_end?: string;
}

// Report version
interface ReportVersion {
  id: string;
  report_id: string;
  version: number;
  file_url: string;
  file_size: number;
  generated_by: string;
  generated_at: string; // ISO 8601 date string
  changes?: string; // Description of what changed
}
```

---

## SOPs Types

### SOP (Standard Operating Procedure)

```typescript
interface SOP {
  id: string;
  title: string;
  category: 'incident_response' | 'deployment' | 'backup_recovery' | 'security' | 'monitoring' | 'maintenance';
  description: string;
  content: string; // Markdown or HTML
  steps: SOPStep[];
  owner: string;
  reviewers?: string[];
  version: string; // Semantic versioning, e.g., "1.2.0"
  status: 'draft' | 'review' | 'approved' | 'archived';
  tags?: string[];
  prerequisites?: string[];
  estimated_duration?: number; // Minutes
  last_executed_at?: string; // ISO 8601 date string
  execution_count?: number;
  created_at: string; // ISO 8601 date string
  updated_at: string; // ISO 8601 date string
  approved_at?: string; // ISO 8601 date string
}

interface SOPStep {
  id: string;
  order: number;
  title: string;
  description: string;
  command?: string; // Command to execute
  expected_result?: string;
  warning?: string; // Safety warnings
  screenshot_url?: string;
}

// Execute SOP request
interface ExecuteSOPRequest {
  sop_id: string;
  environment?: string;
  parameters?: Record<string, any>;
  executed_by?: string;
}

// SOP execution result
interface SOPExecutionResult {
  id: string;
  sop_id: string;
  status: 'success' | 'failed' | 'partial';
  executed_by: string;
  executed_at: string; // ISO 8601 date string
  duration: number; // Seconds
  step_results: {
    step_id: string;
    status: 'success' | 'failed' | 'skipped';
    output?: string;
    error?: string;
  }[];
  logs?: string[];
}
```

---

## Admin Types

### API Token

```typescript
interface APIToken {
  id: string;
  name: string;
  token: string; // Only shown once during creation
  token_preview: string; // e.g., "sk_...xyz123"
  scopes: string[]; // Permissions, e.g., ["read:incidents", "write:tasks"]
  environment?: string; // Optional: restrict to specific environment
  created_by: string;
  created_at: string; // ISO 8601 date string
  expires_at?: string; // ISO 8601 date string
  last_used_at?: string; // ISO 8601 date string
  status: 'active' | 'revoked' | 'expired';
}

// Create API token request
interface CreateAPITokenRequest {
  name: string;
  scopes: string[];
  environment?: string;
  expires_at?: string; // ISO 8601 date string
}
```

### Alert Threshold

```typescript
interface AlertThreshold {
  id: string;
  metric_name: string; // e.g., "cpu_usage", "memory_usage", "error_rate"
  metric_type: 'infrastructure' | 'application' | 'security' | 'cost';
  operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
  threshold_value: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  environment: 'production' | 'staging' | 'development' | 'all';
  enabled: boolean;
  notification_channels: string[]; // e.g., ["email", "slack", "pagerduty"]
  cooldown_minutes?: number; // Minimum time between alerts
  description?: string;
  created_by: string;
  created_at: string; // ISO 8601 date string
  updated_at: string; // ISO 8601 date string
}

// Create/update threshold request
interface ThresholdRequest {
  metric_name: string;
  metric_type: 'infrastructure' | 'application' | 'security' | 'cost';
  operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
  threshold_value: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  environment: 'production' | 'staging' | 'development' | 'all';
  enabled?: boolean;
  notification_channels?: string[];
  cooldown_minutes?: number;
  description?: string;
}
```

### Report Template

```typescript
interface ReportTemplate {
  id: string;
  name: string;
  type: 'incident_summary' | 'sla_report' | 'vulnerability_report' | 'cost_report' | 'custom';
  description?: string;
  template_content: string; // HTML or template markup
  default_parameters?: Record<string, any>;
  fields: TemplateField[];
  created_by: string;
  created_at: string; // ISO 8601 date string
  updated_at: string; // ISO 8601 date string
}

interface TemplateField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'boolean';
  required: boolean;
  default_value?: any;
  options?: string[]; // For select type
  validation?: string; // Regex or validation rule
}
```

---

## Audit Log Types

```typescript
interface AuditLog {
  id: string;
  event_type: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'GENERATE' | 'EXECUTE' | 'APPROVE' | 'ACCESS';
  resource_type: 'incident' | 'task' | 'asset' | 'vulnerability' | 'report' | 'sop' | 'user' | 'token' | 'threshold' | 'template';
  resource_id?: string;
  resource_name?: string;
  user_id: string;
  user_name: string;
  user_email?: string;
  action_description: string; // Human-readable description
  status: 'success' | 'failed';
  error_message?: string;
  ip_address?: string;
  user_agent?: string;
  changes?: {
    field: string;
    old_value: any;
    new_value: any;
  }[];
  metadata?: Record<string, any>;
  timestamp: string; // ISO 8601 date string
}

// Query parameters
interface AuditLogQuery {
  user_id?: string;
  event_type?: string;
  resource_type?: string;
  status?: string;
  start_date?: string; // ISO 8601 date string
  end_date?: string; // ISO 8601 date string
  limit?: number;
  offset?: number;
}
```

---

## WebSocket Types

```typescript
// WebSocket message format (client receives)
interface WebSocketMessage {
  type: 'incident' | 'task' | 'asset' | 'alert' | 'notification' | 'metric';
  action: 'created' | 'updated' | 'deleted';
  data: any; // Type-specific payload (Incident, Task, etc.)
  timestamp: string; // ISO 8601 date string
  user_id?: string; // Who triggered the event
}

// Client-to-server messages
interface WebSocketClientMessage {
  type: 'subscribe' | 'unsubscribe' | 'ping';
  channels?: string[]; // e.g., ["incidents", "tasks", "production"]
}

// Server response to client messages
interface WebSocketServerResponse {
  type: 'subscribed' | 'unsubscribed' | 'pong' | 'error';
  message?: string;
  channels?: string[];
}

// Notification payload (specific type)
interface NotificationPayload {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  actionUrl?: string;
  metadata?: Record<string, any>;
}
```

---

## Common Types

### Pagination

```typescript
interface PaginationParams {
  page?: number; // Default: 1
  limit?: number; // Default: 20, Max: 100
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_items: number;
    items_per_page: number;
    has_next: boolean;
    has_previous: boolean;
  };
}
```

### Error Response

```typescript
interface ErrorResponse {
  error: {
    code: string; // e.g., "INVALID_REQUEST", "UNAUTHORIZED", "NOT_FOUND"
    message: string; // Human-readable error message
    details?: any; // Additional error context
    timestamp: string; // ISO 8601 date string
    request_id?: string; // For tracking
  };
}
```

### Success Response

```typescript
interface SuccessResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  timestamp: string; // ISO 8601 date string
}
```

### Filter and Sort

```typescript
interface FilterParams {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains';
  value: any;
}

interface SortParams {
  field: string;
  order: 'asc' | 'desc';
}
```

---

## Implementation Notes

### Date/Time Format
- All timestamps should use **ISO 8601 format** with timezone: `2024-01-15T10:30:00Z`
- Use UTC for all stored timestamps
- Frontend will handle timezone conversion for display

### ID Format
- UUIDs (v4) recommended for all entity IDs
- Jira IDs should follow format: `PREFIX-NUMBER` (e.g., `INC-1234`, `TASK-5678`)

### Enums and Constants
- Use lowercase with underscores for enum values in database
- Frontend expects lowercase values as shown in types
- Example: `'in_progress'` not `'IN_PROGRESS'` or `'inProgress'`

### Null vs Undefined
- Optional fields should return `null` when empty (not omitted)
- This ensures consistent parsing on frontend
- Exception: Query parameters can be omitted

### Validation Rules
- Email: RFC 5322 compliant
- URLs: Must be valid HTTP/HTTPS URLs
- Passwords: Minimum 8 characters (enforced in backend)
- Tokens: Should be cryptographically secure random strings

### Rate Limiting
- API tokens should include rate limit headers:
  - `X-RateLimit-Limit`: Total requests allowed
  - `X-RateLimit-Remaining`: Requests remaining
  - `X-RateLimit-Reset`: Unix timestamp when limit resets

### CORS Headers
- Allow frontend origin: `http://localhost:5173` (development)
- Allow credentials for cookie-based auth
- Expose custom headers for rate limiting and pagination

---

## Database Schema Recommendations

### Indexing Strategy
- Index all foreign keys (e.g., `incident_id`, `asset_id`)
- Composite indexes for common queries:
  - `(environment, status, created_at)` for incidents
  - `(environment, asset_type, status)` for assets
  - `(user_id, timestamp)` for audit logs
- Full-text search indexes for:
  - Incident/task titles and descriptions
  - SOP content
  - Asset hostnames

### Soft Deletes
- Consider soft deletes for audit trail
- Add `deleted_at` timestamp (nullable)
- Filter out soft-deleted records by default

### Timestamps
- All tables should have `created_at` and `updated_at`
- Use database triggers to auto-update `updated_at`

### Relationships
- Use foreign key constraints with `ON DELETE` rules:
  - `CASCADE` for dependent data (e.g., evidence linked to incidents)
  - `SET NULL` for references (e.g., assignee in tasks)
  - `RESTRICT` for critical relationships

---

## Testing Data

Sample data generators should create:
- At least 100 incidents across all severities and statuses
- 50+ assets across different environments
- 20+ vulnerabilities with varying CVE scores
- 30 days of cost data
- 12 weeks of SLA metrics
- Mixed user activities in audit logs

This ensures frontend components handle realistic data volumes and edge cases.
