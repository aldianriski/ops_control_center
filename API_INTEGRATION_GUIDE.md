# API Integration Guide

**Edot Ops Control Center - Backend API Documentation**
**Version:** 1.0.0
**Last Updated:** 2025-11-17

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [API Client Setup](#api-client-setup)
4. [Core Modules](#core-modules)
5. [Advanced Features APIs](#advanced-features-apis)
6. [WebSocket Integration](#websocket-integration)
7. [Error Handling](#error-handling)
8. [Rate Limiting](#rate-limiting)
9. [Best Practices](#best-practices)

---

## Overview

The Edot Ops Control Center API provides RESTful endpoints for managing infrastructure operations, security operations, financial operations, and standard operating procedures.

**Base URL:**
- Development: `http://localhost:3000`
- Production: `https://api.ops.yourdomain.com`

**API Version:** `v1`
**Content Type:** `application/json`
**Authentication:** JWT Bearer Token

---

## Authentication

### Login

**Endpoint:** `POST /api/v1/auth/login`

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "manager"
    }
  }
}
```

**Roles:**
- `admin` - Full system access
- `manager` - Can manage SOPs, view all data
- `head_of_engineering` - View operations data
- `viewer` - Read-only access

### Using the Token

Include the JWT token in the `Authorization` header for all subsequent requests:

```javascript
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

---

## API Client Setup

### TypeScript/JavaScript Example

```typescript
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle errors
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

---

## Core Modules

### 1. Dashboard API

#### Get Dashboard Summary

**Endpoint:** `GET /api/v1/dashboard/summary`

**Response:**
```json
{
  "success": true,
  "data": {
    "weekly_incidents": 12,
    "sla_percentage": 98.5,
    "aws_opex_mtd": 45000.50,
    "aws_budget_variance": -2000.00,
    "ics_credits_remaining": 15000.00
  }
}
```

**Usage:**
```typescript
const dashboardApi = {
  getSummary: () => apiClient.get('/api/v1/dashboard/summary'),
};
```

---

### 2. InfraOps API

#### List Incidents

**Endpoint:** `GET /api/v1/infra/incidents`

**Query Parameters:**
- `severity` (optional): `critical` | `high` | `medium` | `low`
- `status` (optional): `open` | `in_progress` | `resolved` | `closed`
- `squad` (optional): Squad name
- `limit` (optional): Number of results (default: 100)
- `offset` (optional): Pagination offset

**Example:**
```typescript
const infraApi = {
  getIncidents: (filters?: {
    severity?: string;
    status?: string;
    squad?: string;
    limit?: number;
    offset?: number;
  }) => {
    const params = new URLSearchParams(filters as any);
    return apiClient.get(`/api/v1/infra/incidents?${params}`);
  },
};
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "INC-12345",
      "title": "Database Connection Pool Exhausted",
      "severity": "high",
      "status": "in_progress",
      "squad": "Platform",
      "created_at": "2025-11-17T10:30:00Z",
      "sla_deadline": "2025-11-17T14:30:00Z"
    }
  ]
}
```

#### Get SLA Metrics

**Endpoint:** `GET /api/v1/infra/sla`

**Query Parameters:**
- `weeks` (optional): Number of weeks (default: 12)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "week": "2025-W46",
      "total_incidents": 15,
      "met_sla": 14,
      "percentage": 93.33
    }
  ]
}
```

---

### 3. FinOps API

#### Get Cost Summary

**Endpoint:** `GET /api/v1/finops/summary`

**Response:**
```json
{
  "success": true,
  "data": {
    "mtd_cost": 45000.50,
    "forecast_eom": 52000.00,
    "budget": 50000.00,
    "variance": 2000.00,
    "variance_percentage": 4.0
  }
}
```

#### Get Cost Breakdown

**Endpoint:** `GET /api/v1/finops/costs`

**Query Parameters:**
- `environment` (optional): Production, Staging, etc.
- `service` (optional): AWS service name
- `startDate` (optional): Start date (YYYY-MM-DD)
- `endDate` (optional): End date (YYYY-MM-DD)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "date": "2025-11-17",
      "service": "EC2",
      "environment": "Production",
      "cost": 1250.75
    }
  ]
}
```

#### Get Cost Forecast

**Endpoint:** `GET /api/v1/finops/forecast`

**Query Parameters:**
- `environment` (optional): Environment name
- `scenario` (optional): `baseline` | `high_load` | `low_load`
- `days` (optional): Days to forecast (default: 30)

**Response:**
```json
{
  "success": true,
  "data": {
    "forecasts": [
      {
        "date": "2025-11-18",
        "predicted": 1500.00,
        "lower_bound": 1350.00,
        "upper_bound": 1650.00,
        "confidence": 0.95
      }
    ],
    "anomalies": [
      {
        "date": "2025-11-15",
        "actual": 2500.00,
        "expected": 1500.00,
        "severity": "high",
        "score": 3.2
      }
    ]
  }
}
```

---

### 4. SecOps API

#### List Assets

**Endpoint:** `GET /api/v1/secops/assets`

**Query Parameters:**
- `type` (optional): Asset type
- `status` (optional): `active` | `inactive`
- `criticality` (optional): `critical` | `high` | `medium` | `low`

#### List Vulnerabilities

**Endpoint:** `GET /api/v1/secops/vulnerabilities`

**Query Parameters:**
- `severity` (optional): `critical` | `high` | `medium` | `low`
- `status` (optional): `open` | `in_progress` | `resolved`
- `cve_id` (optional): CVE identifier

---

### 5. Reports API

#### List Reports

**Endpoint:** `GET /api/v1/reports`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Weekly Operations Report - Week 46",
      "type": "weekly",
      "format": "pdf",
      "generated_at": "2025-11-17T08:00:00Z",
      "generated_by": "admin@edot.com"
    }
  ]
}
```

#### Generate Weekly Report

**Endpoint:** `POST /api/v1/reports/weekly/generate`

**Request:**
```json
{
  "format": "pdf",
  "include_modules": {
    "infraops": true,
    "secops": true,
    "finops": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "download_url": "/api/v1/reports/550e8400-e29b-41d4-a716-446655440000/download"
  }
}
```

#### Download Report

**Endpoint:** `GET /api/v1/reports/:id/download`

**Response:** Binary file (PDF or Markdown)

---

### 6. SOP API

#### List SOPs

**Endpoint:** `GET /api/v1/sop`

**Query Parameters:**
- `category` (optional): `provisioning` | `security` | `incident` | `custom`
- `tags` (optional): Comma-separated tags
- `search` (optional): Search term

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Database Backup Procedure",
      "category": "provisioning",
      "version": "1.2.0",
      "tags": ["database", "backup", "postgres"],
      "steps": [
        {
          "order": 1,
          "title": "Verify backup destination",
          "description": "Check S3 bucket availability",
          "estimated_duration": 2
        }
      ]
    }
  ]
}
```

#### Create SOP (Manager only)

**Endpoint:** `POST /api/v1/sop`

**Request:**
```json
{
  "title": "New Deployment Procedure",
  "category": "provisioning",
  "description": "Steps for deploying applications",
  "tags": ["deployment", "cicd"],
  "steps": [
    {
      "title": "Run tests",
      "description": "Execute full test suite",
      "estimated_duration": 10
    }
  ]
}
```

#### Start SOP Execution

**Endpoint:** `POST /api/v1/sop/:id/execute`

**Request:**
```json
{
  "environment": "production",
  "trigger_type": "manual",
  "metadata": {
    "ticket_id": "INC-12345"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "execution_id": "exec-550e8400",
    "status": "in_progress"
  }
}
```

---

## Advanced Features APIs

### 1. Saved Filter Views API

**Endpoint:** `GET /api/v1/filters/views`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "view-001",
      "name": "Critical Production Incidents",
      "filters": {
        "severity": "critical",
        "environment": "production",
        "status": "open"
      },
      "shared": true,
      "created_by": "admin@edot.com"
    }
  ]
}
```

**Save Filter View:**
```typescript
POST /api/v1/filters/views
{
  "name": "My Custom View",
  "module": "infraops",
  "filters": { "severity": "high" },
  "shared": false
}
```

### 2. Environment Comparison API

**Endpoint:** `GET /api/v1/metrics/compare`

**Query Parameters:**
- `environments`: Comma-separated environment names
- `metrics`: Comma-separated metric keys

**Example:**
```
GET /api/v1/metrics/compare?environments=production,staging&metrics=uptime,incidents
```

**Response:**
```json
{
  "success": true,
  "data": {
    "production": {
      "uptime": 99.95,
      "incidents": 5,
      "cost": 45000
    },
    "staging": {
      "uptime": 99.80,
      "incidents": 12,
      "cost": 8000
    }
  }
}
```

### 3. Team Collaboration API

**Add Comment to Incident:**

**Endpoint:** `POST /api/v1/infra/incidents/:id/comments`

**Request:**
```json
{
  "content": "Investigating the database connection issue @john.doe",
  "mentions": ["john.doe@example.com"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "comment-001",
    "content": "Investigating the database connection issue @john.doe",
    "author": "admin@edot.com",
    "created_at": "2025-11-17T10:30:00Z",
    "mentions": ["john.doe@example.com"]
  }
}
```

### 4. Custom Dashboard API

**Save Dashboard Layout:**

**Endpoint:** `POST /api/v1/dashboards/custom`

**Request:**
```json
{
  "name": "My Operations Dashboard",
  "layout": [
    {
      "widget_type": "sla_chart",
      "position": { "x": 0, "y": 0, "width": 2, "height": 1 },
      "config": { "weeks": 12 }
    }
  ],
  "is_default": false
}
```

---

## WebSocket Integration

### Connection Setup

```typescript
import { io } from 'socket.io-client';

const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';
const token = localStorage.getItem('auth_token');

const socket = io(wsUrl, {
  auth: { token },
  transports: ['websocket'],
});

// Connection events
socket.on('connect', () => {
  console.log('Connected to WebSocket');
});

socket.on('disconnect', () => {
  console.log('Disconnected from WebSocket');
});
```

### Real-time Events

**Incident Updates:**
```typescript
socket.on('incident:created', (incident) => {
  console.log('New incident:', incident);
  // Update UI
});

socket.on('incident:updated', (incident) => {
  console.log('Incident updated:', incident);
  // Update UI
});
```

**Notification Events:**
```typescript
socket.on('notification', (notification) => {
  console.log('Notification:', notification);
  // Show toast notification
  toast(notification.message);
});
```

**Metrics Updates:**
```typescript
socket.on('metrics:update', (metrics) => {
  console.log('Metrics updated:', metrics);
  // Update dashboard
});
```

---

## Error Handling

### Standard Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": {
      "field": "email",
      "issue": "Email format is invalid"
    }
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid authentication token |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

### Handling Errors in TypeScript

```typescript
try {
  const response = await apiClient.get('/api/v1/infra/incidents');
  return response.data;
} catch (error) {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const errorData = error.response?.data;

    switch (status) {
      case 401:
        // Redirect to login
        break;
      case 403:
        // Show permission denied message
        break;
      case 404:
        // Show not found message
        break;
      default:
        // Show generic error
        console.error('API Error:', errorData);
    }
  }
  throw error;
}
```

---

## Rate Limiting

The API implements rate limiting to prevent abuse:

**Limits:**
- **Authenticated users:** 1000 requests per hour
- **Unauthenticated users:** 100 requests per hour

**Rate Limit Headers:**
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 995
X-RateLimit-Reset: 1700226000
```

**Handling Rate Limits:**
```typescript
apiClient.interceptors.response.use(
  (response) => {
    const remaining = response.headers['x-ratelimit-remaining'];
    if (remaining && parseInt(remaining) < 10) {
      console.warn('Approaching rate limit:', remaining);
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 429) {
      const resetTime = error.response.headers['x-ratelimit-reset'];
      console.error('Rate limit exceeded. Reset at:', new Date(resetTime * 1000));
    }
    return Promise.reject(error);
  }
);
```

---

## Best Practices

### 1. Use TanStack Query for Data Fetching

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Fetch data with caching
const { data, isLoading, error } = useQuery({
  queryKey: ['incidents', filters],
  queryFn: () => infraApi.getIncidents(filters),
  staleTime: 5 * 60 * 1000, // 5 minutes
});

// Mutations with optimistic updates
const queryClient = useQueryClient();
const mutation = useMutation({
  mutationFn: (newIncident) => infraApi.createIncident(newIncident),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['incidents'] });
  },
});
```

### 2. Implement Retry Logic

```typescript
const { data } = useQuery({
  queryKey: ['incidents'],
  queryFn: infraApi.getIncidents,
  retry: 3,
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
});
```

### 3. Handle Pagination

```typescript
const [page, setPage] = useState(0);
const limit = 20;

const { data } = useQuery({
  queryKey: ['incidents', page],
  queryFn: () => infraApi.getIncidents({
    limit,
    offset: page * limit
  }),
  keepPreviousData: true,
});
```

### 4. Debounce Search Requests

```typescript
import { useDebouncedValue } from '@/hooks/useDebounce';

const [search, setSearch] = useState('');
const debouncedSearch = useDebouncedValue(search, 300);

const { data } = useQuery({
  queryKey: ['incidents', debouncedSearch],
  queryFn: () => infraApi.getIncidents({ search: debouncedSearch }),
  enabled: debouncedSearch.length > 2,
});
```

### 5. Secure Token Storage

```typescript
// Store token securely
const setAuthToken = (token: string) => {
  localStorage.setItem('auth_token', token);
  // Also set HttpOnly cookie if available
};

// Clear token on logout
const logout = () => {
  localStorage.removeItem('auth_token');
  queryClient.clear();
  window.location.href = '/login';
};
```

---

## Additional Resources

- **API Reference:** [Full API documentation](https://docs.ops.yourdomain.com/api)
- **Backend Repository:** [GitHub Repository](https://github.com/your-org/ops_control_center)
- **Support:** Create an issue in the GitHub repository

---

**Document Version:** 1.0.0
**Last Updated:** 2025-11-17
**Maintained By:** Edot Infrastructure Team
