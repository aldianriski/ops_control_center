# Deployment Guide

**Edot Ops Control Center - Production Deployment**
**Version:** 1.0.0
**Last Updated:** 2025-11-17

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Environment Setup](#environment-setup)
4. [Docker Deployment](#docker-deployment)
5. [Production Deployment](#production-deployment)
6. [SSL/TLS Configuration](#ssltls-configuration)
7. [Database Setup](#database-setup)
8. [Monitoring & Logging](#monitoring--logging)
9. [Backup & Recovery](#backup--recovery)
10. [Troubleshooting](#troubleshooting)

---

## Overview

This guide covers deploying the Edot Ops Control Center to production environments using Docker and Docker Compose.

**Architecture:**
- **Frontend:** React 18 + Vite (served via Nginx)
- **Backend:** Node.js + Express + TypeScript
- **Database:** PostgreSQL 15
- **Reverse Proxy:** Nginx (optional)

---

## Prerequisites

### System Requirements

**Minimum:**
- **CPU:** 2 cores
- **RAM:** 4GB
- **Storage:** 20GB SSD
- **OS:** Ubuntu 20.04+ / Debian 11+ / RHEL 8+

**Recommended:**
- **CPU:** 4 cores
- **RAM:** 8GB
- **Storage:** 50GB SSD

### Software Requirements

```bash
# Docker
docker --version  # >= 20.10.0

# Docker Compose
docker-compose --version  # >= 2.0.0

# Node.js (for local development)
node --version  # >= 18.0.0
npm --version   # >= 9.0.0

# PostgreSQL client (for database management)
psql --version  # >= 15.0
```

### External Services

- **Jira API Access:** API token with read permissions
- **AWS Access:** IAM credentials with Cost Explorer access
- **Grafana (Optional):** For dashboard integration
- **SMTP Server (Optional):** For email notifications

---

## Environment Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/ops_control_center.git
cd ops_control_center
```

### 2. Configure Backend Environment

Create `.env` file in the project root:

```bash
cp .env.example .env
nano .env
```

**Backend Configuration (.env):**

```env
# =============================================================================
# DATABASE CONFIGURATION
# =============================================================================
DB_HOST=postgres
DB_PORT=5432
DB_NAME=ops_control_center
DB_USER=ops_user
DB_PASSWORD=CHANGE_THIS_SECURE_PASSWORD_123!

# =============================================================================
# JWT AUTHENTICATION
# =============================================================================
# Generate with: openssl rand -base64 64
JWT_SECRET=CHANGE_THIS_LONG_RANDOM_JWT_SECRET_KEY_MIN_32_CHARS

# Token expiration (e.g., 1h, 24h, 7d)
JWT_EXPIRES_IN=24h

# =============================================================================
# SERVER CONFIGURATION
# =============================================================================
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# Allowed origins (comma-separated)
ALLOWED_ORIGINS=https://ops.yourdomain.com

# =============================================================================
# JIRA INTEGRATION
# =============================================================================
JIRA_BASE_URL=https://your-company.atlassian.net
JIRA_EMAIL=jira-api@yourdomain.com
JIRA_API_TOKEN=your_jira_api_token_here
JIRA_PROJECT_KEY=INFRA

# =============================================================================
# AWS INTEGRATION
# =============================================================================
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=us-east-1

# =============================================================================
# SYNC SCHEDULES (CRON FORMAT)
# =============================================================================
# Jira & AWS sync schedule (every 6 hours)
SYNC_INTERVAL_CRON=0 */6 * * *

# Auto-generate reports (Monday 8 AM)
REPORT_GENERATION_CRON=0 8 * * MON

# =============================================================================
# EMAIL NOTIFICATIONS (OPTIONAL)
# =============================================================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=notifications@yourdomain.com
SMTP_PASSWORD=your_smtp_password
EMAIL_FROM=ops-control-center@yourdomain.com

# =============================================================================
# GRAFANA INTEGRATION (OPTIONAL)
# =============================================================================
GRAFANA_URL=https://grafana.yourdomain.com
GRAFANA_API_KEY=your_grafana_api_key
```

### 3. Configure Frontend Environment

Create `.env` file in the `frontend` directory:

```bash
cp frontend/.env.example frontend/.env
nano frontend/.env
```

**Frontend Configuration (frontend/.env):**

```env
# API Configuration
VITE_API_URL=https://api.ops.yourdomain.com
VITE_WS_URL=wss://api.ops.yourdomain.com

# Application Mode
VITE_APP_MODE=production
VITE_MOCK_API=false

# Feature Flags
VITE_FEATURE_AI_FORECAST=true
VITE_FEATURE_REPORT_SCHEDULING=true
VITE_FEATURE_GRAFANA=true
VITE_FEATURE_GLOBAL_SEARCH=true
VITE_FEATURE_ENV_COMPARISON=true
VITE_FEATURE_COLLABORATION=true
VITE_FEATURE_CUSTOM_DASHBOARDS=true
VITE_FEATURE_SAVED_FILTERS=true
VITE_FEATURE_RBAC=true

# External Services
VITE_GRAFANA_URL=https://grafana.yourdomain.com
VITE_JIRA_URL=https://your-company.atlassian.net

# Production Settings
VITE_DEBUG_MODE=false
VITE_SHOW_RATE_LIMIT_WARNINGS=true
VITE_ENABLE_PERFORMANCE_MONITORING=true
```

---

## Docker Deployment

### 1. Docker Compose Configuration

**docker-compose.yml:**

```yaml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: ops_postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/database/init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - ops_network

  # Backend API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: ops_backend
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres
      - DB_PORT=5432
      - DB_NAME=${DB_NAME}
      - DB_USER=${DB_USER}
      - DB_PASSWORD=${DB_PASSWORD}
      - JWT_SECRET=${JWT_SECRET}
      - JWT_EXPIRES_IN=${JWT_EXPIRES_IN}
      - JIRA_BASE_URL=${JIRA_BASE_URL}
      - JIRA_EMAIL=${JIRA_EMAIL}
      - JIRA_API_TOKEN=${JIRA_API_TOKEN}
      - JIRA_PROJECT_KEY=${JIRA_PROJECT_KEY}
      - AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
      - AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
      - AWS_REGION=${AWS_REGION}
      - SYNC_INTERVAL_CRON=${SYNC_INTERVAL_CRON}
      - REPORT_GENERATION_CRON=${REPORT_GENERATION_CRON}
    ports:
      - "3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - ./backend/logs:/app/logs
      - ./backend/reports:/app/reports
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - ops_network

  # Frontend (Nginx)
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        - VITE_API_URL=${VITE_API_URL}
        - VITE_WS_URL=${VITE_WS_URL}
        - VITE_GRAFANA_URL=${VITE_GRAFANA_URL}
    container_name: ops_frontend
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - backend
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    networks:
      - ops_network

volumes:
  postgres_data:
    driver: local

networks:
  ops_network:
    driver: bridge
```

### 2. Backend Dockerfile

**backend/Dockerfile:**

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY src ./src

# Build TypeScript
RUN npm run build

# Production image
FROM node:18-alpine

WORKDIR /app

# Copy built files and dependencies
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Create directories for logs and reports
RUN mkdir -p /app/logs /app/reports

# Set user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "dist/index.js"]
```

### 3. Frontend Dockerfile

**frontend/Dockerfile:**

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build arguments
ARG VITE_API_URL
ARG VITE_WS_URL
ARG VITE_GRAFANA_URL

# Set environment variables for build
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WS_URL=$VITE_WS_URL
ENV VITE_GRAFANA_URL=$VITE_GRAFANA_URL

# Build app
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose ports
EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
```

### 4. Nginx Configuration

**frontend/nginx.conf:**

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name ops.yourdomain.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ops.yourdomain.com;

    # SSL certificates
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Root directory
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml+rss;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # API proxy
    location /api {
        proxy_pass http://backend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket proxy
    location /ws {
        proxy_pass http://backend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Frontend routes (SPA)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 5. Deploy with Docker Compose

```bash
# Build and start services
docker-compose up -d --build

# View logs
docker-compose logs -f

# Check service status
docker-compose ps

# Stop services
docker-compose down

# Stop and remove volumes (⚠️ DATA LOSS)
docker-compose down -v
```

---

## Production Deployment

### 1. Initial Setup

```bash
# 1. Update system
sudo apt update && sudo apt upgrade -y

# 2. Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# 3. Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 4. Clone repository
git clone https://github.com/your-org/ops_control_center.git
cd ops_control_center

# 5. Configure environment
cp .env.example .env
nano .env  # Edit with production values

# 6. Deploy
docker-compose up -d --build
```

### 2. Database Migration

```bash
# Enter backend container
docker-compose exec backend sh

# Run migrations
npm run migrate

# Seed initial data (optional)
npm run seed

# Exit container
exit
```

### 3. Create Admin User

```bash
# Access PostgreSQL
docker-compose exec postgres psql -U ops_user -d ops_control_center

# Create admin user
INSERT INTO users (id, email, name, password_hash, role, created_at)
VALUES (
  gen_random_uuid(),
  'admin@yourdomain.com',
  'System Administrator',
  '$2b$10$...',  -- Generate with bcrypt
  'admin',
  NOW()
);

# Exit
\q
```

### 4. Verify Deployment

```bash
# Check all services are running
docker-compose ps

# Test backend API
curl http://localhost:3000/health

# Test frontend
curl http://localhost:80
```

---

## SSL/TLS Configuration

### 1. Using Let's Encrypt (Certbot)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Generate certificate
sudo certbot --nginx -d ops.yourdomain.com

# Auto-renewal
sudo systemctl enable certbot.timer
```

### 2. Manual SSL Certificate

```bash
# Create SSL directory
mkdir -p nginx/ssl

# Copy certificates
cp /path/to/cert.pem nginx/ssl/
cp /path/to/key.pem nginx/ssl/

# Set permissions
chmod 600 nginx/ssl/key.pem
```

---

## Database Setup

### 1. Backup Strategy

**Automated Daily Backups:**

```bash
#!/bin/bash
# /opt/ops_backup.sh

BACKUP_DIR="/backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

docker-compose exec -T postgres pg_dump -U ops_user ops_control_center | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Cleanup old backups (keep 30 days)
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete
```

**Cron Job:**
```bash
# Add to crontab
0 2 * * * /opt/ops_backup.sh
```

### 2. Restore from Backup

```bash
# Stop backend
docker-compose stop backend

# Restore database
gunzip -c /backups/postgres/backup_YYYYMMDD_HHMMSS.sql.gz | \
  docker-compose exec -T postgres psql -U ops_user ops_control_center

# Start backend
docker-compose start backend
```

---

## Monitoring & Logging

### 1. Application Logs

```bash
# View backend logs
docker-compose logs -f backend

# View frontend logs
docker-compose logs -f frontend

# View database logs
docker-compose logs -f postgres

# Export logs
docker-compose logs backend > backend.log
```

### 2. Log Rotation

**logrotate configuration:**

```bash
# /etc/logrotate.d/ops_control_center
/var/lib/docker/containers/*/*.log {
    daily
    rotate 7
    compress
    missingok
    notifempty
    copytruncate
}
```

### 3. Health Monitoring

**health-check.sh:**
```bash
#!/bin/bash

# Check backend health
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo "Backend: OK"
else
    echo "Backend: FAIL"
    # Send alert
fi

# Check database
if docker-compose exec postgres pg_isready -U ops_user > /dev/null 2>&1; then
    echo "Database: OK"
else
    echo "Database: FAIL"
    # Send alert
fi
```

---

## Backup & Recovery

### Full System Backup

```bash
#!/bin/bash
# Full backup script

BACKUP_ROOT="/backups/ops_control_center"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="$BACKUP_ROOT/$DATE"

mkdir -p $BACKUP_DIR

# Backup database
docker-compose exec -T postgres pg_dump -U ops_user ops_control_center | gzip > $BACKUP_DIR/database.sql.gz

# Backup volumes
docker run --rm -v ops_control_center_postgres_data:/data -v $BACKUP_DIR:/backup alpine tar czf /backup/postgres_data.tar.gz -C /data .

# Backup configuration
cp .env $BACKUP_DIR/
cp docker-compose.yml $BACKUP_DIR/

echo "Backup completed: $BACKUP_DIR"
```

### Disaster Recovery

```bash
# 1. Restore configuration
cp /backups/ops_control_center/YYYYMMDD_HHMMSS/.env ./
cp /backups/ops_control_center/YYYYMMDD_HHMMSS/docker-compose.yml ./

# 2. Restore database
gunzip -c /backups/ops_control_center/YYYYMMDD_HHMMSS/database.sql.gz | \
  docker-compose exec -T postgres psql -U ops_user ops_control_center

# 3. Restart services
docker-compose restart
```

---

## Troubleshooting

### Common Issues

**1. Database Connection Errors**

```bash
# Check database is running
docker-compose ps postgres

# Check logs
docker-compose logs postgres

# Restart database
docker-compose restart postgres
```

**2. Backend Not Starting**

```bash
# Check logs
docker-compose logs backend

# Check environment variables
docker-compose exec backend env

# Restart backend
docker-compose restart backend
```

**3. Frontend 502 Bad Gateway**

```bash
# Check backend is running
curl http://localhost:3000/health

# Check nginx configuration
docker-compose exec frontend nginx -t

# Restart frontend
docker-compose restart frontend
```

**4. High Memory Usage**

```bash
# Check resource usage
docker stats

# Limit container memory in docker-compose.yml
services:
  backend:
    mem_limit: 1g
    mem_reservation: 512m
```

---

## Security Checklist

- [ ] Change default admin password
- [ ] Set strong JWT_SECRET (min 32 characters)
- [ ] Use secure DB_PASSWORD
- [ ] Configure HTTPS/TLS with valid certificates
- [ ] Set restrictive ALLOWED_ORIGINS
- [ ] Enable firewall (only allow 80, 443, 22)
- [ ] Regular security updates (`docker-compose pull`)
- [ ] Enable database backups
- [ ] Configure log rotation
- [ ] Set up monitoring alerts
- [ ] Disable debug mode in production
- [ ] Review and update dependencies regularly

---

## Support

For deployment issues:
- **Documentation:** [GitHub Wiki](https://github.com/your-org/ops_control_center/wiki)
- **Issues:** [GitHub Issues](https://github.com/your-org/ops_control_center/issues)
- **Email:** infrastructure@yourdomain.com

---

**Document Version:** 1.0.0
**Last Updated:** 2025-11-17
**Maintained By:** Edot Infrastructure Team
