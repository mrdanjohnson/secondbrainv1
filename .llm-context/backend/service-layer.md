# Backend Service Layer - Second Brain

## Overview

The service layer contains business logic for AI operations, vector search, and external integrations. Services are stateless and can be called from any controller.

---

## Service Architecture

```
Controllers → Services → External APIs / Database
    │            │
    │            ├── aiService (OpenAI, Anthropic, Ollama)
    │            ├── vectorService (pgvector operations)
    │            ├── queryAnalyzer (extract filters from natural language)
    │            ├── smartSearch (multi-stage priority filtering)
    │            └── ollamaService (Local LLM management)
    │
    └── Direct DB calls for simple CRUD
```

---

## AI Service

**File**: `backend/src/services/aiService.js`

### Purpose
- AI classification and structuring
- Embedding generation
- Chat response generation
- Multi-provider support (OpenAI, Anthropic, Ollama)

### Key Functions

#### `getUserSettings(userId, area)`
**Returns**: User's LLM settings for specific area (chat, search, classification, embedding)

```javascript
const settings = await getUserSettings(userId, 'chat');
// Returns: { provider: 'openai', model: 'gpt-4o', temperature: 0.7, ... }
```

---

#### `generateEmbedding(text, userId?)`
**Purpose**: Convert text to vector embedding (1536 dimensions)

**Providers**: OpenAI (default), Ollama

```javascript
const embedding = await generateEmbedding("My thought about AI");
// Returns: [0.123, -0.456, 0.789, ... ] (1536 floats)
```

**Performance**: ~100-200ms per call (OpenAI)

**Rate Limits**: 
- OpenAI: 3,000 RPM (requests per minute)
- Ollama: No limits (local)

---

#### `classifyAndStructure(content, userId?)`
**Purpose**: AI-powered categorization and metadata extraction

**Input**: Raw text  
**Output**: Structured JSONB object

```javascript
const structured = await classifyAndStructure("Let's build an AI assistant");

// Returns:
{
  summary: "AI assistant development idea",
  category: "Idea",
  tags: ["ai", "development", "assistant"],
  sentiment: "positive",
  priority: "medium",
  entities: []
}
```

**Providers**: OpenAI (default), Anthropic, Ollama

**Fallback**: If classification fails, returns minimal structure:
```javascript
{
  summary: content.slice(0, 100),
  category: "Unsorted",
  tags: [],
  sentiment: "neutral"
}
```

---

#### `generateChatResponse(messages, context, userId?)`
**Purpose**: RAG-powered chat responses

**Parameters**:
- `messages`: Array of chat history
- `context`: Array of relevant memories (from vector search)
- `userId`: For user-specific LLM settings

```javascript
const response = await generateChatResponse(
  [{ role: 'user', content: 'What are my AI ideas?' }],
  [
    { raw_content: "AI assistant idea", similarity: 0.92 },
    { raw_content: "ML model concept", similarity: 0.87 }
  ],
  userId
);

// Returns:
{
  content: "Based on your memories, you have several AI-related ideas...",
  usage: {
    prompt_tokens: 456,
    completion_tokens: 123,
    total_tokens: 579
  },
  promptInfo: {
    provider: 'openai',
    model: 'gpt-4o',
    contextCount: 2
  }
}
```

**Context Handling**:
- Top 5 most similar memories included in prompt
- Similarity scores displayed to model
- Model instructed to acknowledge low confidence if scores < 40%

---

### Provider-Specific Functions

#### OpenAI Functions
- `classifyWithOpenAI(content, settings)`
- `chatWithOpenAI(messages, context, settings)`

**Features**:
- JSON mode for structured output
- GPT-4o, GPT-4, GPT-4o Mini support
- Temperature control (0.0-2.0)
- Max tokens configuration

---

#### Anthropic Functions
- `classifyWithAnthropic(content, settings)`
- `chatWithAnthropic(messages, context, settings)`

**Features**:
- Claude Sonnet 4, Claude Opus support
- Long context windows (200k tokens)
- JSON extraction from text response

---

#### Ollama Functions
- `classifyWithOllama(content, settings)`
- `chatWithOllama(messages, context, settings)`

**Features**:
- Local inference (no API costs)
- Privacy-first (no data sent to cloud)
- Models: llama3.2, mistral, codellama, etc.

---

## Vector Service

**File**: `backend/src/services/vectorService.js`

### Purpose
- Vector similarity search
- Embedding management

### Key Functions

#### `searchSimilar(query, limit, threshold, userId?)`
**Purpose**: Find semantically similar memories

```javascript
const results = await searchSimilar(
  "AI productivity ideas",
  20,        // limit
  0.3,       // minimum similarity
  userId
);

// Returns:
[
  {
    id: "uuid",
    raw_content: "...",
    category: "Idea",
    tags: ["ai", "productivity"],
    similarity: 0.89,
    created_at: "2026-01-24T..."
  },
  // ... up to 20 results
]
```

**SQL Query**:
```sql
SELECT 
  id,
  raw_content,
  category,
  tags,
  created_at,
  1 - (embedding <=> $1::vector) AS similarity
FROM memories
WHERE 1 - (embedding <=> $1::vector) > $2
ORDER BY embedding <=> $1::vector
LIMIT $3
```

**Performance**: ~50-100ms for 10k vectors (IVFFlat index)

---

## Ollama Service

**File**: `backend/src/services/ollamaService.js`

### Purpose
- Manage local Ollama models
- Local LLM inference
- Model downloads

### Key Functions

#### `getOllamaStatus()`
**Purpose**: Check if Ollama is available

```javascript
const status = await getOllamaStatus();

// Returns:
{
  available: true,
  models: [
    {
      name: "llama3.2:latest",
      size: 4700000000,  // bytes
      modified_at: "2026-01-20T..."
    }
  ]
}
```

---

#### `pullOllamaModel(modelName)`
**Purpose**: Download new Ollama model

```javascript
await pullOllamaModel("llama3.2");
// Streams download progress
```

**Note**: Can take 5-30 minutes depending on model size

---

#### `deleteOllamaModel(modelName)`
**Purpose**: Remove Ollama model to free space

```javascript
await deleteOllamaModel("llama3.2:latest");
```

---

#### `chatWithOllama(messages, context, options)`
**Purpose**: Generate chat responses with local LLM

```javascript
const response = await chatWithOllama(
  messages,
  context,
  {
    model: 'llama3.2',
    temperature: 0.7,
    max_tokens: 2048
  }
);
```

**Performance**: Varies by hardware
- CPU: 1-5 tokens/sec
- GPU (RTX 3090): 20-50 tokens/sec

---

#### `generateOllamaEmbedding(text, model)`
**Purpose**: Generate embeddings locally

```javascript
const embedding = await generateOllamaEmbedding(
  "My thought",
  "llama3.2"
);
```

**Compatibility**: Embeddings must match vector size (1536 for OpenAI)

---

## Service Best Practices

### 1. Error Handling

```javascript
export async function generateEmbedding(text, userId = null) {
  try {
    const settings = userId 
      ? await getUserSettings(userId, 'embedding')
      : getDefaultSettings('embedding');
    
    if (settings.provider === 'ollama') {
      return await ollamaService.generateOllamaEmbedding(text, settings.model);
    }
    
    const response = await openai.embeddings.create({
      model: settings.model,
      input: text.slice(0, 8000),  // Limit input size
      dimensions: 1536
    });
    
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw new Error('Failed to generate embedding');  // Generic error to client
  }
}
```

---

### 2. Retry Logic

```javascript
async function retryWithBackoff(fn, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      
      const delay = Math.pow(2, i) * 1000;  // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Usage
const embedding = await retryWithBackoff(() => 
  openai.embeddings.create({ model: 'text-embedding-3-small', input: text })
);
```

---

### 3. Timeout Handling

```javascript
async function withTimeout(promise, timeoutMs) {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
  );
  
  return Promise.race([promise, timeout]);
}

// Usage
const response = await withTimeout(
  generateChatResponse(messages, context),
  30000  // 30 second timeout
);
```

---

### 4. Caching (Future)

```javascript
// Cache embeddings to avoid regeneration
const embeddingCache = new Map();

async function generateEmbeddingCached(text) {
  const cacheKey = crypto.createHash('md5').update(text).digest('hex');
  
  if (embeddingCache.has(cacheKey)) {
    return embeddingCache.get(cacheKey);
  }
  
  const embedding = await generateEmbedding(text);
  embeddingCache.set(cacheKey, embedding);
  
  return embedding;
}
```

---

## Service Testing

### Unit Tests (Future)

```javascript
// aiService.test.js
import { generateEmbedding, classifyAndStructure } from '../services/aiService';

describe('AI Service', () => {
  it('should generate embeddings', async () => {
    const embedding = await generateEmbedding('test text');
    expect(embedding).toHaveLength(1536);
    expect(embedding[0]).toBeTypeOf('number');
  });
  
  it('should classify content', async () => {
    const result = await classifyAndStructure('Build an AI assistant');
    expect(result.category).toBe('Idea');
    expect(result.tags).toContain('ai');
  });
});
```

---

## Service Dependencies

### External APIs
- **OpenAI**: Chat, Embeddings
- **Anthropic**: Chat (Claude)
- **Ollama**: Local LLM (optional)

### Internal Dependencies
- Database (`db/index.js`)
- No circular dependencies

---

## Performance Metrics

### Typical Response Times
- `generateEmbedding`: 100-200ms (OpenAI), 1-5s (Ollama)
- `classifyAndStructure`: 1-3s (OpenAI), 3-10s (Ollama)
- `generateChatResponse`: 2-5s (OpenAI), 5-30s (Ollama)
- `searchSimilar`: 50-100ms (pgvector)

### Cost Estimates (OpenAI)
- Embedding (1k tokens): $0.00002
- GPT-4o (1k input, 1k output): $0.0025 + $0.010
- GPT-4o Mini (1k input, 1k output): $0.00015 + $0.0006

---

**Last Updated**: 2026-01-26  
**Services**: 5 (aiService, vectorService, ollamaService, queryAnalyzer, smartSearch)  
**Providers**: OpenAI, Anthropic, Ollama

---

## Query Analyzer Service

**File**: `backend/src/services/queryAnalyzer.js`

### Purpose
- Extract structured filters from natural language queries
- Detect categories, tags, and dates in user queries
- Support synonym mapping for common variations
- Clean query text for better embedding generation

### Key Functions

#### `analyzeQuery(userQuery)`
**Purpose**: Parse natural language query and extract structured filters

**Returns**:
```javascript
{
  originalQuery: "work tasks from yesterday",
  cleanedQuery: "from",  // With categories/tags/dates removed
  filters: {
    datePhrase: "yesterday",
    categories: ["work"],
    tags: ["tasks"],
    exactMatches: {
      category: "work",
      tags: ["tasks"]
    }
  },
  searchType: "hybrid"  // "semantic" | "filtered" | "hybrid"
}
```

**Synonym Support**:
- Categories: "meetings" → "meeting", "events" → "meeting", "todos" → "task"
- Tags: "important" → "priority", "urgent", "critical"

**Example**:
```javascript
const analysis = await analyzeQuery("show me urgent meetings from yesterday");
// Extracts: date="yesterday", category="meeting", tags=["urgent"]
```

---

## Smart Search Service

**File**: `backend/src/services/smartSearch.js`

### Purpose
- Multi-stage search with priority filtering
- Intelligent score boosting for exact matches
- Combine structured filters with semantic similarity
- Provide search insights and metadata

### Key Functions

#### `smartSearch(userQuery, options)`
**Purpose**: Execute intelligent search with 4-stage priority filtering

**Options**:
```javascript
{
  limit: 20,        // Max results
  userId: "uuid",   // User ID for filtering
  threshold: 0.5    // Min similarity (ignored for exact matches)
}
```

**Returns**:
```javascript
{
  results: [
    {
      id: "uuid",
      content: "...",
      category: "work",
      similarity: 0.85,
      final_score: 5.35,  // similarity + category_boost + tag_boost
      match_type: "date+category+tag+semantic"
    }
  ],
  analysis: { /* query analysis */ },
  metadata: {
    dateFiltered: true,
    categoryFiltered: true,
    tagFiltered: true,
    totalMatches: 5
  }
}
```

**Priority Filtering**:
1. **Date** (highest): Filter by memory_date/due_date/received_date
2. **Category**: Exact match, +3.0 score boost
3. **Tag**: Contains match, +1.5 per tag boost
4. **Vector**: Semantic similarity (0.0-1.0)

**Score Calculation**:
```
final_score = similarity + category_boost + tag_boost
Example: 0.85 + 3.0 + 1.5 = 5.35 (535%)
```

**Example**:
```javascript
const result = await smartSearch("work tasks due tomorrow", {
  limit: 10,
  userId: "uuid",
  threshold: 0.3
});
// Applies: date filter (tomorrow), category filter (work), tag filter (tasks)
```

---
**Key Operations**: Embeddings, Classification, RAG Chat
