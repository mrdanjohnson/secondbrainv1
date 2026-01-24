# LLM Settings & Ollama Integration - Quick Start Guide

## 🚀 What's New

You can now:
- **Choose your AI provider** for each feature (OpenAI, Claude, or local Ollama)
- **Run LLMs locally** with Ollama (privacy + no API costs)
- **Fine-tune AI behavior** with temperature and token settings
- **Adjust context relevancy** for better chat and search results

---

## ⚡ Quick Setup (5 minutes)

### Step 1: Run Database Migration

```bash
docker-compose exec backend npm run db:migrate
```

This creates the `user_llm_settings` table.

### Step 2: Start Ollama (Optional)

```bash
docker-compose up -d ollama
```

Wait 30 seconds for Ollama to start, then verify:
```bash
docker-compose ps ollama
docker-compose logs ollama
```

### Step 3: Access LLM Settings

1. Open Second Brain: http://localhost:5173
2. Login to your account
3. Navigate to **Settings** → **LLM Settings** tab

---

## 🎯 Common Use Cases

### Use Case 1: Try Local LLMs (Free & Private)

**Goal**: Run AI entirely on your machine

**Steps**:
1. Go to Settings → LLM Settings
2. Scroll to "Ollama Models" section
3. Click **"Pull"** next to `llama3.2` (2GB model)
4. Wait 2-5 minutes for download
5. Expand "AI Chat" settings
6. Select Provider: **"Ollama (Local)"**
7. Select Model: **"llama3.2"**
8. Click **"Save All Settings"**

**Result**: All chat queries now use your local model!

---

### Use Case 2: Optimize Costs

**Goal**: Use cheaper models where quality matters less

**Recommendation**:
- **AI Chat**: GPT-4o (high quality conversations)
- **Search**: GPT-4o Mini (fast, cheap)
- **Classification**: GPT-3.5 Turbo (good enough for tagging)
- **Embeddings**: text-embedding-3-small (standard)

**Steps**:
1. Go to Settings → LLM Settings
2. Expand each section
3. Select recommended models above
4. Adjust temperature (use tooltips for guidance)
5. Save settings

---

### Use Case 3: Maximum Privacy

**Goal**: No data leaves your server

**Setup** (requires ~8GB disk + 8GB RAM):
```bash
# Pull all needed models
docker exec -it second-brain-ollama ollama pull llama3.2
docker exec -it second-brain-ollama ollama pull llama3.2:3b
docker exec -it second-brain-ollama ollama pull nomic-embed-text
```

**Settings**:
- Chat: Ollama - llama3.2
- Search: Ollama - llama3.2
- Classification: Ollama - llama3.2:3b
- Embedding: Ollama - nomic-embed-text

---

## 🎚️ Settings Explained

### Temperature (0.0 - 2.0)

| Value | Behavior | Best For |
|-------|----------|----------|
| 0.0 - 0.3 | Focused, deterministic | Classification, factual Q&A |
| 0.4 - 0.7 | Balanced | General chat, search |
| 0.8 - 2.0 | Creative, varied | Brainstorming, creative writing |

**Recommended per area**:
- Chat: **0.7** (conversational)
- Search: **0.3** (precise)
- Classification: **0.3** (consistent)

---

### Max Tokens (128 - 4096)

Controls maximum response length.

| Value | ~Words | Use Case |
|-------|--------|----------|
| 128 | ~100 | Short answers |
| 512 | ~400 | Classification results |
| 1024 | ~800 | Search summaries |
| 2048 | ~1600 | Chat conversations |
| 4096 | ~3200 | Long-form content |

**Recommended per area**:
- Chat: **2048**
- Search: **1024**
- Classification: **512**

---

### Relevancy Score (0.0 - 1.0)

Minimum similarity threshold for including memories as context.

| Value | Effect | Use Case |
|-------|--------|----------|
| 0.0 - 0.3 | More context (lower quality) | Chat (cast wide net) |
| 0.4 - 0.6 | Balanced | General use |
| 0.7 - 1.0 | Only highly relevant | Precise search |

**Recommended per area**:
- Chat: **0.3** (more context)
- Search: **0.5** (balanced quality)

---

## 🐳 Ollama Model Recommendations

### For Low-Resource Systems (4-8GB RAM)

**Best Model**: `llama3.2:3b` (2GB)
- Fast responses
- Good for simple tasks
- Low memory footprint

```bash
docker exec -it second-brain-ollama ollama pull llama3.2:3b
```

**Ultra-Lightweight Alternatives**:

`smollm2:1.7b` (~1GB)
- Smallest footprint
- Very fast inference
- Best for resource-constrained environments

```bash
docker exec -it second-brain-ollama ollama pull smollm2:1.7b
```

`deepseek-r1:1.5b` (~900MB)
- Optimized for reasoning tasks
- Efficient for classification
- Great for edge devices

```bash
docker exec -it second-brain-ollama ollama pull deepseek-r1:1.5b
```

`qwen2.5:0.5b` (~500MB)
- Smallest available model
- Lightning-fast responses
- Ideal for testing/development

```bash
docker exec -it second-brain-ollama ollama pull qwen2.5:0.5b
```

---

### For Standard Systems (8-16GB RAM)

**Best Model**: `llama3.2` (2GB) or `llama3.1:8b` (4.7GB)
- Balanced performance
- Good reasoning
- Production-ready

```bash
docker exec -it second-brain-ollama ollama pull llama3.2
```

---

### For High-Performance Systems (16GB+ RAM + GPU)

**Best Model**: `mixtral:8x7b` (26GB)
- Highest quality
- Requires NVIDIA GPU
- Uncomment GPU config in docker-compose.yml

```yaml
# In docker-compose.yml, under ollama service:
deploy:
  resources:
    reservations:
      devices:
        - driver: nvidia
          count: 1
          capabilities: [gpu]
```

```bash
docker-compose up -d ollama
docker exec -it second-brain-ollama ollama pull mixtral:8x7b
```

---

## ⚙️ Advanced Configuration

### Check Current Settings via API

```bash
# Get your auth token from browser localStorage
TOKEN="your-jwt-token"

# View current settings
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/llm-settings
```

### Bulk Update via API

```bash
curl -X PUT \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "chat": {
      "provider": "ollama",
      "model": "llama3.2",
      "temperature": 0.7,
      "maxTokens": 2048
    },
    "embedding": {
      "provider": "ollama",
      "model": "nomic-embed-text"
    }
  }' \
  http://localhost:3001/api/llm-settings
```

---

## 🐛 Troubleshooting

### Ollama shows "Service not available"

```bash
# Check if running
docker-compose ps ollama

# View logs
docker-compose logs -f ollama

# Restart if needed
docker-compose restart ollama
```

---

### Model pull seems stuck

```bash
# Pull via CLI for better visibility
docker exec -it second-brain-ollama ollama pull llama3.2

# Check disk space
docker exec -it second-brain-ollama df -h
```

---

### Chat responses are very slow

**Solutions**:
1. Use a smaller model (llama3.2:3b instead of llama3.2)
2. Reduce `max_tokens` to 1024 or less
3. Enable GPU support (if you have NVIDIA GPU)
4. Use OpenAI/Anthropic for chat, Ollama for embeddings only

---

### Settings not saving

**Check migration status**:
```bash
docker-compose exec backend npm run db:status

# Should show: 002_add_llm_settings_table - Applied
```

**If migration not applied**:
```bash
docker-compose exec backend npm run db:migrate
```

---

## 📊 Performance Comparison

| Scenario | OpenAI GPT-4o | Ollama llama3.2 (CPU) | Ollama llama3.2 (GPU) |
|----------|---------------|------------------------|------------------------|
| Response Time | 3-8 sec | 10-30 sec | 2-5 sec |
| Cost per 1M tokens | $2.50 | $0.00 | $0.00 |
| Privacy | Data sent externally | 100% local | 100% local |
| Quality | Excellent | Good | Good |
| Requires Internet | Yes | No | No |

---

## 🎓 Best Practices

1. **Start with defaults** - The pre-configured settings are optimized for most use cases

2. **Experiment gradually** - Change one setting at a time to understand impact

3. **Use tooltips** - Hover over info icons for recommended values

4. **Monitor performance**:
   - If responses are slow → Lower max_tokens or use smaller model
   - If quality is poor → Increase temperature slightly or upgrade model
   - If irrelevant results → Adjust relevancy score

5. **Hybrid approach** - Use OpenAI for chat (quality), Ollama for embeddings (cost)

6. **Model selection**:
   - **Development/Testing**: Ollama + small models
   - **Production**: OpenAI GPT-4o (proven quality)
   - **Privacy-critical**: Ollama + llama3.1:8b

---

## 📚 Next Steps

- Read full documentation: [`docs/LLM-SETTINGS-FEATURE.md`](./LLM-SETTINGS-FEATURE.md)
- Explore [Ollama model library](https://ollama.ai/library)
- Check [OpenAI pricing](https://openai.com/pricing)
- Review [Anthropic models](https://www.anthropic.com/claude)

---

**Questions?** Check the full documentation or open an issue on GitHub.

**Happy configuring! 🎉**
