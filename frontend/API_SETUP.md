# API Integration Setup Guide

This guide explains how to connect the frontend application to your backend API.

## Quick Start

1. **Copy environment file**:
   ```bash
   cp .env.example .env.local
   ```

2. **Configure API endpoint**:
   Edit `.env.local` and set your backend URL:
   ```bash
   VITE_API_URL=http://localhost:8000/api/v1
   VITE_WS_URL=ws://localhost:8000/ws
   ```

3. **Disable mock mode**:
   ```bash
   VITE_MOCK_API=false
   ```

4. **Restart development server**:
   ```bash
   npm run dev
   ```

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:8000/api/v1` |
| `VITE_WS_URL` | WebSocket server URL | `ws://localhost:8000/ws` |
| `VITE_MOCK_API` | Enable mock data mode | `false` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_APP_MODE` | Application mode | `development` |
| `VITE_FEATURE_AIOPS` | Enable AI Ops features | `true` |
| `VITE_FEATURE_RBAC` | Enable RBAC features | `true` |
| `VITE_FEATURE_AUDIT_LOGS` | Enable audit logging | `true` |
| `VITE_GRAFANA_URL` | Grafana dashboard URL | - |
| `VITE_JIRA_URL` | Jira base URL | - |

## API Client Configuration

The API client is configured in `/src/api/client.ts` with the following features:

### Authentication
- **Token Storage**: JWT token stored in `localStorage` as `auth_token`
- **Auto-Injection**: Token automatically added to all requests via `Authorization` header
- **Auto-Logout**: User automatically logged out on 401 responses

### Rate Limiting
- **Header Tracking**: Tracks `X-RateLimit-*` headers from API responses
- **Real-Time Updates**: Rate limit info available via `getRateLimitInfo()`
- **User Notifications**: Toast notifications on rate limit exceeded (429)

### Error Handling
- **Automatic Retries**: Network errors handled with user-friendly messages
- **Status Code Handling**:
  - 400: Validation errors
  - 401: Authentication errors (auto-logout)
  - 403: Permission errors
  - 404: Not found errors
  - 429: Rate limiting
  - 500+: Server errors
- **Toast Notifications**: All errors show user-friendly toast messages

### Timeouts
- **Request Timeout**: 30 seconds default
- **Configurable**: Can be overridden per-request

## API Endpoints

All API endpoints are documented in `/docs/REST_API.md`. The frontend expects the following endpoint structure:

### Authentication
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `GET /auth/me` - Get current user

### InfraOps
- `GET /infra/incidents` - List incidents
- `POST /infra/incidents` - Create incident
- `PATCH /infra/incidents/:id` - Update incident
- `GET /infra/incidents/:id/evidence` - Get incident evidence
- `POST /infra/incidents/:id/evidence` - Upload evidence
- `GET /infra/tasks` - List tasks
- `GET /infra/sla-metrics` - Get SLA metrics
- `GET /infra/metrics` - Get infrastructure metrics

### SecOps
- `GET /secops/assets` - List assets
- `POST /secops/assets` - Create asset
- `GET /secops/vulnerabilities` - List vulnerabilities
- `GET /secops/mitre/tactics` - Get MITRE tactics
- `GET /secops/mitre/techniques` - Get MITRE techniques

### FinOps
- `GET /finops/summary` - Get cost summary
- `GET /finops/breakdown` - Get cost breakdown
- `GET /finops/credits` - Get cloud credits
- `GET /finops/recommendations` - Get cost recommendations

### SOPs
- `GET /sops` - List SOPs
- `GET /sops/:id` - Get SOP details
- `POST /sops` - Create SOP
- `PUT /sops/:id` - Update SOP
- `POST /sops/:id/execute` - Execute SOP
- `POST /sops/bulk-import` - Bulk import SOPs

### Reports
- `GET /reports` - List reports
- `POST /reports/generate` - Generate report
- `GET /reports/:id/download` - Download report
- `GET /reports/:id/versions` - Get report versions

### Admin
- `GET /admin/api-tokens` - List API tokens
- `POST /admin/api-tokens` - Create API token
- `DELETE /admin/api-tokens/:id` - Delete API token
- `GET /admin/alert-thresholds` - List alert thresholds
- `GET /admin/report-templates` - List report templates
- `GET /admin/audit-logs` - Get audit logs
- `GET /admin/rbac/roles` - Get roles
- `GET /admin/rbac/permissions` - Get permissions
- `GET /admin/rbac/users` - Get users

## WebSocket Integration

The WebSocket client is configured in `/src/hooks/useWebSocket.ts`.

### Connection
```typescript
// Connect with authentication
const ws = new WebSocket(`${VITE_WS_URL}?token=${authToken}`);
```

### Message Format
All WebSocket messages follow this structure:
```typescript
{
  type: 'incident' | 'task' | 'asset' | 'alert' | 'notification' | 'metric',
  action: 'created' | 'updated' | 'deleted',
  data: { /* entity-specific data */ },
  timestamp: '2024-01-15T10:30:00Z'
}
```

### Auto-Reconnect
- Automatic reconnection on disconnect
- Exponential backoff (3s, 6s, 12s, 24s, 48s)
- Maximum 5 reconnection attempts

## Testing the Integration

### 1. Check API Connection
```bash
curl http://localhost:8000/api/v1/health
```

### 2. Test Authentication
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'
```

### 3. Test WebSocket
```bash
# Install wscat
npm install -g wscat

# Connect to WebSocket
wscat -c "ws://localhost:8000/ws?token=YOUR_TOKEN_HERE"
```

### 4. Monitor Network Requests
- Open browser DevTools (F12)
- Go to Network tab
- Filter by XHR/Fetch to see API calls
- Check request/response headers for rate limit info

## Common Issues

### CORS Errors
**Problem**: Browser blocks requests due to CORS policy

**Solution**: Configure backend to allow frontend origin:
```python
# FastAPI example
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Connection Refused
**Problem**: Frontend can't connect to backend

**Solutions**:
1. Check backend is running: `curl http://localhost:8000/health`
2. Verify `VITE_API_URL` in `.env.local`
3. Check firewall settings
4. Ensure backend binds to correct host (`0.0.0.0` not `127.0.0.1`)

### WebSocket Connection Fails
**Problem**: WebSocket shows "Offline" status

**Solutions**:
1. Check WebSocket endpoint is accessible
2. Verify token authentication
3. Check for proxy/load balancer websocket support
4. Test with wscat CLI tool

### Rate Limit Issues
**Problem**: Too many 429 errors

**Solutions**:
1. Check `X-RateLimit-*` headers in responses
2. Implement request caching
3. Use WebSocket for real-time updates instead of polling
4. Contact admin to increase rate limits

## Production Deployment

### Environment Variables
Create `.env.production`:
```bash
VITE_API_URL=https://api.yourcompany.com/api/v1
VITE_WS_URL=wss://api.yourcompany.com/ws
VITE_MOCK_API=false
VITE_APP_MODE=production
```

### Build
```bash
npm run build
```

### Security Considerations
1. **HTTPS Only**: Use HTTPS in production (WSS for WebSockets)
2. **Token Security**: Tokens stored in localStorage (consider httpOnly cookies)
3. **CORS**: Restrict to production domains only
4. **Rate Limiting**: Monitor and adjust limits based on usage
5. **Error Messages**: Sanitize error messages to avoid leaking sensitive info

## Support

- **Backend Documentation**: See `/docs/INTEGRATION_GUIDE.md`
- **API Reference**: See `/docs/REST_API.md`
- **WebSocket Reference**: See `/docs/WEBSOCKET_API.md`
- **Type Definitions**: See `/docs/BACKEND_TYPES.md`
