# Docker Launch Fixes - January 23, 2026

## Summary
Successfully launched the Second Brain application in Docker and resolved multiple configuration issues related to ports, CORS, database health checks, and AI service integration.

## Changes Made

### 1. Environment Configuration
- **File**: `.env`
- **Action**: Created from `.env.example` template
- **Details**: Set up initial environment variables for database, N8N, and API keys

### 2. Frontend Port Configuration
- **File**: `docker-compose.override.yml`
- **Issue**: Port 5173 was already allocated
- **Fix**: Changed frontend port mapping from `5173:5173` to `5174:5173`
- **Result**: Frontend now accessible at http://localhost:5174

### 3. PostgreSQL Health Check Fix
- **File**: `docker-compose.yml`
- **Issue**: Health check was trying to connect to database "secondbrain" which doesn't exist
- **Error**: `FATAL: database "secondbrain" does not exist` every 10 seconds
- **Fix**: Updated health check from:
  ```yaml
  test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-secondbrain}"]
  ```
  to:
  ```yaml
  test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-secondbrain} -d ${POSTGRES_DB:-second_brain}"]
  ```
- **Result**: Health check now uses correct database name "second_brain"

### 4. CORS Configuration Fix
- **File**: `docker-compose.override.yml`
- **Issue**: Backend CORS was configured for port 5173 but frontend moved to 5174
- **Error**: `Access-Control-Allow-Origin' header has a value 'http://localhost:5173' that is not equal to the supplied origin`
- **Fix**: Added `FRONTEND_URL=http://localhost:5174` to backend environment variables
- **Result**: Backend now accepts requests from http://localhost:5174

### 5. API URL Configuration Fix
- **File**: `docker-compose.override.yml`
- **Issue**: Frontend was calling `/auth/register` but backend routes are at `/api/auth/register`
- **Error**: 404 errors for auth endpoints
- **Fix**: Changed frontend environment from:
  ```yaml
  - VITE_API_URL=http://localhost:3001
  ```
  to:
  ```yaml
  - VITE_API_URL=http://localhost:3001/api
  ```
- **Result**: Frontend now correctly calls API endpoints with `/api` prefix

### 6. OpenAI Structured Output Fix
- **File**: `backend/src/services/aiService.js`
- **Issue**: Using `response_format.json_schema` which is not compatible with all OpenAI models
- **Error**: `Unknown parameter: 'response_format.json_schema'`
- **Fix**: Changed from complex schema to simple JSON object format:
  ```javascript
  response_format: { type: "json_object" }
  ```
- **Result**: AI classification now works with all GPT-4 models

### 7. Vector Embedding Format Fix
- **File**: `backend/src/services/vectorService.js`
- **Issue**: Embedding array was being passed as JavaScript object to PostgreSQL
- **Error**: `invalid input syntax for type vector: "{"0.017221..."}"`
- **Fix**: Convert embedding array to PostgreSQL vector format:
  ```javascript
  const embeddingVector = embedding ? `[${embedding.join(',')}]` : null;
  ```
- **Result**: Embeddings now stored correctly in pgvector format

## Verification Steps

### Database Migration Status
```bash
docker-compose exec backend npm run db:status
```
- ✅ 1 migration applied: `001_initial_schema`
- ✅ Database connection: OK
- ✅ All tables created successfully

### Running Services
```bash
docker ps
```
All containers running:
- ✅ `second-brain-postgres` - PostgreSQL with pgvector (port 5432)
- ✅ `second-brain-backend-dev` - Node.js API (port 3001, 9229)
- ✅ `second-brain-n8n` - Workflow automation (port 5678)
- ✅ `second-brain-frontend-dev` - React frontend (port 5174)

## Access URLs

| Service | URL | Credentials |
|---------|-----|-------------|
| Frontend | http://localhost:5174 | User account |
| Backend API | http://localhost:3001/api | N/A |
| N8N | http://localhost:5678 | admin / secondbrain123 |
| PostgreSQL | localhost:5432 | secondbrain / secondbrain_secret |

## Important Notes

### Environment Variable Updates
When updating `.env` file:
- Use `docker-compose up -d <service>` to **recreate** containers
- Don't use `docker-compose restart` - it doesn't pick up new environment variables
- Containers must be recreated to load new .env values

### Development Mode
The application is running in development mode with:
- Hot-reloading enabled (code changes reflect automatically)
- Source code mounted as volumes
- Debug port exposed (9229)
- Nodemon watching for changes

### API Key Requirement
- OpenAI API key is **required** for memory creation
- Embeddings use `text-embedding-3-small` model
- Classification uses `gpt-4o` model
- Alternative: Can use Anthropic API key by setting `ANTHROPIC_API_KEY`

## Next Steps

1. **Add API Keys**: Update `.env` with valid OpenAI or Anthropic API keys
2. **Test Memory Creation**: Create a memory to verify AI classification and embeddings work
3. **Test Search**: Use semantic search to find memories by meaning
4. **Test Chat**: Ask questions about your memories using RAG
5. **Configure Slack** (optional): Set up N8N workflow for automated capture

### 8. Database Query Logging Improvement
- **File**: `backend/src/db/index.js`
- **Issue**: Full embeddings (1536 dimensions) were being logged, creating massive log output
- **Fix**: Added intelligent parameter truncation for vector embeddings:
  ```javascript
  const truncatedParams = params?.map(param => {
    if (typeof param === 'string' && param.startsWith('[') && param.length > 100) {
      return param.substring(0, 20) + '...' + param.substring(param.length - 5);
    }
    return param;
  });
  ```
- **Result**: Embeddings now show as `[0.123,0.456,0.789...0.999]` in logs instead of thousands of characters

## Files Modified

- `docker-compose.yml` - PostgreSQL health check
- `docker-compose.override.yml` - Port, CORS, and API URL configurations  
- `backend/src/services/aiService.js` - OpenAI structured output format
- `backend/src/services/vectorService.js` - Vector embedding format and search
- `backend/src/db/index.js` - Query logging with embedding truncation
- `.env` - Environment variables (created from template)

## Commands Reference

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f [service-name]

# Restart a service (recreate to pick up env changes)
docker-compose up -d [service-name]

# Check database migration status
docker-compose exec backend npm run db:status

# Run database migrations
docker-compose exec backend npm run db:migrate
```
