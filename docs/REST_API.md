# REST API Documentation

## Base URL
```
http://localhost:3000/api/v1
https://your-domain.com/api/v1 (production)
```

## Authentication

All API requests require authentication via:
- **Session Cookie**: Set after successful login
- **Bearer Token**: `Authorization: Bearer <token>` header

---

## Table of Contents
1. [Authentication](#authentication-endpoints)
2. [InfraOps](#infraops-endpoints)
3. [SecOps](#secops-endpoints)
4. [FinOps](#finops-endpoints)
5. [Reports](#reports-endpoints)
6. [SOPs](#sops-endpoints)
7. [Admin](#admin-endpoints)
8. [Audit Logs](#audit-logs-endpoints)

---

## Authentication Endpoints

### POST /auth/login
Login with credentials

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response** (200 OK):
```json
{
  "user": {
    "id": "user-123",
    "name": "John Doe",
    "email": "user@example.com",
    "role": "admin",
    "team": "platform"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errors**:
- 401: Invalid credentials
- 400: Missing required fields

---

### POST /auth/logout
Logout current user

**Response** (200 OK):
```json
{
  "message": "Logged out successfully"
}
```

---

### GET /auth/me
Get current user information

**Response** (200 OK):
```json
{
  "id": "user-123",
  "name": "John Doe",
  "email": "user@example.com",
  "role": "admin",
  "team": "platform",
  "permissions": ["read:incidents", "write:incidents"]
}
```

---

## InfraOps Endpoints

### GET /infra/incidents
Get all incidents

**Query Parameters**:
- `status` (optional): Filter by status
- `severity` (optional): Filter by severity
- `squad` (optional): Filter by squad
- `limit` (optional): Number of results (default: 100)
- `offset` (optional): Pagination offset

**Response** (200 OK):
```json
[
  {
    "id": "inc-123",
    "jira_id": "INC-1234",
    "title": "Production API Gateway Timeout",
    "severity": "critical",
    "status": "open",
    "squad": "platform",
    "assignee": "john.doe@example.com",
    "created_at": "2025-01-17T10:00:00Z",
    "updated_at": "2025-01-17T10:30:00Z"
  }
]
```

---

### GET /infra/incidents/:id
Get incident by ID

**Response** (200 OK):
```json
{
  "id": "inc-123",
  "jira_id": "INC-1234",
  "title": "Production API Gateway Timeout",
  "description": "API gateway experiencing timeouts...",
  "severity": "critical",
  "status": "open",
  "squad": "platform",
  "assignee": "john.doe@example.com",
  "created_at": "2025-01-17T10:00:00Z",
  "updated_at": "2025-01-17T10:30:00Z",
  "resolution": null
}
```

**Errors**:
- 404: Incident not found

---

### GET /infra/incidents/:id/evidence
Get evidence for an incident

**Response** (200 OK):
```json
{
  "incident_id": "inc-123",
  "screenshots": [
    {
      "id": "ss-1",
      "url": "https://s3.amazonaws.com/...",
      "uploaded_at": "2025-01-17T10:15:00Z",
      "uploaded_by": "john.doe@example.com"
    }
  ],
  "logs": [
    {
      "id": "log-1",
      "content": "[ERROR] Gateway timeout after 30s",
      "source": "api-gateway",
      "timestamp": "2025-01-17T10:00:00Z"
    }
  ],
  "metrics": [
    {
      "metric": "response_time",
      "value": 30000,
      "unit": "ms",
      "timestamp": "2025-01-17T10:00:00Z"
    }
  ]
}
```

---

### GET /infra/tasks
Get all tasks

**Query Parameters**:
- `status` (optional): Filter by status
- `squad` (optional): Filter by squad
- `assignee` (optional): Filter by assignee

**Response** (200 OK):
```json
[
  {
    "id": "task-456",
    "jira_id": "TASK-5678",
    "title": "Update SSL Certificates",
    "status": "in_progress",
    "squad": "security",
    "assignee": "jane.smith@example.com",
    "created_at": "2025-01-15T08:00:00Z",
    "due_date": "2025-01-20T17:00:00Z"
  }
]
```

---

### GET /infra/sla-metrics
Get SLA metrics

**Query Parameters**:
- `weeks` (optional): Number of weeks to retrieve (default: 12)

**Response** (200 OK):
```json
[
  {
    "id": "sla-1",
    "week_start": "2025-01-13",
    "week_end": "2025-01-19",
    "total_requested_hours": 160,
    "total_delivered_hours": 156,
    "sla_percentage": 97.5
  }
]
```

---

### GET /infra/metrics
Get infrastructure metrics

**Response** (200 OK):
```json
{
  "cpu_usage": 45.2,
  "memory_usage": 68.5,
  "disk_usage": 72.3,
  "network_throughput": 1024.5,
  "timestamp": "2025-01-17T16:00:00Z"
}
```

---

## SecOps Endpoints

### GET /secops/assets
Get all assets

**Query Parameters**:
- `environment`: Filter by environment (required or default to 'production')
- `asset_type` (optional): Filter by type
- `risk_level` (optional): Filter by risk level

**Response** (200 OK):
```json
[
  {
    "id": "asset-789",
    "hostname": "web-server-01",
    "asset_type": "EC2",
    "ip_address": "10.0.1.100",
    "risk_level": "medium",
    "owner": "platform-team",
    "environment": "production",
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-17T12:00:00Z"
  }
]
```

---

### GET /secops/vulnerabilities
Get vulnerability statistics

**Response** (200 OK):
```json
{
  "total": 245,
  "by_severity": {
    "critical": 12,
    "high": 45,
    "medium": 108,
    "low": 80
  },
  "by_cvss_score": [
    { "score_range": "9.0-10.0", "count": 12 },
    { "score_range": "7.0-8.9", "count": 45 },
    { "score_range": "4.0-6.9", "count": 108 },
    { "score_range": "0.1-3.9", "count": 80 }
  ],
  "trend": [
    { "date": "2025-01-10", "count": 230 },
    { "date": "2025-01-17", "count": 245 }
  ]
}
```

---

### GET /secops/mitre-attack
Get MITRE ATT&CK mapping

**Response** (200 OK):
```json
[
  {
    "technique_id": "T1566",
    "technique_name": "Phishing",
    "tactic": "Initial Access",
    "coverage": "high",
    "detections": 15,
    "last_detected": "2025-01-17T14:30:00Z"
  }
]
```

---

## FinOps Endpoints

### GET /finops/summary
Get cost summary

**Response** (200 OK):
```json
{
  "mtd_cost": 12500.50,
  "forecast_eom": 25000.00,
  "variance": 2000.00,
  "budget": 23000.00
}
```

---

### GET /finops/ics-credits
Get ICS credits information

**Response** (200 OK):
```json
{
  "balance": 50000.00,
  "burn_rate_per_day": 250.50,
  "remaining_days": 199,
  "expiry_date": "2025-07-31"
}
```

---

### GET /finops/cost-breakdown
Get detailed cost breakdown

**Query Parameters**:
- `start_date` (optional): Start date (ISO 8601)
- `end_date` (optional): End date (ISO 8601)
- `environment` (optional): Filter by environment
- `service` (optional): Filter by service

**Response** (200 OK):
```json
[
  {
    "id": "cost-1",
    "date": "2025-01-17",
    "environment": "production",
    "service": "EC2",
    "cost_usd": 245.50,
    "ics_credits_applied": 50.00
  }
]
```

---

### GET /finops/recommendations
Get cost optimization recommendations

**Response** (200 OK):
```json
[
  {
    "id": "rec-1",
    "title": "Resize Over-Provisioned EC2 Instances",
    "description": "5 EC2 instances are over-provisioned with <30% CPU usage",
    "potential_savings": 1500.00,
    "impact": "medium",
    "effort": "low",
    "category": "right_sizing"
  }
]
```

---

## Reports Endpoints

### GET /reports
Get all reports

**Response** (200 OK):
```json
[
  {
    "id": "report-1",
    "title": "Weekly Operations Report - Week 3",
    "format": "pdf",
    "status": "completed",
    "generated_at": "2025-01-17T08:00:00Z",
    "generated_by": "system",
    "period_start": "2025-01-13",
    "period_end": "2025-01-19",
    "download_url": "/api/v1/reports/report-1/download"
  }
]
```

---

### POST /reports/generate/weekly
Generate weekly report

**Request Body**:
```json
{
  "format": "pdf",
  "sections": ["incidents", "sla", "costs"],
  "recipients": ["manager@example.com"]
}
```

**Response** (202 Accepted):
```json
{
  "id": "report-2",
  "status": "generating",
  "estimated_completion": "2025-01-17T16:05:00Z"
}
```

---

### POST /reports/generate/monthly
Generate monthly report

**Request Body**:
```json
{
  "format": "pdf",
  "month": "2025-01",
  "recipients": ["manager@example.com"]
}
```

**Response** (202 Accepted):
```json
{
  "id": "report-3",
  "status": "generating",
  "estimated_completion": "2025-01-17T16:10:00Z"
}
```

---

### GET /reports/:id/download
Download report file

**Response** (200 OK):
- Content-Type: application/pdf or text/markdown
- File download

**Errors**:
- 404: Report not found
- 400: Report not ready (status != 'completed')

---

### GET /reports/:id/versions
Get report version history

**Response** (200 OK):
```json
[
  {
    "id": "ver-1",
    "report_id": "weekly-ops-001",
    "version": 5,
    "generated_by": "system",
    "generated_at": "2025-01-17T08:00:00Z",
    "file_url": "/reports/weekly-ops-v5.pdf",
    "format": "pdf",
    "status": "completed",
    "file_size": 2457600,
    "changes": ["Updated SLA metrics section"]
  }
]
```

---

## SOPs Endpoints

### GET /sops
Get all SOPs

**Query Parameters**:
- `search` (optional): Search in title/description
- `category` (optional): Filter by category

**Response** (200 OK):
```json
[
  {
    "id": "sop-1",
    "title": "Server Provisioning",
    "description": "Standard process for provisioning new servers",
    "category": "provisioning",
    "tags": ["aws", "ec2", "terraform"],
    "steps": [
      {
        "order": 1,
        "title": "Verify Requirements",
        "content": "Check resource requirements...",
        "type": "manual"
      },
      {
        "order": 2,
        "title": "Run Terraform",
        "content": "terraform apply -var-file=prod.tfvars",
        "type": "automated",
        "command": "terraform apply -var-file=prod.tfvars"
      }
    ],
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-15T10:00:00Z"
  }
]
```

---

### GET /sops/:id
Get SOP by ID

**Response** (200 OK):
```json
{
  "id": "sop-1",
  "title": "Server Provisioning",
  "description": "Standard process for provisioning new servers",
  "category": "provisioning",
  "tags": ["aws", "ec2", "terraform"],
  "steps": [...],
  "execution_history": [
    {
      "id": "exec-1",
      "executed_by": "john.doe@example.com",
      "started_at": "2025-01-17T10:00:00Z",
      "completed_at": "2025-01-17T10:15:00Z",
      "status": "success"
    }
  ],
  "created_by": "admin@example.com",
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-15T10:00:00Z"
}
```

---

### POST /sops/:id/execute
Execute a SOP

**Request Body**:
```json
{
  "parameters": {
    "environment": "production",
    "instance_type": "t3.medium"
  }
}
```

**Response** (202 Accepted):
```json
{
  "execution_id": "exec-2",
  "sop_id": "sop-1",
  "status": "running",
  "started_at": "2025-01-17T16:00:00Z"
}
```

---

## Admin Endpoints

### GET /admin/tokens
Get all API tokens

**Response** (200 OK):
```json
[
  {
    "id": "token-1",
    "name": "Production API Access",
    "token": "sk_live_...",
    "scopes": ["read:incidents", "write:incidents"],
    "created_by": "admin@example.com",
    "created_at": "2025-01-01T00:00:00Z",
    "last_used_at": "2025-01-17T15:00:00Z",
    "expires_at": "2025-12-31T23:59:59Z"
  }
]
```

---

### POST /admin/tokens
Create API token

**Request Body**:
```json
{
  "name": "CI/CD Pipeline Token",
  "scopes": ["read:sops", "write:sops"],
  "expires_at": "2026-01-17T00:00:00Z"
}
```

**Response** (201 Created):
```json
{
  "id": "token-2",
  "name": "CI/CD Pipeline Token",
  "token": "sk_live_abc123...",
  "scopes": ["read:sops", "write:sops"],
  "created_at": "2025-01-17T16:00:00Z",
  "expires_at": "2026-01-17T00:00:00Z"
}
```

**Warning**: Token is only shown once upon creation

---

### DELETE /admin/tokens/:id
Delete API token

**Response** (204 No Content)

---

### GET /admin/alert-thresholds
Get all alert thresholds

**Response** (200 OK):
```json
[
  {
    "id": "threshold-1",
    "metric_name": "cpu_usage",
    "environment": "production",
    "threshold_value": 90,
    "operator": "greater_than",
    "severity": "high",
    "enabled": true
  }
]
```

---

### POST /admin/alert-thresholds
Create alert threshold

**Request Body**:
```json
{
  "metric_name": "memory_usage",
  "environment": "production",
  "threshold_value": 85,
  "operator": "greater_than",
  "severity": "medium"
}
```

**Response** (201 Created):
```json
{
  "id": "threshold-2",
  "metric_name": "memory_usage",
  "environment": "production",
  "threshold_value": 85,
  "operator": "greater_than",
  "severity": "medium",
  "enabled": true,
  "created_at": "2025-01-17T16:00:00Z"
}
```

---

### PATCH /admin/alert-thresholds/:id
Update alert threshold

**Request Body**:
```json
{
  "threshold_value": 90,
  "enabled": false
}
```

**Response** (200 OK):
```json
{
  "id": "threshold-2",
  "metric_name": "memory_usage",
  "threshold_value": 90,
  "enabled": false,
  "updated_at": "2025-01-17T16:05:00Z"
}
```

---

### DELETE /admin/alert-thresholds/:id
Delete alert threshold

**Response** (204 No Content)

---

### GET /admin/report-templates
Get all report templates

**Response** (200 OK):
```json
[
  {
    "id": "template-1",
    "name": "Weekly Ops Report",
    "report_type": "weekly_ops",
    "sections": ["incidents", "tasks", "sla"],
    "format": "pdf",
    "recipients": ["manager@example.com"],
    "schedule_cron": "0 8 * * MON"
  }
]
```

---

### POST /admin/report-templates
Create report template

**Request Body**:
```json
{
  "name": "Monthly FinOps Report",
  "report_type": "monthly_finops",
  "sections": ["costs", "forecasts", "recommendations"],
  "format": "pdf",
  "recipients": ["finance@example.com"],
  "schedule_cron": "0 9 1 * *"
}
```

**Response** (201 Created):
```json
{
  "id": "template-2",
  "name": "Monthly FinOps Report",
  "report_type": "monthly_finops",
  "sections": ["costs", "forecasts", "recommendations"],
  "format": "pdf",
  "recipients": ["finance@example.com"],
  "schedule_cron": "0 9 1 * *",
  "created_at": "2025-01-17T16:00:00Z"
}
```

---

### DELETE /admin/report-templates/:id
Delete report template

**Response** (204 No Content)

---

## Audit Logs Endpoints

### GET /admin/audit-logs
Get audit logs

**Query Parameters**:
- `user` (optional): Filter by user email
- `action` (optional): Filter by action (CREATE, UPDATE, DELETE, LOGIN, etc.)
- `resource` (optional): Filter by resource type
- `status` (optional): Filter by status (success, failed)
- `start_date` (optional): Filter by start date
- `end_date` (optional): Filter by end date
- `limit` (optional): Number of results (default: 50, max: 100)
- `offset` (optional): Pagination offset

**Response** (200 OK):
```json
[
  {
    "id": "audit-1",
    "timestamp": "2025-01-17T10:30:00Z",
    "user": "john.doe@example.com",
    "action": "CREATE",
    "resource_type": "API_TOKEN",
    "resource_id": "token-123",
    "details": "Created new API token 'Production Access'",
    "ip_address": "192.168.1.100",
    "user_agent": "Mozilla/5.0...",
    "status": "success"
  }
]
```

---

## Error Responses

All error responses follow this format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  }
}
```

### Common HTTP Status Codes
- **200 OK**: Successful GET request
- **201 Created**: Successful POST request (resource created)
- **202 Accepted**: Request accepted, processing asynchronously
- **204 No Content**: Successful DELETE request
- **400 Bad Request**: Invalid request body or parameters
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **422 Unprocessable Entity**: Validation error
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server error

---

## Rate Limiting

- **Rate Limit**: 100 requests per minute per user
- **Headers**:
  - `X-RateLimit-Limit`: Maximum requests per window
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Time when limit resets (Unix timestamp)

**429 Response**:
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again in 30 seconds.",
    "retry_after": 30
  }
}
```

---

## Pagination

List endpoints support pagination using `limit` and `offset` query parameters:

```
GET /infra/incidents?limit=50&offset=100
```

**Response Headers**:
- `X-Total-Count`: Total number of items
- `X-Page-Count`: Total number of pages
- `Link`: Pagination links (first, prev, next, last)

**Example Link Header**:
```
Link: </api/v1/infra/incidents?limit=50&offset=0>; rel="first",
      </api/v1/infra/incidents?limit=50&offset=50>; rel="prev",
      </api/v1/infra/incidents?limit=50&offset=150>; rel="next"
```

---

## Versioning

API version is included in the URL path (`/api/v1/`). Breaking changes will result in a new API version (`/api/v2/`).

**Current Version**: v1
**Deprecated Versions**: None
**Sunset Policy**: Minimum 6 months notice before deprecation
