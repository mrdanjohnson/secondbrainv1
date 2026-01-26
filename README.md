# Second Brain AI System

A powerful, AI-powered knowledge management system that automatically captures, organizes, and helps you retrieve your thoughts and ideas.

## Features

- **Automated Capture**: Post thoughts to Slack and have them automatically organized
- **AI Classification**: Automatic categorization and tagging using GPT-4/Claude
- **Vector Search**: Semantic search that understands meaning, not just keywords
- **RAG Chat**: Chat with your Second Brain to retrieve and connect knowledge
- **🆕 LLM Settings**: Choose AI providers (OpenAI, Claude, Ollama) per feature
- **🆕 Local LLMs**: Run AI models locally with Ollama for privacy and cost savings
- **Modern UI**: Beautiful React frontend with dark mode support
- **Self-Hosted**: Full Docker deployment for complete control

## Quick Start

### Prerequisites

- Docker and Docker Compose
- OpenAI API key (or Anthropic API key)
- Slack workspace (optional, for capture integration)

### 1. Clone and Configure

```bash
git clone <repository-url>
cd second-brain

# Copy environment template
cp .env.example .env

# Edit .env with your API keys
nano .env
```

### 2. Configure Environment Variables

Edit `.env` with your configuration:

```env
# Database
POSTGRES_USER=secondbrain
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=second_brain

# N8N
N8N_USER=admin
N8N_PASSWORD=your_secure_n8n_password

# AI API Keys
OPENAI_API_KEY=sk-your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key  # Optional: for Claude support

# Vector Embeddings (System-Wide)
EMBEDDING_PROVIDER=openai              # Options: 'openai' or 'ollama'
EMBEDDING_MODEL=text-embedding-3-small # Must be consistent for all memories

# Security
JWT_SECRET=your-super-secret-jwt-key

# Optional: Ollama (for local LLMs)
OLLAMA_API_URL=http://ollama:11434  # Default in Docker
```

**🆕 New in v2.0**: You can now run AI models locally using Ollama! This eliminates API costs and keeps your data completely private. See [LLM Settings Guide](#llm-settings--local-ai) below.

### 3. Start Services

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

### 4. Access the Applications

| Service | URL | Credentials |
|---------|-----|-------------|
| Frontend | http://localhost:5173 | Sign up for account |
| Backend API | http://localhost:3001 | N/A |
| N8N | http://localhost:5678 | admin / your_n8n_password |

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     Slack       │────▶│      N8N        │────▶│   PostgreSQL    │
│  (Capture)      │     │  (Workflow)     │     │   + pgvector    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
                        ┌─────────────────┐     ┌─────────────────┐
                        │     React       │◀────│  Node.js API    │
                        │    Frontend     │     │  (RAG, Search)  │
                        └─────────────────┘     └─────────────────┘
```

### Components

- **PostgreSQL + pgvector**: Stores memories and their vector embeddings for semantic search
- **N8N**: Workflow automation for processing incoming messages
- **Node.js API**: REST API for frontend, RAG chat, and vector search
- **React Frontend**: Modern SPA for viewing, searching, and chatting with your brain

## Slack Integration

### 1. Create Slack App

1. Go to [Slack API](https://api.slack.com/apps)
2. Create new app → From scratch
3. Add Bot Token Scopes: `chat:write`, `channels:history`
4. Install app to workspace
5. Copy Bot User OAuth Token

### 2. Configure N8N

1. Open N8N at http://localhost:5678
2. Import the workflow from `n8n/workflow.json`
3. Set environment variable `OPENAI_API_KEY` in N8N settings
4. Create an Incoming Webhook URL
5. Configure Slack to send message events to the webhook

### 3. Capture Thoughts

Send messages to a private channel or directly to your bot:

```
@secondbrain Schedule a meeting with marketing team about Q4 campaign
```

The system will automatically:
1. Capture the message
2. Classify it (e.g., as a "Task")
3. Extract relevant tags (e.g., ["marketing", "meeting", "Q4"])
4. Generate vector embedding
5. Store in database

## API Documentation

### Authentication

All protected endpoints require a Bearer token:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3001/api/memories
```

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login and get token |
| GET | `/api/memories` | List all memories |
| POST | `/api/memories` | Create new memory |
| GET | `/api/memories/:id` | Get memory by ID |
| POST | `/api/search/semantic` | Semantic search |
| POST | `/api/chat/quick` | Quick RAG question |
| POST | `/api/chat/sessions` | Create chat session |
| GET | `/api/categories` | List categories |

### Example: Create Memory

```bash
curl -X POST http://localhost:3001/api/memories \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "Research quantum computing applications in finance"}'
```

### Example: Semantic Search

```bash
curl -X POST http://localhost:3001/api/search/semantic \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"query": "What are the applications of AI in business?", "limit": 10}'
```

## LLM Settings & Local AI

**🆕 New Feature**: Configure AI providers and run models locally!

### Overview

Second Brain now supports multiple AI providers and local model execution:
- **OpenAI** - GPT-4, GPT-4o Mini, GPT-3.5 Turbo
- **Anthropic** - Claude Sonnet 4, Claude 3.5, Claude 3 Opus
- **Ollama** - Run LLMs locally (llama3.2, mistral, mixtral, etc.)

### Quick Start with Ollama

1. **Run the database migration**:
```bash
docker-compose exec backend npm run db:migrate
```

2. **Start Ollama service**:
```bash
docker-compose up -d ollama
```

3. **Pull a model**:
```bash
docker exec -it second-brain-ollama ollama pull llama3.2
```

4. **Configure in UI**:
   - Navigate to Settings → LLM Settings
   - Select provider and model for each feature area
   - Adjust temperature and token limits
   - Save settings

### Configuration Areas

You can configure different AI providers for each app feature:

| Feature | Purpose | Recommended Temperature |
|---------|---------|------------------------|
| **AI Chat** | Conversational interactions | 0.7 (balanced) |
| **Search** | Finding relevant memories | 0.3 (focused) |
| **Classification** | Auto-categorization | 0.3 (consistent) |
| **Embeddings** | Vector generation | N/A |

### Why Use Ollama?

✅ **100% Privacy** - No data sent to external APIs  
✅ **Zero API Costs** - Run unlimited queries for free  
✅ **Offline Capable** - Works without internet  
✅ **Full Control** - Choose and customize any model  

📖 **Full Documentation**: [`docs/LLM-SETTINGS-QUICKSTART.md`](./docs/LLM-SETTINGS-QUICKSTART.md)

## Development

### Frontend Development

```bash
cd frontend
npm install
npm run dev
```

### Backend Development

```bash
cd backend
npm install
npm run dev
```

### Database Migrations

```bash
cd backend
npm run db:status   # Check migration status
npm run db:migrate  # Apply pending migrations
npm run db:setup    # First-time database setup
```

## Database Management

### First-Time Setup

The database is automatically initialized when you first start the containers. The initialization script creates all required tables, indexes, and the schema migrations table.

For manual control or if you need to reinitialize:

```bash
# Run setup inside the backend container
docker-compose exec backend npm run db:setup

# Or use the setup script directly
docker-compose exec backend ./scripts/setup.sh setup
```

### Migration System

Second Brain uses a versioned migration system to manage database schema changes.

#### Available Commands

| Command | Description |
|---------|-------------|
| `npm run db:status` | Show current migration status |
| `npm run db:migrate` | Apply all pending migrations |
| `npm run db:migrate:dry` | Preview migrations without applying |
| `npm run db:migrate:undo` | Rollback the last migration |
| `npm run db:setup` | First-time database initialization |

#### Using the Shell Script

```bash
# Check status
./backend/scripts/setup.sh status

# Run migrations
./backend/scripts/setup.sh migrate

# Dry run (preview)
./backend/scripts/setup.sh migrate --dry-run

# Skip confirmations
./backend/scripts/setup.sh migrate --skip-confirm
```

#### Docker Compose Shortcuts

```bash
# Check migration status
docker-compose exec backend npm run db:status

# Run migrations
docker-compose exec backend npm run db:migrate

# First-time setup
docker-compose exec backend npm run db:setup
```

### Migration Files

Migrations are located in `backend/src/db/migrations/` and follow the naming convention `###_migration_name.js`.

To create a new migration:

```bash
# Create a new migration file
# Format: ###_description.js (e.g., 002_add_user_avatar.js)

# Then apply it
npm run db:migrate
```

### Manual Database Access

```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U secondbrain -d second_brain

# Common queries
# List tables: \dt
# Describe table: \d table_name
# Check migrations: SELECT * FROM schema_migrations;
```

### Resetting the Database

To completely reset the database (WARNING: destroys all data):

```bash
# Stop services
docker-compose down

# Remove volume
docker volume rm second-brain_postgres_data

# Start fresh
docker-compose up -d
```

## Environment Variables Reference

## Environment Variables Reference

| Variable | Description | Default |
|----------|-------------|---------|
| `POSTGRES_USER` | Database username | secondbrain |
| `POSTGRES_PASSWORD` | Database password | (required) |
| `POSTGRES_DB` | Database name | second_brain |
| `OPENAI_API_KEY` | OpenAI API key | (required) |
| `ANTHROPIC_API_KEY` | Anthropic API key | optional |
| `AI_PROVIDER` | `openai` or `anthropic` | openai |
| `JWT_SECRET` | JWT signing secret | (required) |
| `N8N_WEBHOOK_URL` | N8N webhook endpoint | localhost:5678 |

## Troubleshooting

### Database Connection Failed

```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# View PostgreSQL logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres
```

### N8N Not Starting

```bash
# Check N8N logs
docker-compose logs n8n

# Ensure database is healthy first
docker-compose wait postgres
```

### API Returns 401

- Verify JWT token is valid
- Check token expiration
- Ensure user exists in database

### Vector Search Returns No Results

- Verify pgvector extension is installed
- Check embeddings were generated
- Lower the similarity threshold

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details.
