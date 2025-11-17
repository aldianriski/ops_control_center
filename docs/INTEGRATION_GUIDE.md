# Backend Integration Guide

This guide helps backend developers integrate their API with the Edot Ops Control Center frontend application.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Authentication Flow](#authentication-flow)
3. [API Implementation Checklist](#api-implementation-checklist)
4. [WebSocket Implementation](#websocket-implementation)
5. [Endpoint Implementation Examples](#endpoint-implementation-examples)
6. [Common Patterns](#common-patterns)
7. [Testing Integration](#testing-integration)
8. [Deployment Considerations](#deployment-considerations)

---

## Quick Start

### Prerequisites

- Backend API running on `http://localhost:8000` (or configure `VITE_API_BASE_URL`)
- WebSocket server on `ws://localhost:8000/ws` (or configure `VITE_WS_URL`)
- CORS configured to allow frontend origin
- Database with initial seed data

### Frontend Environment Variables

Create `/frontend/.env.local`:

```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_WS_URL=ws://localhost:8000/ws

# Optional: Mock mode (use simulated backend)
VITE_MOCK_API=false
```

### Minimal Backend Requirements

To get the frontend running, you need:

1. **Authentication endpoint**: `POST /api/v1/auth/login`
2. **User info endpoint**: `GET /api/v1/auth/me`
3. **At least one data endpoint**: `GET /api/v1/infra/incidents`

---

## Authentication Flow

### Step 1: Login

**Frontend sends:**
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Backend responds:**
```http
HTTP/1.1 200 OK
Content-Type: application/json
Set-Cookie: session_token=abc123; HttpOnly; Secure; SameSite=Lax

{
  "user": {
    "id": "user-uuid-123",
    "name": "John Doe",
    "email": "user@example.com",
    "role": "engineer",
    "team": "Platform",
    "permissions": ["read:incidents", "write:tasks"],
    "createdAt": "2024-01-01T00:00:00Z",
    "lastLogin": "2024-01-15T10:30:00Z"
  },
  "token": "eyJhbGc...",
  "expiresAt": "2024-01-16T10:30:00Z"
}
```

### Step 2: Authenticated Requests

**Frontend includes token in all subsequent requests:**

```http
GET /api/v1/infra/incidents
Authorization: Bearer eyJhbGc...
```

**Or using cookie-based auth:**
```http
GET /api/v1/infra/incidents
Cookie: session_token=abc123
```

### Step 3: Token Refresh (Optional)

If using JWT with expiry:

```http
POST /api/v1/auth/refresh
Authorization: Bearer eyJhbGc...

Response:
{
  "token": "new_token_here",
  "expiresAt": "2024-01-17T10:30:00Z"
}
```

### Step 4: Get Current User

**Frontend calls on app load:**
```http
GET /api/v1/auth/me
Authorization: Bearer eyJhbGc...

Response:
{
  "id": "user-uuid-123",
  "name": "John Doe",
  "email": "user@example.com",
  "role": "engineer",
  "team": "Platform",
  "permissions": ["read:incidents", "write:tasks"],
  "avatar": "https://example.com/avatars/user.jpg",
  "createdAt": "2024-01-01T00:00:00Z",
  "lastLogin": "2024-01-15T10:30:00Z"
}
```

---

## API Implementation Checklist

### Core Endpoints (Priority: HIGH)

- [ ] `POST /api/v1/auth/login` - User authentication
- [ ] `POST /api/v1/auth/logout` - Session termination
- [ ] `GET /api/v1/auth/me` - Current user info
- [ ] `GET /api/v1/infra/incidents` - List incidents
- [ ] `POST /api/v1/infra/incidents` - Create incident
- [ ] `PATCH /api/v1/infra/incidents/:id` - Update incident
- [ ] `GET /api/v1/infra/incidents/:id/evidence` - Get evidence
- [ ] `POST /api/v1/infra/incidents/:id/evidence` - Upload evidence
- [ ] `GET /api/v1/infra/tasks` - List tasks
- [ ] `GET /api/v1/infra/sla-metrics` - SLA metrics (12 weeks)
- [ ] `GET /api/v1/secops/assets` - List assets
- [ ] `GET /api/v1/secops/vulnerabilities` - List vulnerabilities
- [ ] `GET /api/v1/finops/summary` - Cost summary
- [ ] `GET /api/v1/finops/credits` - Cloud credits
- [ ] `GET /api/v1/finops/breakdown` - Cost breakdown

### WebSocket (Priority: HIGH)

- [ ] WebSocket endpoint at `/ws` with authentication
- [ ] Broadcast incident created/updated events
- [ ] Broadcast task created/updated events
- [ ] Broadcast asset created/updated events
- [ ] Support subscribe/unsubscribe messages
- [ ] Implement ping/pong for keep-alive

### Additional Features (Priority: MEDIUM)

- [ ] `GET /api/v1/reports` - List reports
- [ ] `POST /api/v1/reports/generate` - Generate report
- [ ] `GET /api/v1/reports/:id/download` - Download report
- [ ] `GET /api/v1/sops` - List SOPs
- [ ] `GET /api/v1/sops/:id` - Get SOP details
- [ ] `POST /api/v1/sops/:id/execute` - Execute SOP
- [ ] `GET /api/v1/admin/tokens` - List API tokens
- [ ] `POST /api/v1/admin/tokens` - Create API token
- [ ] `DELETE /api/v1/admin/tokens/:id` - Revoke token
- [ ] `GET /api/v1/admin/audit-logs` - Audit logs

### Advanced Features (Priority: LOW)

- [ ] `GET /api/v1/secops/mitre/tactics` - MITRE tactics
- [ ] `GET /api/v1/secops/mitre/techniques` - MITRE techniques
- [ ] `GET /api/v1/finops/recommendations` - Cost recommendations
- [ ] `GET /api/v1/reports/:id/versions` - Report version history
- [ ] Rate limiting headers
- [ ] Pagination for large datasets
- [ ] Full-text search support

---

## WebSocket Implementation

### Connection Flow

1. **Client connects**: `ws://localhost:8000/ws?token=eyJhbGc...`
2. **Server authenticates**: Validate token from query parameter or first message
3. **Client subscribes**: Send channels to subscribe to
4. **Server sends events**: Broadcast relevant events to subscribed clients
5. **Keep-alive**: Ping/pong every 30 seconds

### Server Implementation Example (Python/FastAPI)

```python
from fastapi import WebSocket, WebSocketDisconnect
from typing import Set
import json
from datetime import datetime

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, WebSocket] = {}
        self.subscriptions: dict[str, Set[str]] = {}  # user_id -> set of channels

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        self.active_connections[user_id] = websocket
        self.subscriptions[user_id] = set()

    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
        if user_id in self.subscriptions:
            del self.subscriptions[user_id]

    async def subscribe(self, user_id: str, channels: list[str]):
        if user_id in self.subscriptions:
            self.subscriptions[user_id].update(channels)

    async def unsubscribe(self, user_id: str, channels: list[str]):
        if user_id in self.subscriptions:
            self.subscriptions[user_id].difference_update(channels)

    async def broadcast_event(self, event_type: str, action: str, data: dict, channels: list[str] = None):
        """Broadcast event to subscribed clients"""
        message = {
            "type": event_type,
            "action": action,
            "data": data,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }

        for user_id, websocket in self.active_connections.items():
            # Check if user is subscribed to any relevant channel
            if channels:
                user_channels = self.subscriptions.get(user_id, set())
                if not any(channel in user_channels for channel in channels):
                    continue

            try:
                await websocket.send_json(message)
            except Exception as e:
                print(f"Error sending to {user_id}: {e}")

manager = ConnectionManager()

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: str = None):
    # Authenticate user from token
    user = await authenticate_websocket(token)
    if not user:
        await websocket.close(code=1008, reason="Unauthorized")
        return

    await manager.connect(websocket, user.id)

    try:
        while True:
            # Receive message from client
            data = await websocket.receive_json()

            if data["type"] == "subscribe":
                await manager.subscribe(user.id, data.get("channels", []))
                await websocket.send_json({
                    "type": "subscribed",
                    "channels": data.get("channels", [])
                })

            elif data["type"] == "unsubscribe":
                await manager.unsubscribe(user.id, data.get("channels", []))
                await websocket.send_json({
                    "type": "unsubscribed",
                    "channels": data.get("channels", [])
                })

            elif data["type"] == "ping":
                await websocket.send_json({"type": "pong"})

    except WebSocketDisconnect:
        manager.disconnect(user.id)
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(user.id)

# Example: Broadcasting an incident creation
async def create_incident(incident_data: dict):
    # Save to database
    incident = await db.create_incident(incident_data)

    # Broadcast to WebSocket clients
    await manager.broadcast_event(
        event_type="incident",
        action="created",
        data=incident.dict(),
        channels=["incidents", incident.environment, f"squad:{incident.squad}"]
    )

    return incident
```

### Client Implementation (Already Handled by Frontend)

The frontend already implements:
- Automatic connection with retry logic
- Subscription management
- Message routing to React Query cache invalidation
- Toast notifications for events
- Connection status indicator

---

## Endpoint Implementation Examples

### Example 1: List Incidents with Filtering

```python
from fastapi import APIRouter, Depends, Query
from typing import Optional

router = APIRouter(prefix="/api/v1/infra")

@router.get("/incidents")
async def list_incidents(
    environment: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    squad: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user)
):
    """
    List incidents with optional filtering.

    Frontend expects:
    - Array of Incident objects (see BACKEND_TYPES.md)
    - Ordered by created_at DESC
    """
    query = db.query(Incident)

    # Apply filters
    if environment:
        query = query.filter(Incident.environment == environment)
    if severity:
        query = query.filter(Incident.severity == severity)
    if status:
        query = query.filter(Incident.status == status)
    if squad:
        query = query.filter(Incident.squad == squad)

    # Order and paginate
    incidents = query.order_by(Incident.created_at.desc()).offset(offset).limit(limit).all()

    return [incident.to_dict() for incident in incidents]
```

### Example 2: Create Incident with Validation

```python
from pydantic import BaseModel, Field
from datetime import datetime

class CreateIncidentRequest(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    description: str = Field(..., min_length=10)
    severity: str = Field(..., regex="^(critical|high|medium|low)$")
    squad: str
    environment: str = Field(..., regex="^(production|staging|development)$")
    affected_services: Optional[list[str]] = None

@router.post("/incidents")
async def create_incident(
    request: CreateIncidentRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Create new incident and broadcast via WebSocket.
    """
    # Check permissions
    if "write:incidents" not in current_user.permissions:
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    # Generate Jira ID (or integrate with real Jira)
    jira_id = await generate_jira_id("INC")

    # Create incident
    incident = Incident(
        jira_id=jira_id,
        title=request.title,
        description=request.description,
        severity=request.severity,
        status="open",
        squad=request.squad,
        environment=request.environment,
        affected_services=request.affected_services,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )

    db.add(incident)
    await db.commit()
    await db.refresh(incident)

    # Log audit event
    await create_audit_log(
        event_type="CREATE",
        resource_type="incident",
        resource_id=incident.id,
        user_id=current_user.id,
        action_description=f"Created incident {jira_id}"
    )

    # Broadcast via WebSocket
    await manager.broadcast_event(
        event_type="incident",
        action="created",
        data=incident.to_dict(),
        channels=["incidents", incident.environment]
    )

    return incident.to_dict()
```

### Example 3: Upload Evidence with File Handling

```python
from fastapi import UploadFile, File

@router.post("/incidents/{incident_id}/evidence")
async def upload_evidence(
    incident_id: str,
    title: str = Form(...),
    evidence_type: str = Form(...),
    file: Optional[UploadFile] = File(None),
    content: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user)
):
    """
    Upload evidence for an incident.

    Supports:
    - File uploads (screenshots, documents)
    - Text content (logs, commands)
    """
    incident = await db.get_incident(incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    # Handle file upload
    file_url = None
    if file:
        # Save file to storage (S3, local, etc.)
        file_url = await save_uploaded_file(file, f"evidence/{incident_id}")
        content = file_url

    # Create evidence record
    evidence = Evidence(
        incident_id=incident_id,
        title=title,
        type=evidence_type,
        content=content or "",
        uploaded_by=current_user.name,
        uploaded_at=datetime.utcnow()
    )

    db.add(evidence)
    await db.commit()

    return evidence.to_dict()
```

### Example 4: SLA Metrics Calculation

```python
from datetime import timedelta

@router.get("/sla-metrics")
async def get_sla_metrics(
    weeks: int = Query(12, ge=1, le=52),
    squad: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user)
):
    """
    Calculate SLA metrics for the last N weeks.

    Frontend expects:
    - Array of SLAMetric objects
    - Ordered by week_start DESC
    - week_start should be Monday of each week
    """
    metrics = []
    today = datetime.utcnow().date()

    for i in range(weeks):
        # Calculate week start (Monday)
        week_offset = timedelta(weeks=i)
        week_end = today - week_offset
        week_start = week_end - timedelta(days=week_end.weekday())
        week_end = week_start + timedelta(days=6)

        # Query tasks for this week
        tasks_query = db.query(Task).filter(
            Task.created_at >= week_start,
            Task.created_at <= week_end
        )

        if squad:
            tasks_query = tasks_query.filter(Task.squad == squad)

        tasks = tasks_query.all()

        # Calculate metrics
        total_requested = sum(task.estimated_hours or 0 for task in tasks)
        total_delivered = sum(task.actual_hours or 0 for task in tasks if task.status == "done")
        sla_percentage = (total_delivered / total_requested * 100) if total_requested > 0 else 100

        metrics.append({
            "id": f"sla-{week_start.isoformat()}",
            "week_start": week_start.isoformat(),
            "week_end": week_end.isoformat(),
            "total_requested_hours": total_requested,
            "total_delivered_hours": total_delivered,
            "sla_percentage": round(sla_percentage, 2),
            "squad": squad,
            "created_at": datetime.utcnow().isoformat() + "Z"
        })

    return metrics
```

---

## Common Patterns

### Pattern 1: Pagination

```python
from typing import TypeVar, Generic, List
from pydantic import BaseModel

T = TypeVar('T')

class PaginatedResponse(BaseModel, Generic[T]):
    data: List[T]
    pagination: dict

def paginate(query, page: int = 1, limit: int = 20):
    """Generic pagination helper"""
    total = query.count()
    items = query.offset((page - 1) * limit).limit(limit).all()

    return PaginatedResponse(
        data=[item.to_dict() for item in items],
        pagination={
            "current_page": page,
            "total_pages": (total + limit - 1) // limit,
            "total_items": total,
            "items_per_page": limit,
            "has_next": page * limit < total,
            "has_previous": page > 1
        }
    )
```

### Pattern 2: Error Handling

```python
from fastapi import HTTPException
from datetime import datetime

class APIError(HTTPException):
    def __init__(self, status_code: int, code: str, message: str, details: dict = None):
        super().__init__(
            status_code=status_code,
            detail={
                "error": {
                    "code": code,
                    "message": message,
                    "details": details,
                    "timestamp": datetime.utcnow().isoformat() + "Z"
                }
            }
        )

# Usage
if not incident:
    raise APIError(404, "INCIDENT_NOT_FOUND", "Incident not found", {"incident_id": incident_id})
```

### Pattern 3: CORS Configuration

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Frontend dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-RateLimit-Limit", "X-RateLimit-Remaining", "X-RateLimit-Reset"]
)
```

### Pattern 4: Rate Limiting

```python
from fastapi import Request
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.get("/api/v1/infra/incidents")
@limiter.limit("100/minute")
async def list_incidents(request: Request):
    # Add headers to response
    response.headers["X-RateLimit-Limit"] = "100"
    response.headers["X-RateLimit-Remaining"] = str(remaining)
    response.headers["X-RateLimit-Reset"] = str(reset_timestamp)

    # Your logic here
    pass
```

### Pattern 5: Audit Logging Middleware

```python
from fastapi import Request
import time

@app.middleware("http")
async def audit_log_middleware(request: Request, call_next):
    start_time = time.time()

    # Execute request
    response = await call_next(request)

    # Log after request
    duration = time.time() - start_time

    # Only log non-GET requests
    if request.method != "GET":
        await create_audit_log(
            event_type=request.method,
            resource_type=extract_resource_type(request.url.path),
            user_id=getattr(request.state, "user_id", None),
            action_description=f"{request.method} {request.url.path}",
            status="success" if response.status_code < 400 else "failed",
            ip_address=request.client.host,
            metadata={"duration_ms": duration * 1000}
        )

    return response
```

---

## Testing Integration

### Manual Testing with cURL

```bash
# Test login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}' \
  -c cookies.txt

# Test authenticated request
curl http://localhost:8000/api/v1/infra/incidents \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Or with cookies
curl http://localhost:8000/api/v1/infra/incidents \
  -b cookies.txt
```

### Testing WebSocket with wscat

```bash
# Install wscat
npm install -g wscat

# Connect to WebSocket
wscat -c "ws://localhost:8000/ws?token=YOUR_TOKEN_HERE"

# Subscribe to channels
> {"type": "subscribe", "channels": ["incidents", "production"]}

# You should receive events in real-time
< {"type":"incident","action":"created","data":{...},"timestamp":"..."}
```

### Integration Testing Checklist

- [ ] Login with valid credentials returns user and token
- [ ] Login with invalid credentials returns 401
- [ ] Authenticated requests work with token
- [ ] Unauthorized requests (no token) return 401
- [ ] Create incident returns incident with generated jira_id
- [ ] WebSocket connection succeeds with valid token
- [ ] WebSocket broadcasts events to connected clients
- [ ] Frontend receives and displays real-time updates
- [ ] CSV export downloads correct data
- [ ] Search and filtering work correctly
- [ ] Error responses match expected format

---

## Deployment Considerations

### Environment Variables

Backend should support:

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost/ops_control_center

# Redis (for WebSocket scaling)
REDIS_URL=redis://localhost:6379

# JWT Secret
JWT_SECRET=your-secret-key-here
JWT_ALGORITHM=HS256
JWT_EXPIRATION_HOURS=24

# CORS
ALLOWED_ORIGINS=http://localhost:5173,https://ops.example.com

# File Storage
STORAGE_TYPE=local  # or s3, gcs
STORAGE_PATH=/var/app/storage
AWS_S3_BUCKET=ops-evidence

# External Integrations
JIRA_API_URL=https://your-company.atlassian.net
JIRA_API_TOKEN=your-jira-token
```

### Production Checklist

- [ ] HTTPS enabled for API
- [ ] WSS (secure WebSocket) enabled
- [ ] Database migrations automated
- [ ] Backup strategy implemented
- [ ] Monitoring and logging configured
- [ ] Rate limiting in production
- [ ] Session management secured
- [ ] File upload size limits configured
- [ ] CORS restricted to production domains
- [ ] Error messages sanitized (no stack traces in production)
- [ ] API documentation (Swagger/OpenAPI) available
- [ ] Health check endpoint: `GET /health`

### Scaling WebSocket

For multiple backend instances, use Redis Pub/Sub:

```python
import aioredis

redis = await aioredis.create_redis_pool('redis://localhost')

# Subscribe to Redis channel
async def redis_subscriber():
    channel = (await redis.subscribe('websocket_events'))[0]
    while True:
        message = await channel.get()
        if message:
            event = json.loads(message.decode())
            await manager.broadcast_event(**event)

# Publish to Redis (when creating incidents, etc.)
async def broadcast_to_all_instances(event_data):
    await redis.publish('websocket_events', json.dumps(event_data))
```

### Health Check Endpoint

```python
@app.get("/health")
async def health_check():
    """
    Health check endpoint for load balancers.

    Returns:
    - 200 OK if all systems operational
    - 503 Service Unavailable if any critical system down
    """
    checks = {
        "database": await check_database(),
        "redis": await check_redis(),
        "websocket": manager.connection_count > 0 or True  # Always healthy
    }

    if all(checks.values()):
        return {"status": "healthy", "checks": checks, "timestamp": datetime.utcnow().isoformat()}
    else:
        raise HTTPException(status_code=503, detail={"status": "unhealthy", "checks": checks})
```

---

## Common Issues and Solutions

### Issue 1: CORS Errors

**Symptom**: Frontend shows "CORS policy" errors in console

**Solution**:
- Ensure `allow_credentials=True` in CORS middleware
- Check `allow_origins` includes frontend URL exactly (including port)
- Verify `expose_headers` includes custom headers

### Issue 2: WebSocket Connection Fails

**Symptom**: Connection status shows "Error" or "Offline"

**Solution**:
- Check WebSocket endpoint is accessible
- Verify token authentication works
- Ensure no firewall blocking WebSocket protocol
- Check browser console for specific error messages

### Issue 3: Real-time Updates Not Working

**Symptom**: Frontend doesn't update when data changes

**Solution**:
- Verify WebSocket broadcasts events after data mutations
- Check frontend is subscribed to correct channels
- Confirm event payload matches expected structure
- Test WebSocket with wscat to isolate issue

### Issue 4: Date Formatting Errors

**Symptom**: Dates display incorrectly or "Invalid Date"

**Solution**:
- Always use ISO 8601 format: `2024-01-15T10:30:00Z`
- Include timezone (Z for UTC)
- Use `datetime.utcnow().isoformat() + "Z"` in Python

### Issue 5: File Uploads Fail

**Symptom**: Evidence upload returns error

**Solution**:
- Check Content-Type is `multipart/form-data`
- Verify file size limits (default 10MB in many frameworks)
- Ensure storage directory has write permissions
- Check file extension whitelist

---

## Support and Resources

### Documentation References

- **REST API**: See [REST_API.md](./REST_API.md)
- **WebSocket API**: See [WEBSOCKET_API.md](./WEBSOCKET_API.md)
- **Type Definitions**: See [BACKEND_TYPES.md](./BACKEND_TYPES.md)

### Frontend Code Reference

Key files to understand frontend expectations:

- `/frontend/src/api/index.ts` - API client setup
- `/frontend/src/hooks/useWebSocket.ts` - WebSocket implementation
- `/frontend/src/pages/*` - Page-specific data requirements

### Getting Help

1. Check existing documentation first
2. Review frontend code for expected data format
3. Test endpoint with cURL before integrating
4. Use browser DevTools Network tab to inspect requests
5. Check backend logs for error details

---

## Next Steps

After implementing the API:

1. **Test thoroughly**: Use the testing checklist above
2. **Load seed data**: Create sample incidents, tasks, assets for demo
3. **Set up monitoring**: Track API performance and errors
4. **Document custom endpoints**: If you add endpoints beyond this spec
5. **Coordinate deployment**: Ensure frontend and backend deployed together

Good luck with the integration! 🚀
