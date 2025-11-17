# WebSocket API Contract

## Overview

The Ops Control Center uses WebSocket for real-time bidirectional communication between the backend and frontend clients. This document defines the message formats, event types, and expected behavior.

## Connection

### Endpoint
```
ws://your-domain.com/api/ws
wss://your-domain.com/api/ws (production)
```

### Authentication
WebSocket connections should be authenticated using the same session/token mechanism as HTTP requests:
- Cookie-based session
- Or Authorization header with Bearer token

### Connection Lifecycle
1. Client initiates WebSocket connection
2. Server validates authentication
3. Connection established
4. Server sends initial connection confirmation (optional)
5. Bidirectional message flow begins
6. Client handles reconnection on disconnect (max 5 attempts, exponential backoff starting at 3s)

---

## Message Format

All WebSocket messages follow this structure:

```typescript
interface WebSocketMessage {
  type: 'incident' | 'task' | 'asset' | 'alert' | 'notification' | 'metric';
  action: 'created' | 'updated' | 'deleted';
  data: any; // Type-specific payload
  timestamp: string; // ISO 8601 format
}
```

---

## Message Types

### 1. Incident Events

**Type**: `incident`
**Actions**: `created`, `updated`, `deleted`

**Payload** (`data`):
```typescript
{
  id: string;
  jira_id: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  squad: string;
  created_at: string;
  updated_at: string;
  assignee?: string;
  description?: string;
}
```

**Example**:
```json
{
  "type": "incident",
  "action": "created",
  "data": {
    "id": "inc-123",
    "jira_id": "INC-1234",
    "title": "Production API Gateway Timeout",
    "severity": "critical",
    "status": "open",
    "squad": "platform",
    "created_at": "2025-01-17T10:30:00Z"
  },
  "timestamp": "2025-01-17T10:30:00Z"
}
```

**Frontend Behavior**:
- Invalidates incidents query cache
- Shows toast notification
- Creates in-app notification with link to `/infra?tab=incidents`
- Critical incidents get urgent priority

---

### 2. Task Events

**Type**: `task`
**Actions**: `created`, `updated`, `deleted`

**Payload** (`data`):
```typescript
{
  id: string;
  jira_id: string;
  title: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  squad: string;
  assignee?: string;
  due_date?: string;
  priority?: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
}
```

**Example**:
```json
{
  "type": "task",
  "action": "updated",
  "data": {
    "id": "task-456",
    "jira_id": "TASK-5678",
    "title": "Update SSL Certificates",
    "status": "in_progress",
    "squad": "security",
    "assignee": "john.doe@example.com",
    "updated_at": "2025-01-17T11:00:00Z"
  },
  "timestamp": "2025-01-17T11:00:00Z"
}
```

**Frontend Behavior**:
- Invalidates tasks query cache
- Shows toast notification
- Creates in-app notification with link to `/infra?tab=tasks`

---

### 3. Asset Events

**Type**: `asset`
**Actions**: `created`, `updated`, `deleted`

**Payload** (`data`):
```typescript
{
  id: string;
  hostname: string;
  asset_type: string;
  ip_address?: string;
  risk_level: 'critical' | 'high' | 'medium' | 'low';
  owner?: string;
  environment: 'production' | 'staging' | 'sandbox' | 'dev';
  created_at: string;
  updated_at: string;
}
```

**Example**:
```json
{
  "type": "asset",
  "action": "created",
  "data": {
    "id": "asset-789",
    "hostname": "web-server-01",
    "asset_type": "EC2",
    "ip_address": "10.0.1.100",
    "risk_level": "medium",
    "environment": "production",
    "created_at": "2025-01-17T12:00:00Z"
  },
  "timestamp": "2025-01-17T12:00:00Z"
}
```

**Frontend Behavior**:
- Invalidates assets query cache for the current environment
- Shows toast notification
- Updates SecOps asset inventory in real-time

---

### 4. Alert Events

**Type**: `alert`
**Actions**: `created`, `updated` (deleted not applicable)

**Payload** (`data`):
```typescript
{
  id: string;
  metric: string;
  value: number;
  threshold: number;
  operator: 'greater_than' | 'less_than' | 'equals';
  environment: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  resource_id?: string;
  resource_type?: string;
  triggered_at: string;
}
```

**Example**:
```json
{
  "type": "alert",
  "action": "created",
  "data": {
    "id": "alert-001",
    "metric": "cpu_usage",
    "value": 95,
    "threshold": 90,
    "operator": "greater_than",
    "environment": "production",
    "severity": "high",
    "triggered_at": "2025-01-17T13:00:00Z"
  },
  "timestamp": "2025-01-17T13:00:00Z"
}
```

**Frontend Behavior**:
- Shows warning toast notification
- Creates in-app notification with high priority
- Does not invalidate queries (alerts are ephemeral)

---

### 5. Notification Events

**Type**: `notification`
**Actions**: `created` (only)

**Payload** (`data`):
```typescript
{
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  actionUrl?: string; // Frontend route to navigate to
  metadata?: Record<string, any>;
}
```

**Example**:
```json
{
  "type": "notification",
  "action": "created",
  "data": {
    "id": "notif-123",
    "title": "New Incident Assigned",
    "message": "You have been assigned to incident INC-1234",
    "type": "info",
    "priority": "normal",
    "actionUrl": "/infra?tab=incidents"
  },
  "timestamp": "2025-01-17T14:00:00Z"
}
```

**Frontend Behavior**:
- Creates in-app notification in notification panel
- Shows toast notification
- Increments unread counter
- Stored in localStorage (last 50)

---

### 6. Metric Events

**Type**: `metric`
**Actions**: `updated` (only)

**Payload** (`data`):
```typescript
{
  metric_name: string;
  value: number;
  unit?: string;
  environment?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}
```

**Example**:
```json
{
  "type": "metric",
  "action": "updated",
  "data": {
    "metric_name": "sla_percentage",
    "value": 99.5,
    "unit": "percent",
    "environment": "production",
    "timestamp": "2025-01-17T15:00:00Z"
  },
  "timestamp": "2025-01-17T15:00:00Z"
}
```

**Frontend Behavior**:
- Invalidates SLA metrics query cache
- Updates InfraOps metrics dashboard
- No toast notification (too frequent)

---

## Client-to-Server Messages

The frontend may send messages to subscribe to specific event types or rooms:

### Subscribe to Events
```json
{
  "action": "subscribe",
  "topics": ["incidents", "tasks", "alerts"],
  "filters": {
    "environment": "production",
    "squad": "platform"
  }
}
```

### Unsubscribe from Events
```json
{
  "action": "unsubscribe",
  "topics": ["incidents"]
}
```

### Heartbeat/Ping
```json
{
  "action": "ping"
}
```

**Expected Response**:
```json
{
  "action": "pong",
  "timestamp": "2025-01-17T16:00:00Z"
}
```

---

## Error Handling

### Connection Errors
- **401 Unauthorized**: Invalid or expired authentication
- **403 Forbidden**: Authenticated but not authorized
- **500 Internal Server Error**: Server error

### Message Errors
If a message cannot be processed, the server should send:
```json
{
  "type": "error",
  "action": "created",
  "data": {
    "code": "INVALID_MESSAGE",
    "message": "Message format is invalid",
    "original_message_id": "msg-123"
  },
  "timestamp": "2025-01-17T16:30:00Z"
}
```

---

## Reconnection Strategy

Frontend implements automatic reconnection:
- **Max attempts**: 5
- **Backoff**: Exponential (3s, 6s, 12s, 24s, 48s)
- **On reconnect**: Re-subscribe to all previous topics
- **Visual indicator**: Shows connection status in header and page badges

---

## Testing

### Using `wscat` (WebSocket CLI client)
```bash
npm install -g wscat
wscat -c ws://localhost:3000/api/ws

# Send a test message
{"type":"incident","action":"created","data":{"id":"test-1","jira_id":"TEST-1","title":"Test Incident","severity":"high","status":"open","squad":"test"},"timestamp":"2025-01-17T17:00:00Z"}
```

### Using Browser Console
```javascript
const ws = new WebSocket('ws://localhost:3000/api/ws');
ws.onopen = () => console.log('Connected');
ws.onmessage = (event) => console.log('Message:', JSON.parse(event.data));
ws.send(JSON.stringify({
  type: 'notification',
  action: 'created',
  data: {
    title: 'Test Notification',
    message: 'This is a test',
    type: 'info',
    priority: 'normal'
  },
  timestamp: new Date().toISOString()
}));
```

---

## Performance Considerations

- **Message Size**: Keep payloads under 10KB
- **Frequency**: Batch updates when possible (max 1 message/second per type)
- **Compression**: Use WebSocket compression for production
- **Heartbeat**: Send ping every 30 seconds to keep connection alive

---

## Security

1. **Authentication**: Required on connection
2. **Authorization**: Filter events based on user permissions
3. **Rate Limiting**: Max 100 messages/minute per client
4. **Data Sanitization**: Sanitize all user-generated content
5. **HTTPS/WSS**: Use secure WebSocket in production
