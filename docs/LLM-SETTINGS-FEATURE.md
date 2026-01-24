# LLM Settings & Ollama Integration - Feature Documentation

**Date**: January 23, 2026  
**Version**: 1.0  
**Status**: Implementation Complete

---

## 1. Overview

This feature adds comprehensive LLM (Large Language Model) configuration and local model support to Second Brain, allowing users to:

- **Choose AI providers** per app feature (OpenAI, Anthropic Claude, Ollama local models)
- **Select specific models** for each provider
- **Fine-tune parameters** (temperature, max tokens) per use case
- **Adjust relevancy scores** for context retrieval
- **Run local LLMs** via Ollama for privacy and cost savings
- **Manage Ollama models** directly from the UI

---

## 2. Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                       Frontend UI                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Settings Page → LLM Settings Tab                    │  │
│  │  - Provider selection dropdowns                      │  │
│  │  - Model selection (filtered by provider)            │  │
│  │  - Temperature sliders (0-2)                         │  │
│  │  - Max tokens sliders (128-4096)                     │  │
│  │  - Relevancy score sliders (0-1)                     │  │
│  │  - Ollama model management                           │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend API Layer                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  /api/llm-settings/*                                 │  │
│  │  - GET / (get user settings)                         │  │
│  │  - PUT / (update settings)                           │  │
│  │  - GET /models (list available models)               │  │
│  │  - GET /ollama/status (Ollama health & models)       │  │
│  │  - POST /ollama/pull (download model)                │  │
│  │  - DELETE /ollama/models/:name (remove model)        │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Service Layer                             │
│  ┌─────────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  aiService.js   │  │ ollama       │  │ vector       │  │
│  │  - Routing to   │  │ Service.js   │  │ Service.js   │  │
│  │    providers    │  │ - List models│  │ - Settings   │  │
│  │  - User prefs   │  │ - Pull/delete│  │   aware      │  │
│  │  - Defaults     │  │ - Chat/embed │  │              │  │
│  └─────────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
          ┌─────────────────┼─────────────────┐
          ▼                 ▼                 ▼
    ┌──────────┐      ┌──────────┐     ┌──────────┐
    │ OpenAI   │      │ Anthropic│     │  Ollama  │
    │ API      │      │ API      │     │ (Docker) │
    └──────────┘      └──────────┘     └──────────┘
```

### Database Schema

**Table: `user_llm_settings`**

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Foreign key to users |
| **Chat Settings** | | |
| `chat_provider` | VARCHAR(20) | openai, anthropic, ollama |
| `chat_model` | VARCHAR(100) | Model identifier |
| `chat_temperature` | NUMERIC(3,2) | 0.0 - 2.0 |
| `chat_max_tokens` | INTEGER | Max response length |
| `chat_relevancy_score` | NUMERIC(3,2) | 0.0 - 1.0 |
| **Search Settings** | | |
| `search_provider` | VARCHAR(20) | Provider for search |
| `search_model` | VARCHAR(100) | Model for search |
| `search_temperature` | NUMERIC(3,2) | Temperature for search |
| `search_max_tokens` | INTEGER | Max tokens for search |
| `search_relevancy_score` | NUMERIC(3,2) | Similarity threshold |
| **Classification Settings** | | |
| `classification_provider` | VARCHAR(20) | Auto-categorization provider |
| `classification_model` | VARCHAR(100) | Classification model |
| `classification_temperature` | NUMERIC(3,2) | Temperature |
| `classification_max_tokens` | INTEGER | Max tokens |
| **Embedding Settings** | | |
| `embedding_provider` | VARCHAR(20) | openai or ollama |
| `embedding_model` | VARCHAR(100) | Embedding model |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

**Migration**: `002_add_llm_settings_table.js`

---

## 3. App Areas & Default Settings

The system separates LLM configuration into 4 distinct areas, each with different recommended parameters:

### 3.1 AI Chat
**Purpose**: Conversational interaction with memories

**Default Settings**:
- Provider: OpenAI
- Model: `gpt-4o`
- Temperature: `0.7` (balanced creativity)
- Max Tokens: `2048`
- Relevancy Score: `0.3` (cast wider net for context)

**Recommended Temperature**: 0.7 - Balanced creativity for natural conversation

---

### 3.2 Semantic Search
**Purpose**: Finding relevant memories via vector similarity

**Default Settings**:
- Provider: OpenAI
- Model: `gpt-4o`
- Temperature: `0.3` (focused results)
- Max Tokens: `1024`
- Relevancy Score: `0.5` (higher quality threshold)

**Recommended Temperature**: 0.3 - Lower for more focused, deterministic results

---

### 3.3 Auto-Classification
**Purpose**: Categorizing and tagging memories automatically

**Default Settings**:
- Provider: OpenAI
- Model: `gpt-4o`
- Temperature: `0.3` (consistent categorization)
- Max Tokens: `512`

**Recommended Temperature**: 0.3 - Deterministic for consistent classification

---

### 3.4 Vector Embeddings
**Purpose**: Generating numerical representations for similarity search

**Default Settings**:
- Provider: OpenAI
- Model: `text-embedding-3-small` (1536 dimensions)

**Note**: Embeddings don't use temperature/tokens (not generative)

---

## 4. Ollama Integration

### 4.1 Docker Service

**Configuration** (`docker-compose.yml`):

```yaml
ollama:
  image: ollama/ollama:latest
  container_name: second-brain-ollama
  volumes:
    - ollama_data:/root/.ollama
  ports:
    - "11434:11434"
  networks:
    - second-brain-net
  environment:
    - OLLAMA_HOST=0.0.0.0
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:11434/api/tags"]
    interval: 30s
    timeout: 10s
    retries: 3
    start_period: 60s
```

**Features**:
- Persistent volume for downloaded models
- Health checks to verify service availability
- Accessible to backend via internal network
- Optional GPU support (commented out by default)

### 4.2 Recommended Ollama Models

#### Chat Models
| Model | Size | Description | Best For |
|-------|------|-------------|----------|
| `llama3.2` | 2GB | Fast, efficient | General chat, quick responses |
| `llama3.2:3b` | 2GB | Lightweight | Simple tasks, low-resource systems |
| `llama3.1:8b` | 4.7GB | Balanced | Production use, good quality |
| `mistral` | 4.1GB | Good reasoning | Complex questions |
| `mixtral:8x7b` | 26GB | High performance | Maximum quality (requires GPU) |

#### Embedding Models
| Model | Size | Description |
|-------|------|-------------|
| `nomic-embed-text` | 274MB | High quality embeddings |
| `mxbai-embed-large` | 669MB | Large, accurate embeddings |

### 4.3 Model Management

**Pull (Download) a Model**:
```bash
# Via API
POST /api/llm-settings/ollama/pull
{
  "modelName": "llama3.2"
}

# Via Docker
docker exec -it second-brain-ollama ollama pull llama3.2
```

**List Available Models**:
```bash
GET /api/llm-settings/ollama/status

# Response includes:
# - available: true/false
# - models: [{ name, size, modified, digest }]
# - recommended: { chat: [...], embeddings: [...] }
```

**Delete a Model**:
```bash
DELETE /api/llm-settings/ollama/models/llama3.2
```

---

## 5. API Reference

### 5.1 Get LLM Settings

**Endpoint**: `GET /api/llm-settings`

**Authentication**: Required (JWT)

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "chat": {
      "provider": "openai",
      "model": "gpt-4o",
      "temperature": 0.7,
      "maxTokens": 2048,
      "relevancyScore": 0.3
    },
    "search": {
      "provider": "openai",
      "model": "gpt-4o",
      "temperature": 0.3,
      "maxTokens": 1024,
      "relevancyScore": 0.5
    },
    "classification": {
      "provider": "openai",
      "model": "gpt-4o",
      "temperature": 0.3,
      "maxTokens": 512
    },
    "embedding": {
      "provider": "openai",
      "model": "text-embedding-3-small"
    }
  }
}
```

---

### 5.2 Update LLM Settings

**Endpoint**: `PUT /api/llm-settings`

**Authentication**: Required

**Request Body**:
```json
{
  "chat": {
    "provider": "ollama",
    "model": "llama3.2",
    "temperature": 0.8,
    "maxTokens": 2048,
    "relevancyScore": 0.3
  }
}
```

**Notes**:
- Partial updates supported (only send fields you want to change)
- Settings validated server-side
- Invalid values rejected with 400 error

---

### 5.3 Get Available Models

**Endpoint**: `GET /api/llm-settings/models`

**Authentication**: Required

**Response**:
```json
{
  "success": true,
  "data": {
    "openai": {
      "chat": [
        { "id": "gpt-4o", "name": "GPT-4o", "description": "Most capable" },
        { "id": "gpt-4o-mini", "name": "GPT-4o Mini", "description": "Fast and affordable" }
      ],
      "embeddings": [
        { "id": "text-embedding-3-small", "name": "Embedding 3 Small", "description": "1536 dim" }
      ]
    },
    "anthropic": {
      "chat": [
        { "id": "claude-sonnet-4-20250514", "name": "Claude Sonnet 4", "description": "Most intelligent" }
      ]
    },
    "ollama": {
      "chat": [
        { "id": "llama3.2", "name": "llama3.2", "description": "Size: 2 GB", "size": 2147483648 }
      ],
      "embeddings": [
        { "id": "nomic-embed-text", "name": "nomic-embed-text", "description": "Size: 274 MB" }
      ],
      "recommended": { ... }
    }
  }
}
```

---

### 5.4 Get Ollama Status

**Endpoint**: `GET /api/llm-settings/ollama/status`

**Response when available**:
```json
{
  "success": true,
  "data": {
    "available": true,
    "models": [
      {
        "name": "llama3.2",
        "size": "2 GB",
        "sizeBytes": 2147483648,
        "modified": "2026-01-23T10:30:00Z",
        "digest": "sha256:..."
      }
    ],
    "recommended": {
      "chat": [...],
      "embeddings": [...]
    }
  }
}
```

**Response when unavailable**:
```json
{
  "success": true,
  "data": {
    "available": false,
    "models": [],
    "recommended": { ... }
  }
}
```

---

## 6. Frontend Implementation

### 6.1 LLM Settings Component

**Location**: `frontend/src/components/LLMSettings.jsx`

**Features**:
- Collapsible sections for each app area
- Provider dropdown (OpenAI, Anthropic, Ollama)
- Model dropdown (filtered by selected provider)
- Temperature slider with visual labels (Focused/Balanced/Creative)
- Max tokens slider (128-4096)
- Relevancy score slider (context retrieval threshold)
- Ollama model browser and installer
- Real-time status updates (30s polling)
- Recommended temperature tooltips per area

**State Management**:
- React Query for data fetching
- Local state for form inputs
- Automatic cache invalidation on save
- Optimistic UI updates

---

### 6.2 Settings Page Integration

**Location**: `frontend/src/pages/Settings.jsx`

**Changes**:
1. Added `Cpu` icon import from lucide-react
2. Added LLM Settings tab to tabs array
3. Rendered `<LLMSettings />` component when tab active

**Tab Order**:
1. Profile
2. Security
3. **LLM Settings** ← NEW
4. Notifications
5. Appearance
6. Data

---

## 7. Backend Service Updates

### 7.1 AI Service Enhancements

**File**: `backend/src/services/aiService.js`

**Key Changes**:
1. Added `userId` parameter to all AI functions
2. `getUserSettings(userId, area)` - Fetches user preferences from DB
3. `getDefaultSettings(area)` - Fallback when no settings exist
4. Provider routing based on user settings (not env vars)
5. Settings passed to provider-specific functions

**Updated Function Signatures**:
```javascript
// Before
generateEmbedding(text)
classifyAndStructure(content)
generateChatResponse(messages, context)

// After
generateEmbedding(text, userId = null)
classifyAndStructure(content, userId = null)
generateChatResponse(messages, context = [], userId = null)
```

**Backward Compatibility**: Functions work without userId (use defaults)

---

### 7.2 Ollama Service

**File**: `backend/src/services/ollamaService.js`

**Functions**:
- `listOllamaModels()` - Get all downloaded models
- `checkOllamaHealth()` - Verify service is running
- `chatWithOllama(messages, context, options)` - Generate chat response
- `generateOllamaEmbedding(text, model)` - Create embeddings
- `pullOllamaModel(modelName)` - Download a model
- `deleteOllamaModel(modelName)` - Remove a model
- `getRecommendedOllamaModels()` - Get curated model list

**Error Handling**:
- Graceful degradation if Ollama unavailable
- Connection timeout (3-5s for health checks)
- Extended timeout for model operations (2-5 minutes)

---

## 8. Usage Examples

### 8.1 Setting Up Ollama for Chat

**Step 1**: Start Ollama service
```bash
docker-compose up -d ollama
```

**Step 2**: Pull a model (via UI or CLI)
```bash
# Via Settings page: Click "Pull" next to recommended model
# Or via CLI:
docker exec -it second-brain-ollama ollama pull llama3.2
```

**Step 3**: Configure in Settings
1. Navigate to Settings → LLM Settings
2. Expand "AI Chat" section
3. Select Provider: "Ollama (Local)"
4. Select Model: "llama3.2"
5. Adjust temperature (recommend: 0.7)
6. Click "Save All Settings"

**Step 4**: Test in Chat
- Open Chat page
- Ask a question
- Response now generated by local Ollama model

---

### 8.2 Using Different Models Per Area

**Scenario**: Cost optimization - use GPT-4 for chat, GPT-3.5 for classification

**Configuration**:
1. Chat:
   - Provider: OpenAI
   - Model: gpt-4o
   - Temperature: 0.7

2. Classification:
   - Provider: OpenAI
   - Model: gpt-3.5-turbo
   - Temperature: 0.3

**Result**: High-quality chat responses, economical auto-categorization

---

### 8.3 Privacy-Focused Setup (All Local)

**Configuration**:
```
Chat:           Ollama - llama3.1:8b
Search:         Ollama - llama3.2
Classification: Ollama - llama3.2:3b
Embedding:      Ollama - nomic-embed-text
```

**Benefits**:
- No data sent to external APIs
- No API costs
- Works offline
- Full control over models

**Requirements**:
- ~8GB disk space for models
- 8GB+ RAM recommended
- GPU optional but recommended for larger models

---

## 9. Performance Considerations

### 9.1 Response Times

| Provider | Model | Avg Response Time |
|----------|-------|-------------------|
| OpenAI | gpt-4o | 3-8 seconds |
| Anthropic | claude-sonnet-4 | 2-6 seconds |
| Ollama (CPU) | llama3.2 | 10-30 seconds |
| Ollama (GPU) | llama3.2 | 2-5 seconds |

### 9.2 Cost Comparison

| Provider | Model | Cost per 1M tokens (input) |
|----------|-------|----------------------------|
| OpenAI | gpt-4o | $2.50 |
| OpenAI | gpt-4o-mini | $0.15 |
| Anthropic | claude-sonnet-4 | $3.00 |
| Ollama | Any model | $0.00 (local compute) |

### 9.3 Embedding Dimensions

- **OpenAI text-embedding-3-small**: 1536 dimensions
- **OpenAI text-embedding-3-large**: 3072 dimensions
- **Ollama nomic-embed-text**: 768 dimensions*

*Note: Changing embedding providers requires re-embedding all memories*

---

## 10. Migration & Setup

### 10.1 Database Migration

**Run Migration**:
```bash
docker-compose exec backend npm run db:migrate
```

**Migration File**: `backend/src/db/migrations/002_add_llm_settings_table.js`

**What It Does**:
1. Creates `user_llm_settings` table
2. Adds indexes for performance
3. Creates trigger for `updated_at` auto-update
4. Seeds default settings for existing users

### 10.2 Environment Variables

**Required** (existing):
```env
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

**Optional** (new):
```env
OLLAMA_API_URL=http://ollama:11434  # Default in Docker
```

---

## 11. Troubleshooting

### Issue: Ollama shows "Service not available"

**Cause**: Ollama container not running

**Solution**:
```bash
docker-compose ps ollama
docker-compose up -d ollama
docker-compose logs -f ollama
```

---

### Issue: Model pull fails/times out

**Cause**: Slow internet or large model

**Solution**:
- Pull via command line for better visibility:
  ```bash
  docker exec -it second-brain-ollama ollama pull llama3.2
  ```
- Check disk space: `docker exec ollama df -h`
- Models stored in `/root/.ollama` (volume mounted)

---

### Issue: Chat responses very slow with Ollama

**Cause**: Running on CPU without GPU acceleration

**Solutions**:
1. Use smaller models (llama3.2:3b instead of mixtral:8x7b)
2. Enable GPU support in docker-compose.yml
3. Reduce `max_tokens` setting
4. Consider cloud providers for chat, Ollama for embeddings

---

### Issue: Settings not persisting

**Cause**: Database migration not run

**Solution**:
```bash
docker-compose exec backend npm run db:status
docker-compose exec backend npm run db:migrate
```

---

## 12. Future Enhancements

### Planned Features

1. **Model Performance Analytics**
   - Track response times per model
   - Monitor token usage per provider
   - Cost analytics dashboard

2. **A/B Testing**
   - Compare model outputs side-by-side
   - User feedback on response quality
   - Auto-optimize settings based on satisfaction

3. **Custom Ollama Modelfiles**
   - Create fine-tuned models
   - System prompt templates
   - Model versioning

4. **Streaming Responses**
   - Real-time token streaming (all providers)
   - Progress indicators for Ollama downloads
   - Partial result rendering

5. **Model Warm-up**
   - Pre-load frequently used Ollama models
   - Connection pooling for API providers
   - Cache warming strategies

6. **Multi-Model Ensemble**
   - Route queries to best model based on complexity
   - Combine embeddings from multiple sources
   - Consensus-based classification

---

## 13. Security Considerations

### API Key Storage
- Keys stored in environment variables only
- Never exposed in API responses
- Separate keys per user not supported (shared account keys)

### Ollama Security
- Runs in isolated Docker network
- No external port exposure required (backend-only access)
- Models stored in dedicated volume (not host filesystem)

### User Settings Privacy
- Settings isolated per user (enforced by SQL WHERE clause)
- No cross-user setting visibility
- Settings encrypted at rest (PostgreSQL TDE optional)

---

## 14. Testing

### Manual Testing Checklist

- [ ] Create new user → Default settings applied automatically
- [ ] Update chat provider → Next chat uses new provider
- [ ] Pull Ollama model → Appears in model list
- [ ] Delete Ollama model → Removed from list
- [ ] Change temperature → Response style changes
- [ ] Set very low max tokens → Response truncated
- [ ] Adjust relevancy score → Context count changes
- [ ] Save settings → Persists across page refreshes
- [ ] Different users → Isolated settings

### API Testing

```bash
# Get settings
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/llm-settings

# Update settings
curl -X PUT -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"chat": {"provider": "ollama", "model": "llama3.2"}}' \
  http://localhost:3001/api/llm-settings

# Pull Ollama model
curl -X POST -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"modelName": "llama3.2"}' \
  http://localhost:3001/api/llm-settings/ollama/pull
```

---

## 15. Resources

- [Ollama Official Documentation](https://ollama.ai/docs)
- [OpenAI Models Documentation](https://platform.openai.com/docs/models)
- [Anthropic Claude Models](https://docs.anthropic.com/claude/docs/models-overview)
- [pgvector for Embeddings](https://github.com/pgvector/pgvector)

---

**Document Version**: 1.0  
**Last Updated**: January 23, 2026  
**Author**: Development Team  
**Status**: ✅ Implementation Complete
