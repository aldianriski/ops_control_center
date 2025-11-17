# Edot Ops Control Center

A unified operational control center that integrates InfraOps, SecurityOps, and FinOps into a single automated, real-time dashboard.

## Overview

The Edot Ops Control Center eliminates manual reporting, reduces context switching, and provides real-time visibility across infrastructure operations, security operations, and financial operations.

### Key Features

**Core Modules:**
- **Real-time Dashboards**: Unified view with custom widgets and KPI cards
- **InfraOps**: Incident management, tasks, SLA tracking, infrastructure metrics
- **SecOps**: Asset inventory, vulnerabilities, MITRE ATT&CK, security incidents
- **FinOps**: AWS cost tracking, ICS credits, budgeting, and forecasting
- **Automated Reporting**: Auto-generated weekly/monthly reports with scheduling
- **SOP Management**: Procedures with execution mode and step tracking
- **Role-Based Access**: Manager, Head of Engineering, Viewer, and Admin roles

**Advanced Features (Implemented):**
- 🤖 **AI Cost Forecasting**: Linear regression with 95% confidence intervals and anomaly detection
- 📅 **Report Scheduling**: Automated daily/weekly/monthly/quarterly report distribution
- 📈 **Grafana Integration**: Embed dashboards and panels directly in the app
- 🔍 **Global Search**: Command palette (⌘K) for quick navigation
- 🔄 **Environment Comparison**: Side-by-side metrics comparison
- 💬 **Team Collaboration**: @mentions and comments on incidents
- 💾 **Saved Filter Views**: Save and share custom filter configurations
- 🎨 **Custom Dashboards**: Drag-and-drop widget builder with personalized layouts
- 🔔 **Real-time Notifications**: WebSocket-powered live updates
- 🎯 **Smart Rate Limiting**: Visual indicators for API usage

**Technical Highlights:**
- TypeScript strict mode with zero critical errors
- Comprehensive error handling and validation
- Automated synchronization with external APIs (Jira, AWS)
- Real-time WebSocket updates for live dashboard
- Linear regression algorithm for cost prediction
- Z-score anomaly detection for cost spikes
- Role-based access control (RBAC)
- JWT authentication with secure token management

## Architecture

```
┌─────────────┐
│   Frontend  │  React + TypeScript + Tailwind CSS
│   (Vite)    │
└──────┬──────┘
       │ HTTPS
       ▼
┌─────────────┐
│   Backend   │  Node.js + Express + TypeScript
│   API       │
└──────┬──────┘
       │
       ├──► PostgreSQL (Data Storage)
       ├──► Jira API (Incidents, Tasks, Uptime)
       ├──► AWS Cost Explorer (FinOps Data)
       └──► Cron Workers (Automated Syncs)
```

## Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js + TypeScript
- **Database**: PostgreSQL 15
- **Scheduler**: node-cron
- **Authentication**: JWT + bcrypt
- **Reporting**: PDFKit + Markdown
- **Logging**: Winston

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **State Management**: Zustand + TanStack Query
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React

### DevOps
- **Containerization**: Docker + Docker Compose
- **Reverse Proxy**: Nginx (for frontend)

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 15+
- Docker and Docker Compose (for containerized deployment)
- Jira account with API access
- AWS account with Cost Explorer access

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ops_control_center
```

### 2. Configure Environment Variables

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# Database
DB_PASSWORD=your_secure_password

# JWT
JWT_SECRET=your_long_random_jwt_secret

# Jira
JIRA_BASE_URL=https://your-domain.atlassian.net
JIRA_EMAIL=your-email@example.com
JIRA_API_TOKEN=your_jira_api_token
JIRA_PROJECT_KEY=INFRA

# AWS
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
```

### 3. Run with Docker Compose (Recommended)

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **PostgreSQL**: localhost:5432

### 4. Initialize the Database

```bash
# Enter the backend container
docker-compose exec backend sh

# Run migrations
npm run migrate

# Exit container
exit
```

### 5. Access the Application

1. Navigate to http://localhost:5173
2. Login with default credentials:
   - Email: `admin@edot.com`
   - Password: `admin123` (⚠️ CHANGE THIS IN PRODUCTION!)

## Development Setup

### Backend Development

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Run database migrations
npm run migrate

# Start development server
npm run dev
```

The backend API will run on `http://localhost:3000`.

### Frontend Development

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will run on `http://localhost:5173`.

## Project Structure

```
ops_control_center/
├── backend/
│   ├── src/
│   │   ├── config/          # Database, logger configuration
│   │   ├── controllers/     # API request handlers
│   │   ├── database/        # Schema and migrations
│   │   ├── middleware/      # Auth, validation, error handling
│   │   ├── models/          # Data models
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic (Jira, AWS, reports)
│   │   ├── types/           # TypeScript type definitions
│   │   ├── utils/           # Helper functions
│   │   ├── workers/         # Cron jobs and sync workers
│   │   ├── app.ts           # Express app setup
│   │   └── index.ts         # Entry point
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── api/             # API client and endpoints
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── store/           # State management (Zustand)
│   │   ├── types/           # TypeScript types
│   │   ├── App.tsx          # Main app component
│   │   └── main.tsx         # Entry point
│   ├── Dockerfile
│   ├── package.json
│   └── vite.config.ts
├── docker-compose.yml
├── .env.example
└── README.md
```

## API Documentation

### Authentication

#### POST `/api/v1/auth/login`
Login to get JWT token.

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
    "token": "jwt-token-here",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "name": "User Name",
      "role": "manager"
    }
  }
}
```

### Dashboard

#### GET `/api/v1/dashboard/summary`
Get dashboard KPI summary.

**Response:**
```json
{
  "success": true,
  "data": {
    "weekly_incidents": 5,
    "sla_percentage": 98.5,
    "aws_opex_mtd": 45000,
    "aws_budget_variance": -2000,
    "ics_credits_remaining": 15000
  }
}
```

### InfraOps

#### GET `/api/v1/infra/incidents`
Get incidents with optional filters.

**Query Parameters:**
- `severity`: critical | high | medium | low
- `status`: open | in_progress | resolved | closed
- `squad`: Squad name
- `limit`: Number of results (default: 100)
- `offset`: Pagination offset

#### GET `/api/v1/infra/tasks`
Get tasks with optional filters.

#### GET `/api/v1/infra/uptime`
Get uptime requests.

#### GET `/api/v1/infra/sla`
Get SLA metrics for past weeks.

**Query Parameters:**
- `weeks`: Number of weeks to retrieve (default: 12)

### FinOps

#### GET `/api/v1/finops/summary`
Get FinOps summary (MTD cost, forecast, budget).

#### GET `/api/v1/finops/costs`
Get cost breakdown with filters.

**Query Parameters:**
- `environment`: Production, Staging, etc.
- `service`: AWS service name
- `startDate`: Start date (YYYY-MM-DD)
- `endDate`: End date (YYYY-MM-DD)

#### GET `/api/v1/finops/forecast`
Get cost forecasts.

**Query Parameters:**
- `environment`: Environment name
- `scenario`: baseline | high_load | low_load
- `days`: Days to forecast (default: 30)

#### GET `/api/v1/finops/ics`
Get ICS credits information.

### Reports

#### GET `/api/v1/reports`
List all reports.

#### POST `/api/v1/reports/weekly/generate`
Generate weekly ops report.

**Request:**
```json
{
  "format": "pdf"
}
```

#### POST `/api/v1/reports/monthly/generate`
Generate monthly FinOps report.

#### GET `/api/v1/reports/:id/download`
Download a report file.

### SOPs

#### GET `/api/v1/sop`
Get SOPs with filters.

**Query Parameters:**
- `category`: provisioning | security | incident | custom
- `tags`: Comma-separated tags
- `search`: Search term

#### GET `/api/v1/sop/:id`
Get SOP by ID.

#### POST `/api/v1/sop`
Create new SOP (Manager only).

#### PUT `/api/v1/sop/:id`
Update SOP (Manager only).

## Configuration

### Sync Schedules

Edit these environment variables to control sync frequency:

- `SYNC_INTERVAL_CRON`: Jira and AWS sync (default: `0 */6 * * *` - every 6 hours)
- `REPORT_GENERATION_CRON`: Auto-generate reports (default: `0 8 * * MON` - Monday 8 AM)

### Custom Cron Expressions

```
# ┌───────────── minute (0 - 59)
# │ ┌───────────── hour (0 - 23)
# │ │ ┌───────────── day of month (1 - 31)
# │ │ │ ┌───────────── month (1 - 12)
# │ │ │ │ ┌───────────── day of week (0 - 6) (Sunday=0)
# │ │ │ │ │
# * * * * *

# Examples:
# 0 */4 * * *    - Every 4 hours
# 0 2 * * *      - Daily at 2 AM
# 0 8 * * MON    - Every Monday at 8 AM
```

## Deployment

### Production Checklist

- [ ] Change default admin password
- [ ] Set strong JWT_SECRET
- [ ] Use secure DB_PASSWORD
- [ ] Configure HTTPS/TLS
- [ ] Set up database backups
- [ ] Configure log rotation
- [ ] Set ALLOWED_ORIGINS to production domain
- [ ] Review and set resource limits in docker-compose.yml
- [ ] Enable database connection pooling
- [ ] Set up monitoring and alerts

### Environment-Specific Configurations

#### Production
```env
NODE_ENV=production
LOG_LEVEL=warn
ALLOWED_ORIGINS=https://ops.yourdomain.com
```

#### Staging
```env
NODE_ENV=staging
LOG_LEVEL=info
```

## Monitoring & Logs

### View Application Logs

```bash
# Backend logs
docker-compose logs -f backend

# Frontend logs
docker-compose logs -f frontend

# Database logs
docker-compose logs -f postgres
```

### Health Check

The backend includes a health check endpoint:

```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "status": "OK",
  "timestamp": "2025-01-17T10:30:00.000Z"
}
```

## Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Check PostgreSQL logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres
```

### Jira Sync Failures

1. Verify Jira credentials in `.env`
2. Test connection:
   ```bash
   curl -u "EMAIL:API_TOKEN" https://your-domain.atlassian.net/rest/api/3/myself
   ```
3. Check backend logs for errors

### AWS Cost Explorer Issues

1. Verify AWS credentials have Cost Explorer access
2. Ensure IAM permissions include `ce:GetCostAndUsage`
3. Check AWS region configuration

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Create an issue in the GitHub repository
- Contact the Infra & Security Manager team
