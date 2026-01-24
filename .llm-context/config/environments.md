# Environment Variables - Second Brain

## Overview

Second Brain uses environment variables for configuration. Variables are loaded from `.env` files and should never be committed to version control.

---

## Environment Files

```
.env                    # Never commit (contains secrets)
.env.example            # Commit this (template without secrets)
.env.production         # Production secrets (never commit)
.env.test               # Test environment (optional)
```

---

## Backend Environment Variables

### Required Variables

```bash
# Database
DATABASE_URL=postgresql://secondbrain:password@localhost:5432/secondbrain

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-min-32-chars

# Server
PORT=3001
NODE_ENV=development

# AI Providers (at least one required)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Ollama (optional, for local LLMs)
OLLAMA_BASE_URL=http://localhost:11434
```

---

### Optional Variables

```bash
# Database Pool
DATABASE_POOL_MAX=20
DATABASE_POOL_MIN=2

# JWT
JWT_EXPIRY=24h

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100

# CORS
CORS_ORIGIN=http://localhost:5173

# Logging
LOG_LEVEL=info  # error, warn, info, debug

# Feature Flags
ENABLE_OLLAMA=false
ENABLE_REGISTRATION=true
```

---

## Frontend Environment Variables

**File**: `.env` in `frontend/` directory

### Required

```bash
# API Base URL
VITE_API_URL=http://localhost:3001/api

# App Environment
VITE_NODE_ENV=development
```

### Optional

```bash
# Feature Flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_DEBUG=true
```

**Note**: Vite requires `VITE_` prefix for env vars to be exposed to client

---

## Docker Compose Environment

### PostgreSQL

```bash
POSTGRES_USER=secondbrain
POSTGRES_PASSWORD=securepassword123
POSTGRES_DB=secondbrain
```

### n8n

```bash
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=admin123
N8N_PORT=5678
WEBHOOK_URL=http://n8n:5678/webhook/
```

### Ollama

```bash
OLLAMA_PORT=11434
OLLAMA_MODELS=/root/.ollama/models
```

---

## Environment Setup

### Development Setup

1. **Copy template**:
```bash
cp .env.example .env
```

2. **Edit .env**:
```bash
# Add your API keys
OPENAI_API_KEY=sk-your-key-here
ANTHROPIC_API_KEY=sk-ant-your-key-here

# Use secure JWT secret
JWT_SECRET=$(openssl rand -base64 32)
```

3. **Load variables**:
```bash
# Backend automatically loads .env via dotenv
npm run dev  # Loads .env

# Frontend (Vite automatically loads)
npm run dev
```

---

### Production Setup

1. **Use environment-specific file**:
```bash
NODE_ENV=production node src/index.js
# Loads .env.production if it exists, otherwise .env
```

2. **Or use environment variables directly**:
```bash
export DATABASE_URL=postgresql://...
export JWT_SECRET=...
npm start
```

3. **Docker Compose**:
```bash
# Use .env file in project root
docker-compose up -d
# Automatically loads .env
```

---

## Environment Validation

### Backend Validation (Zod)

**File**: `backend/src/config/env.js` (future)

```javascript
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  PORT: z.string().default('3001'),
  NODE_ENV: z.enum(['development', 'production', 'test']),
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  OLLAMA_BASE_URL: z.string().url().optional()
}).refine(
  (data) => data.OPENAI_API_KEY || data.ANTHROPIC_API_KEY || data.OLLAMA_BASE_URL,
  { message: 'At least one AI provider must be configured' }
);

export const env = envSchema.parse(process.env);
```

---

## Environment-Specific Behavior

### Development

```javascript
if (process.env.NODE_ENV === 'development') {
  // Detailed error messages with stack traces
  // Console logging enabled
  // CORS allows all origins
  // Hot reload enabled
}
```

### Production

```javascript
if (process.env.NODE_ENV === 'production') {
  // Generic error messages only
  // Structured logging to file/service
  // CORS restricted to specific origins
  // Optimized builds
}
```

---

## Security Best Practices

### 1. Never Commit Secrets

```bash
# .gitignore
.env
.env.local
.env.production
.env.*.local
```

### 2. Use Strong Secrets

```bash
# Good: Generate random secrets
JWT_SECRET=$(openssl rand -base64 32)

# Bad: Weak secrets
JWT_SECRET=secret123
```

### 3. Rotate Secrets Regularly

- JWT_SECRET: Every 6-12 months
- API Keys: When compromised or annually
- Database passwords: Annually

### 4. Use Secret Management (Production)

- **AWS Secrets Manager**
- **HashiCorp Vault**
- **Azure Key Vault**
- **GCP Secret Manager**

---

## Environment Variables Reference

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| **Database** ||||
| DATABASE_URL | string | required | PostgreSQL connection string |
| DATABASE_POOL_MAX | number | 20 | Max DB connections |
| DATABASE_POOL_MIN | number | 2 | Min DB connections |
| **Authentication** ||||
| JWT_SECRET | string | required | JWT signing key (min 32 chars) |
| JWT_EXPIRY | string | 24h | Token expiration time |
| **Server** ||||
| PORT | number | 3001 | Backend server port |
| NODE_ENV | enum | development | Environment (development\|production\|test) |
| **AI Providers** ||||
| OPENAI_API_KEY | string | optional | OpenAI API key |
| ANTHROPIC_API_KEY | string | optional | Anthropic API key |
| OLLAMA_BASE_URL | string | optional | Ollama API URL |
| **Security** ||||
| CORS_ORIGIN | string | * | Allowed CORS origins |
| RATE_LIMIT_MAX_REQUESTS | number | 100 | Max requests per window |
| RATE_LIMIT_WINDOW_MS | number | 900000 | Rate limit window (ms) |

---

## Troubleshooting

### Environment Variables Not Loading

**Issue**: Variables not accessible in code

**Solution**:
```bash
# Backend: Check dotenv is loaded
import 'dotenv/config';  // At top of index.js

# Frontend: Check VITE_ prefix
VITE_API_URL=...  # Correct
API_URL=...       # Won't work
```

---

### Database Connection Fails

**Issue**: Cannot connect to PostgreSQL

**Check**:
```bash
# Verify DATABASE_URL format
postgresql://[user]:[password]@[host]:[port]/[database]

# Test connection
psql $DATABASE_URL
```

---

### API Keys Not Working

**Issue**: AI provider returns 401 Unauthorized

**Check**:
```bash
# Verify key is set
echo $OPENAI_API_KEY

# Check for whitespace
OPENAI_API_KEY="sk-..."  # Bad (quotes may cause issues)
OPENAI_API_KEY=sk-...    # Good
```

---

**Last Updated**: 2026-01-24  
**Required Vars**: 4 (DATABASE_URL, JWT_SECRET, PORT, AI provider)  
**Optional Vars**: 10+  
**Security**: Secrets never committed to git
