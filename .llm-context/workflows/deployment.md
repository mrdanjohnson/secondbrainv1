# Docker Deployment - Second Brain

## Overview

Second Brain is deployed using Docker Compose, orchestrating 5 services:
1. PostgreSQL (database + pgvector)
2. n8n (workflow automation)
3. Backend API (Node.js/Express)
4. Frontend (React SPA)
5. Ollama (optional, local LLMs)

---

## Quick Start

```bash
# 1. Clone repository
git clone https://github.com/yourusername/secondbrainv1.git
cd secondbrainv1

# 2. Configure environment
cp .env.example .env
# Edit .env with your API keys

# 3. Start all services
docker-compose up -d

# 4. Check status
docker-compose ps

# 5. View logs
docker-compose logs -f

# 6. Access application
# Frontend: http://localhost:5173
# Backend API: http://localhost:3001
# n8n: http://localhost:5678
# PostgreSQL: localhost:5432
```

---

## Docker Compose Configuration

### Main File
**File**: `docker-compose.yml`

```yaml
version: '3.8'

services:
  # PostgreSQL Database
  db:
    image: postgres:16
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-secondbrain}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-password}
      POSTGRES_DB: ${POSTGRES_DB:-secondbrain}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./shared/init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U secondbrain"]
      interval: 10s
      timeout: 5s
      retries: 5

  # n8n Workflow Automation
  n8n:
    image: n8nio/n8n:latest
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=${N8N_USER:-admin}
      - N8N_BASIC_AUTH_PASSWORD=${N8N_PASSWORD:-admin}
      - WEBHOOK_URL=http://n8n:5678/
    volumes:
      - n8n_data:/home/node/.n8n
      - ./n8n/workflows:/home/node/.n8n/workflows
    ports:
      - "5678:5678"
    depends_on:
      - db

  # Backend API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      - DATABASE_URL=postgresql://${POSTGRES_USER:-secondbrain}:${POSTGRES_PASSWORD:-password}@db:5432/${POSTGRES_DB:-secondbrain}
      - JWT_SECRET=${JWT_SECRET}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - OLLAMA_BASE_URL=http://ollama:11434
      - PORT=3001
      - NODE_ENV=production
    ports:
      - "3001:3001"
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped

  # Frontend
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        - VITE_API_URL=http://localhost:3001/api
    ports:
      - "5173:80"
    depends_on:
      - backend
    restart: unless-stopped

  # Ollama (Optional)
  ollama:
    image: ollama/ollama:latest
    volumes:
      - ollama_data:/root/.ollama
    ports:
      - "11434:11434"
    restart: unless-stopped
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]  # Requires nvidia-docker

volumes:
  postgres_data:
  n8n_data:
  ollama_data:
```

---

## Development Override

**File**: `docker-compose.override.yml`

```yaml
version: '3.8'

services:
  backend:
    build:
      target: development
    volumes:
      - ./backend:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
    command: npm run dev

  frontend:
    build:
      target: development
    volumes:
      - ./frontend:/app
      - /app/node_modules
    command: npm run dev
    ports:
      - "5173:5173"
```

**Usage**:
```bash
# Development (uses override automatically)
docker-compose up

# Production (skip override)
docker-compose -f docker-compose.yml up -d
```

---

## Dockerfile Examples

### Backend Dockerfile

**File**: `backend/Dockerfile`

```dockerfile
# Multi-stage build
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./

# Development stage
FROM base AS development
RUN npm install
COPY . .
CMD ["npm", "run", "dev"]

# Production build stage
FROM base AS build
RUN npm ci --only=production
COPY . .

# Production stage
FROM node:20-alpine AS production
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/src ./src
COPY --from=build /app/package.json ./

ENV NODE_ENV=production
EXPOSE 3001

CMD ["node", "src/index.js"]
```

---

### Frontend Dockerfile

**File**: `frontend/Dockerfile`

```dockerfile
# Build stage
FROM node:20-alpine AS build
WORKDIR /app

ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage (Nginx)
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Nginx Config** (`frontend/nginx.conf`):
```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location /assets {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## Deployment Commands

### Build & Start

```bash
# Build images
docker-compose build

# Start all services
docker-compose up -d

# Start specific service
docker-compose up -d backend

# Rebuild and start
docker-compose up -d --build
```

---

### Stop & Remove

```bash
# Stop all services
docker-compose stop

# Stop and remove containers
docker-compose down

# Remove containers, networks, and volumes
docker-compose down -v

# Remove everything including images
docker-compose down -v --rmi all
```

---

### Logs & Monitoring

```bash
# View logs for all services
docker-compose logs

# Follow logs
docker-compose logs -f

# Logs for specific service
docker-compose logs backend

# Last 100 lines
docker-compose logs --tail=100

# Timestamps
docker-compose logs -t
```

---

### Execute Commands

```bash
# Run command in container
docker-compose exec backend npm run db:migrate

# Shell access
docker-compose exec backend sh
docker-compose exec db psql -U secondbrain

# Run one-off command
docker-compose run --rm backend npm test
```

---

## Database Initialization

### Automatic Initialization

When PostgreSQL container first starts, it runs:
```
./shared/init.sql
```

This creates:
- pgvector extension
- All tables
- Indexes
- Default categories

### Manual Migration

```bash
# After changing database schema
docker-compose exec backend npm run db:migrate

# Check migration status
docker-compose exec backend npm run db:status
```

---

## Health Checks

### Service Health

```bash
# Check all services
docker-compose ps

# Healthcheck for PostgreSQL
docker-compose exec db pg_isready -U secondbrain

# Backend API health
curl http://localhost:3001/health

# Frontend
curl http://localhost:5173
```

---

## Scaling (Future)

### Horizontal Scaling

```bash
# Run multiple backend instances
docker-compose up -d --scale backend=3

# Requires load balancer (Nginx/Traefik)
```

---

## Production Deployment

### Prerequisites

1. **Server Requirements**:
   - OS: Ubuntu 22.04 LTS (recommended)
   - RAM: 4GB minimum, 8GB recommended
   - Storage: 20GB minimum (SSD recommended)
   - CPU: 2 cores minimum

2. **Install Docker**:
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

3. **Install Docker Compose**:
```bash
sudo apt-get update
sudo apt-get install docker-compose-plugin
```

---

### Deployment Steps

```bash
# 1. Clone repository
git clone https://github.com/yourusername/secondbrainv1.git
cd secondbrainv1

# 2. Create production .env
cp .env.example .env
nano .env  # Add production secrets

# 3. Pull images (if using registry)
docker-compose pull

# 4. Build images
docker-compose build --no-cache

# 5. Start services
docker-compose up -d

# 6. Check logs
docker-compose logs -f

# 7. Run migrations
docker-compose exec backend npm run db:migrate

# 8. Test endpoints
curl http://localhost:3001/health
curl http://localhost:5173
```

---

### Reverse Proxy (Nginx)

**Install Nginx**:
```bash
sudo apt install nginx
```

**Config** (`/etc/nginx/sites-available/secondbrain`):
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Enable**:
```bash
sudo ln -s /etc/nginx/sites-available/secondbrain /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

### SSL/HTTPS (Let's Encrypt)

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal (already set up)
sudo certbot renew --dry-run
```

---

## Backup & Restore

### Database Backup

```bash
# Backup
docker-compose exec db pg_dump -U secondbrain secondbrain > backup_$(date +%Y%m%d).sql

# Or using docker cp
docker-compose exec db pg_dump -U secondbrain -F c secondbrain > /tmp/backup.dump
docker cp secondbrain_db_1:/tmp/backup.dump ./backups/
```

### Restore

```bash
# From SQL
docker-compose exec -T db psql -U secondbrain secondbrain < backup_20260124.sql

# From custom format
docker-compose exec db pg_restore -U secondbrain -d secondbrain /tmp/backup.dump
```

---

## Monitoring

### Resource Usage

```bash
# Container stats
docker stats

# Service-specific
docker stats secondbrainv1_backend_1
```

### Application Monitoring (Future)

- **Prometheus** + Grafana
- **Sentry** (error tracking)
- **DataDog** (APM)

---

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose logs backend

# Inspect container
docker inspect secondbrainv1_backend_1

# Check health
docker-compose ps
```

### Database Connection Issues

```bash
# Test from backend container
docker-compose exec backend node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT NOW()', (err, res) => {
  console.log(err || res.rows);
  pool.end();
});
"
```

### Port Already in Use

```bash
# Find process using port
sudo lsof -i :3001
sudo netstat -tulpn | grep 3001

# Kill process
kill -9 <PID>

# Or change port in docker-compose.yml
ports:
  - "3002:3001"  # Use different host port
```

---

**Last Updated**: 2026-01-24  
**Docker Version**: 24.x+  
**Docker Compose**: v2.x  
**Services**: 5 (PostgreSQL, n8n, Backend, Frontend, Ollama)
