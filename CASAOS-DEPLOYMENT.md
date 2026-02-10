# Second Brain - CasaOS Deployment Guide

## 📋 Prerequisites

Before deploying to CasaOS, ensure you have:
- ✅ CasaOS installed and running
- ✅ At least 4GB of free RAM
- ✅ 10GB of free disk space
- ✅ OpenAI or Anthropic API key

## 🚀 Deployment Steps

### Step 1: Copy Project to CasaOS

Copy the entire project to your CasaOS server:

```bash
# Option A: Using SCP from your local machine
scp -r /path/to/secondbrainv1 user@casaos-ip:/DATA/Apps/

# Option B: Using git on CasaOS server
ssh user@casaos-ip
cd /DATA/Apps
git clone <your-repo-url> secondbrainv1
```

Verify the project structure:
```bash
ls -la /DATA/Apps/secondbrainv1
# Should show: backend/, frontend/, shared/, n8n/, docker-compose-casaos.yml, etc.
```

### Step 2: Configure Environment Variables

1. **Create environment file**:
```bash
cd /DATA/Apps/secondbrainv1
cp .env.casaos.example .env
```

2. **Edit the .env file**:
```bash
nano .env
```

3. **Update these critical values**:
```env
# Strong database password
POSTGRES_PASSWORD=your_very_secure_password_here

# Strong N8N password
N8N_PASSWORD=your_n8n_secure_password

# Your API key (at least one required)
OPENAI_API_KEY=sk-proj-...your-actual-key...

# Strong JWT secret (32+ characters)
JWT_SECRET=generate_a_random_string_at_least_32_characters_long

# Your CasaOS server IP
VITE_API_URL=http://192.168.1.XXX:3101/api
```

**Generate a secure JWT secret**:
```bash
# On Linux/Mac
openssl rand -base64 48

# Or use online generator
# https://www.random.org/strings/
```

### Step 3: Import to CasaOS

1. **Open CasaOS Web UI**: Navigate to `http://your-casaos-ip` in your browser

2. **Go to App Store**: Click on the App Store icon

3. **Custom Install**:
   - Click "Custom Install" button
   - Select "Import Compose File"

4. **Import the compose file**:
   - Click "Upload File" or paste the content
   - Upload: `/DATA/Apps/secondbrainv1/docker-compose-casaos.yml`
   - Or paste the entire contents of `docker-compose-casaos.yml`

5. **Review and Deploy**:
   - CasaOS will parse the file
   - Review the services (5 total: postgres, n8n, backend, frontend, ollama)
   - Click "Deploy" or "Install"

6. **Wait for Build**:
   - CasaOS will run `docker compose build` (2-5 minutes)
   - Then run `docker compose up -d`
   - Monitor progress in the CasaOS interface

### Step 4: Verify Deployment

**Check container status**:
```bash
docker ps | grep secondbrain
```

You should see 5 containers running:
- `secondbrain-postgres`
- `secondbrain-n8n`
- `secondbrain-backend`
- `secondbrain-frontend`
- `secondbrain-ollama`

**Check logs**:
```bash
# Backend logs
docker logs secondbrain-backend

# Frontend logs
docker logs secondbrain-frontend

# PostgreSQL logs
docker logs secondbrain-postgres
```

**Check database migrations**:
```bash
docker exec secondbrain-backend npm run db:status
```

Should show:
```
✅ Database connection: OK
✅ Migrations applied: X/X
```

### Step 5: Access the Application

| Service | URL | Credentials |
|---------|-----|-------------|
| **Frontend** | `http://YOUR_CASAOS_IP:3100` | Sign up for new account |
| **Backend API** | `http://YOUR_CASAOS_IP:3101/api` | Bearer token |
| **N8N** | `http://YOUR_CASAOS_IP:5679` | admin / your_n8n_password |
| **PostgreSQL** | `YOUR_CASAOS_IP:5433` | secondbrain / your_db_password |

### Step 6: Create First User

1. Navigate to: `http://YOUR_CASAOS_IP:3100`
2. Click "Sign Up"
3. Create your account
4. Login with your credentials

### Step 7: (Optional) Configure Ollama

If you want to use local LLMs:

```bash
# Pull a model
docker exec secondbrain-ollama ollama pull llama3.2

# Test the model
docker exec secondbrain-ollama ollama run llama3.2 "Hello"

# List available models
docker exec secondbrain-ollama ollama list
```

In the app:
1. Go to Settings → LLM Settings
2. Select "Ollama" as provider
3. Choose your model (e.g., llama3.2)
4. Save settings

## 🔧 Port Mappings

The compose file uses these ports to avoid conflicts with common CasaOS services:

| Service | Internal Port | External Port | Notes |
|---------|--------------|---------------|-------|
| Frontend | 80 | 3100 | React web app |
| Backend | 3001 | 3101 | Express API |
| PostgreSQL | 5432 | 5433 | Avoids conflict with port 5432 |
| N8N | 5678 | 5679 | Avoids conflict with port 5678 |
| Ollama | 11434 | 11435 | Avoids conflict with port 11434 |

## 🔄 Updating the Application

To update after making code changes:

```bash
# Rebuild and restart services
cd /DATA/Apps/secondbrainv1
docker compose -f docker-compose-casaos.yml down
docker compose -f docker-compose-casaos.yml build
docker compose -f docker-compose-casaos.yml up -d

# Or rebuild single service
docker compose -f docker-compose-casaos.yml up -d --build backend
```

## 🗄️ Database Management

**Run migrations**:
```bash
docker exec secondbrain-backend npm run db:migrate
```

**Check migration status**:
```bash
docker exec secondbrain-backend npm run db:status
```

**Database backup**:
```bash
docker exec secondbrain-postgres pg_dump -U secondbrain second_brain > backup_$(date +%Y%m%d).sql
```

**Database restore**:
```bash
cat backup_20260210.sql | docker exec -i secondbrain-postgres psql -U secondbrain -d second_brain
```

## 🧹 Maintenance

**View logs**:
```bash
# All services
docker compose -f /DATA/Apps/secondbrainv1/docker-compose-casaos.yml logs -f

# Specific service
docker logs -f secondbrain-backend
```

**Restart services**:
```bash
# All services
docker compose -f /DATA/Apps/secondbrainv1/docker-compose-casaos.yml restart

# Specific service
docker restart secondbrain-backend
```

**Stop all services**:
```bash
docker compose -f /DATA/Apps/secondbrainv1/docker-compose-casaos.yml down
```

**Stop and remove volumes** (⚠️ deletes all data):
```bash
docker compose -f /DATA/Apps/secondbrainv1/docker-compose-casaos.yml down -v
```

## 🔒 Security Recommendations

1. **Change default passwords** immediately after deployment
2. **Use strong JWT secret** (32+ random characters)
3. **Restrict external access** via firewall if not needed
4. **Enable HTTPS** via reverse proxy (nginx-proxy-manager, Caddy, etc.)
5. **Regular backups** of PostgreSQL data
6. **Keep API keys secure** - never commit .env to git

## 🐛 Troubleshooting

### Backend won't start
```bash
# Check database connection
docker logs secondbrain-backend | grep -i database

# Verify environment variables
docker exec secondbrain-backend env | grep DATABASE_URL

# Test database connectivity
docker exec secondbrain-backend node -e "require('./src/db').query('SELECT 1').then(() => console.log('DB OK')).catch(console.error)"
```

### Frontend shows connection error
```bash
# Check VITE_API_URL in frontend
docker exec secondbrain-frontend cat /usr/share/nginx/html/index.html | grep -o 'VITE_API_URL.*'

# Verify backend is accessible
curl http://YOUR_CASAOS_IP:3101/health
```

### Database migrations fail
```bash
# Check migration status
docker exec secondbrain-backend npm run db:status

# Run migrations manually
docker exec secondbrain-backend npm run db:migrate

# Check for errors
docker logs secondbrain-backend
```

### Ollama not responding
```bash
# Check if service is running
docker ps | grep ollama

# Check health
curl http://YOUR_CASAOS_IP:11435/api/tags

# View logs
docker logs secondbrain-ollama
```

## 📊 Resource Usage

Expected resource usage:
- **RAM**: 2-4GB total
  - PostgreSQL: 200-500MB
  - Backend: 150-300MB
  - Frontend: 10-20MB
  - N8N: 200-400MB
  - Ollama: 1-2GB (when model loaded)
- **Disk**: 5-10GB (depends on number of memories and Ollama models)
- **CPU**: Low (spikes during AI processing)

## 🔗 Next Steps

1. ✅ Configure LLM Settings in the UI
2. ✅ Set up N8N workflows for automated capture
3. ✅ Connect Slack integration (optional)
4. ✅ Create your first memories
5. ✅ Test semantic search
6. ✅ Try the AI chat feature

## 📚 Additional Documentation

- [Quick Start Guide](.llm-context/QUICK_START.md)
- [LLM Settings Guide](docs/LLM-SETTINGS-QUICKSTART.md)
- [Smart Search Guide](docs/SMART-SEARCH-QUICKSTART.md)
- [AI Chat Guide](docs/AI-CHAT-FEATURE.md)
- [iOS Shortcuts](docs/IOS-SHORTCUTS-TUTORIAL.md)

---

**Questions or Issues?**
- Check the logs first: `docker compose logs -f`
- Review environment variables in `.env`
- Ensure all ports are available and not conflicting
- Verify API keys are valid
