# N8N Direct PostgreSQL Integration - Complete Plan

## Overview

Create an automated system using N8N that captures thoughts, classifies them with AI, generates embeddings, and inserts directly into PostgreSQL—bypassing the backend API for maximum efficiency while maintaining compatibility with iOS Shortcuts and other API-based integrations.

## Architecture

```
┌─────────────────┐
│  Input Source   │
│ (Slack/Webhook) │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│   N8N Workflow  │
│                 │
│  1. Capture     │
│  2. Classify AI │
│  3. Embed AI    │
│  4. Insert DB   │
└────────┬────────┘
         │
         ↓
┌─────────────────┐     ┌──────────────┐
│   PostgreSQL    │────→│  Frontend UI │
│   + pgvector    │     │ (Auto-sync)  │
└─────────────────┘     └──────────────┘
         ↑
         │
┌─────────────────┐
│   Backend API   │ (Used by iOS Shortcuts)
│ (Independent)   │
└─────────────────┘
```

## Key Benefits

✅ **No API Layer Overhead** - Direct database access for N8N workflows
✅ **Single AI Processing** - No duplicate API calls, reduced costs
✅ **Real-time UI Updates** - PostgreSQL changes reflect immediately in frontend
✅ **Perfect for Automation** - Slack, email, scheduled tasks, webhooks
✅ **API Independence** - iOS Shortcuts continue using backend API normally
✅ **Scalability** - Can handle high-volume automated capture

## Database Schema Reference

### `memories` Table Structure

```sql
CREATE TABLE memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    raw_content TEXT NOT NULL,              -- Original input text
    structured_content JSONB,                -- AI classification result
    category VARCHAR(100) DEFAULT 'Unsorted', -- Main category
    tags TEXT[],                             -- PostgreSQL array of tags
    embedding VECTOR(1536),                  -- OpenAI embedding vector
    source VARCHAR(50) DEFAULT 'slack',      -- Origin source
    slack_message_ts VARCHAR(50),            -- Slack timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Critical Data Formatting

**PostgreSQL TEXT[] Array (tags):**
```javascript
// Input: ["tag1", "tag2", "tag3"]
// Output format required: {"tag1","tag2","tag3"}
const tagsFormatted = `{${tagsArray.map(t => `"${t}"`).join(',')}}`;
```

**PostgreSQL VECTOR(1536) (embedding):**
```javascript
// Input: [0.123, -0.456, 0.789, ...]
// Output format required: [0.123,-0.456,0.789,...]
const embeddingFormatted = `[${embeddingData.join(',')}]`;
```

**JSONB (structured_content):**
```javascript
// Must be valid JSON string
const structured = JSON.stringify({
  summary: "Brief summary",
  category: "Idea",
  tags: ["tag1", "tag2"],
  sentiment: "positive",
  priority: "medium",
  entities: ["Person A", "Company B"]
});
```

## N8N Workflow Design

### Node 1: Webhook Trigger
- **Type**: Webhook
- **Method**: POST
- **Path**: `/memory-capture`
- **Response Mode**: Respond to Webhook
- **Purpose**: Accept input from Slack, webhooks, or any HTTP POST

**Expected Input Format:**
```json
{
  "text": "The thought/memory content",
  "source": "slack|webhook|email",
  "timestamp": "optional_timestamp",
  "event": {  // Slack format
    "text": "Slack message text",
    "ts": "1234567890.123456"
  }
}
```

### Node 2: AI Classification (OpenAI)
- **Type**: OpenAI Chat Model
- **Model**: gpt-4o (or gpt-4o-mini for cost savings)
- **Temperature**: 0.3 (consistent results)
- **Max Tokens**: 512

**System Prompt:**
```
You are a content classification assistant for a personal knowledge management system called "Second Brain".

Analyze the user's input and return a structured JSON object with:
- summary: A brief 1-2 sentence summary
- category: One of [Idea, Task, Project, Reference, Journal, Meeting, Learning, Unsorted]
- tags: Array of 3-5 relevant tags (lowercase, hyphenated)
- sentiment: One of [positive, neutral, negative]
- priority: One of [high, medium, low] (if applicable)
- entities: Array of named entities (people, places, organizations)

Return ONLY valid JSON, no additional text.
```

**User Message:**
```
={{ $json.body.text || $json.body.content || $json.body.event.text }}
```

**Options:**
- Response Format: `json_object`
- Temperature: `0.3`
- Max Tokens: `512`

### Node 3: Parse Classification (Code)
- **Type**: Code (JavaScript)
- **Purpose**: Extract data and format for PostgreSQL

**JavaScript Code:**
```javascript
// Handle both Slack and generic webhook formats
let text, source, timestamp;

const body = $('Webhook').item.json.body;

if (body.event) {
  // Slack event format
  text = body.event.text;
  source = 'slack';
  timestamp = body.event.ts;
  
  // Remove bot mention if present
  text = text.replace(/<@[A-Z0-9]+>/g, '').trim();
} else {
  // Generic webhook format
  text = body.text || body.content;
  source = body.source || 'webhook';
  timestamp = body.timestamp || null;
}

// Get AI classification
const aiResponse = $input.item.json.message.content;
const classification = JSON.parse(aiResponse);

// Format tags as PostgreSQL array string
const tagsArray = classification.tags || [];
const tagsFormatted = `{${tagsArray.map(t => `"${t}"`).join(',')}}`;

return [{
  json: {
    raw_content: text,
    structured_content: JSON.stringify(classification),
    category: classification.category || 'Unsorted',
    tags: tagsFormatted,
    source: source,
    slack_message_ts: timestamp,
  }
}];
```

### Node 4: Generate Embedding (OpenAI)
- **Type**: OpenAI Embeddings
- **Model**: text-embedding-3-small
- **Dimensions**: 1536
- **Input**: `={{ $json.raw_content }}`

### Node 5: Prepare Final Data (Code)
- **Type**: Code (JavaScript)
- **Purpose**: Combine classification and embedding, format for PostgreSQL

**JavaScript Code:**
```javascript
// Get data from previous nodes
const preparedData = $('Parse Classification').item.json;
const embeddingData = $input.item.json.data[0].embedding;

// Format embedding as PostgreSQL array string
const embeddingFormatted = `[${embeddingData.join(',')}]`;

// Combine everything
return [{
  json: {
    raw_content: preparedData.raw_content,
    structured_content: preparedData.structured_content,
    category: preparedData.category,
    tags: preparedData.tags,
    embedding: embeddingFormatted,
    source: preparedData.source,
    slack_message_ts: preparedData.slack_message_ts
  }
}];
```

### Node 6: Insert to PostgreSQL
- **Type**: Postgres
- **Operation**: Insert
- **Schema**: public
- **Table**: memories
- **Credentials**: Second Brain DB

**Column Mappings:**
- `raw_content`: `={{ $json.raw_content }}`
- `structured_content`: `={{ $json.structured_content }}`
- `category`: `={{ $json.category }}`
- `tags`: `={{ $json.tags }}`
- `embedding`: `={{ $json.embedding }}`
- `source`: `={{ $json.source }}`
- `slack_message_ts`: `={{ $json.slack_message_ts }}`

**Options:**
- Return Fields: `*` (return all columns including auto-generated id)

### Node 7: Success Response (Respond to Webhook)
- **Type**: Respond to Webhook
- **Response Type**: JSON

**Response Body:**
```json
{
  "success": true,
  "message": "Memory captured successfully",
  "id": "={{ $json.id }}",
  "category": "={{ $json.category }}",
  "tags": "={{ $json.tags }}"
}
```

## PostgreSQL Connection Configuration

### N8N Credentials Setup

**Connection Details:**
```
Host: postgres  (Docker internal hostname)
Port: 5432
Database: second_brain
User: secondbrain
Password: secondbrain_secret
SSL: Disabled (for local/dev)
Connection Timeout: 30000
```

**Important Notes:**
- Use hostname `postgres` not `localhost` (Docker networking)
- Ensure N8N container is on same network as PostgreSQL
- Test connection before workflow activation

## Slack Integration Setup

### Slack App Configuration

1. **Create Slack App**
   - Go to https://api.slack.com/apps
   - Click "Create New App" → "From scratch"
   - Name: "Second Brain"
   - Select workspace

2. **Bot Permissions (OAuth & Permissions)**
   - `channels:history` - Read messages
   - `channels:read` - View channel info
   - `chat:write` - Send messages
   - `app_mentions:read` - Read mentions

3. **Event Subscriptions**
   - Enable Events: ON
   - Request URL: `http://YOUR_PUBLIC_IP:5678/webhook/memory-capture`
   - Subscribe to Bot Events:
     - `app_mention`
     - `message.channels` (if posting to channels)
   
4. **Install App**
   - Install to workspace
   - Copy Bot User OAuth Token (starts with `xoxb-`)
   - Invite bot to channels: `/invite @Second Brain`

### Local Testing with ngrok

For development/testing:
```bash
ngrok http 5678
# Copy ngrok URL (e.g., https://abc123.ngrok.io)
# Use in Slack Request URL: https://abc123.ngrok.io/webhook/memory-capture
```

## Testing Procedures

### Test 1: Direct Webhook Test
```bash
curl -X POST http://192.168.1.99:5678/webhook/memory-capture \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Test direct PostgreSQL insertion from N8N",
    "source": "test"
  }'
```

**Expected Result:**
- N8N workflow executes successfully
- Memory appears in PostgreSQL
- Frontend UI updates immediately
- Response: `{"success": true, "id": "...", "category": "...", "tags": "..."}`

### Test 2: Slack Message Test
1. Invite bot to channel: `/invite @Second Brain`
2. Mention bot: `@Second Brain Remember to review Q4 analytics dashboard`
3. Check N8N execution log
4. Verify memory in UI

### Test 3: Database Verification
```bash
docker-compose exec postgres psql -U secondbrain -d second_brain

# Query recent memories
SELECT 
  id, 
  category, 
  tags, 
  LEFT(raw_content, 50) as content,
  source,
  created_at 
FROM memories 
ORDER BY created_at DESC 
LIMIT 5;

# Verify embedding exists
SELECT id, pg_column_size(embedding) as embedding_size 
FROM memories 
WHERE embedding IS NOT NULL 
LIMIT 5;
```

## User Feedback & Refinement System

### Frontend Integration
- Existing backend API allows users to edit memories
- Users can change category, add/remove tags
- Updates go through API → PostgreSQL
- No special N8N workflow needed for user edits

### Optional: Feedback Analysis Workflow

Create separate N8N workflow (runs daily):

**Node 1: Schedule Trigger**
- Cron: `0 0 * * *` (midnight daily)

**Node 2: Query Edited Memories**
```sql
SELECT 
  id,
  raw_content,
  structured_content,
  category,
  updated_at,
  created_at
FROM memories
WHERE updated_at > created_at 
  AND updated_at > NOW() - INTERVAL '30 days'
ORDER BY updated_at DESC;
```

**Node 3: Analyze Patterns (Code)**
- Group by frequently changed categories
- Identify misclassification patterns
- Store insights for prompt refinement

**Node 4: Store Insights (PostgreSQL)**
- Insert into `classification_feedback` table
- Track improvement metrics

## Advanced Features

### Email Integration
- **Node**: Email Trigger (IMAP)
- **Configuration**: Gmail/Outlook credentials
- **Processing**: Extract subject + body → existing workflow

### Scheduled Digest
- **Trigger**: Schedule (weekly)
- **Query**: Last 7 days memories grouped by category
- **Output**: Email summary with statistics

### Voice Notes (Whisper)
- **Node**: OpenAI Whisper
- **Input**: Audio file from webhook
- **Process**: Transcribe → existing classification workflow

### Batch Processing
- **Input**: CSV/JSON file upload
- **Loop**: Process each entry
- **Output**: Bulk insert with progress tracking

## Performance Optimization

### Cost Reduction
1. **Use gpt-4o-mini**: $0.150 per 1M tokens vs $5.00 for gpt-4o
2. **Batch Embeddings**: Up to 2048 texts per request
3. **Cache Common Classifications**: Store frequent patterns
4. **Local LLM Option**: Use Ollama for free classification

### Speed Optimization
1. **Parallel Processing**: Run classification + embedding simultaneously
2. **Database Indexing**: Ensure GIN index on tags, IVFFlat on embeddings
3. **Connection Pooling**: Reuse PostgreSQL connections
4. **Async Execution**: Use N8N's "Execute Workflow" for long tasks

### Scalability
1. **Queue System**: Add Redis queue for high-volume input
2. **Batch Inserts**: Combine multiple memories in single INSERT
3. **Rate Limiting**: Respect OpenAI limits (60 req/min)
4. **Error Handling**: Retry logic with exponential backoff

## Error Handling & Troubleshooting

### Common Issues

**1. "Invalid array literal" Error**
- **Cause**: Tags not formatted as PostgreSQL array
- **Solution**: Use `{${tags.map(t => `"${t}"`).join(',')}}`

**2. "Invalid vector" Error**
- **Cause**: Embedding format incorrect
- **Solution**: Use `[${embedding.join(',')}]`

**3. "Connection refused" to PostgreSQL**
- **Cause**: Wrong hostname or network
- **Solution**: Use `postgres` not `localhost`, check Docker network

**4. Webhook not triggering**
- **Cause**: Slack can't reach N8N
- **Solution**: Use ngrok for testing, verify firewall settings

**5. UI not updating**
- **Cause**: Cache or authentication issue
- **Solution**: Hard refresh (Ctrl+Shift+R), check user_id

### Error Handling in Workflow

Add to each AI node:
- **On Error**: Continue with default values
- **Retry**: 3 attempts with 5s delay
- **Fallback**: Use category "Unsorted" if classification fails

## Security Considerations

### API Key Protection
- Store OpenAI key in N8N credentials (encrypted)
- Never expose in workflow nodes
- Rotate keys periodically

### Database Access
- Use dedicated N8N user with limited permissions
- Grant only INSERT on memories table
- No DELETE or UPDATE permissions needed

### Webhook Security
- Implement Slack signature verification
- Add custom authentication header for generic webhooks
- Rate limiting on webhook endpoint

### Data Privacy
- Sanitize PII before storage
- Consider encryption for sensitive content
- Implement data retention policies

## Monitoring & Logging

### N8N Execution Logs
- Monitor workflow success rate
- Track average execution time
- Alert on repeated failures

### Database Metrics
```sql
-- Daily memory count
SELECT DATE(created_at), COUNT(*) 
FROM memories 
GROUP BY DATE(created_at) 
ORDER BY DATE(created_at) DESC 
LIMIT 30;

-- Category distribution
SELECT category, COUNT(*) 
FROM memories 
GROUP BY category 
ORDER BY COUNT(*) DESC;

-- Source distribution
SELECT source, COUNT(*) 
FROM memories 
GROUP BY source;
```

### Performance Tracking
- AI classification latency
- Embedding generation time
- Database insert duration
- End-to-end workflow time

## Workflow JSON Structure

Complete workflow for import into N8N:

```json
{
  "name": "Second Brain - Direct PostgreSQL Integration",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "memory-capture",
        "responseMode": "responseNode"
      },
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "position": [250, 300]
    },
    {
      "parameters": {
        "model": "gpt-4o",
        "messages": {...},
        "options": {
          "response_format": "json_object",
          "temperature": 0.3,
          "maxTokens": 512
        }
      },
      "name": "AI Classification",
      "type": "@n8n/n8n-nodes-langchain.openAi",
      "position": [450, 300]
    },
    {
      "parameters": {
        "jsCode": "// Parse and format code here"
      },
      "name": "Parse Classification",
      "type": "n8n-nodes-base.code",
      "position": [650, 300]
    },
    {
      "parameters": {
        "model": "text-embedding-3-small",
        "input": "={{ $json.raw_content }}"
      },
      "name": "Generate Embedding",
      "type": "@n8n/n8n-nodes-langchain.embeddingsOpenAi",
      "position": [850, 300]
    },
    {
      "parameters": {
        "jsCode": "// Prepare final data code here"
      },
      "name": "Prepare Data",
      "type": "n8n-nodes-base.code",
      "position": [1050, 300]
    },
    {
      "parameters": {
        "operation": "insert",
        "schema": "public",
        "table": "memories",
        "columns": {...}
      },
      "name": "Insert to PostgreSQL",
      "type": "n8n-nodes-base.postgres",
      "position": [1250, 300]
    },
    {
      "parameters": {
        "responseBody": "{...}"
      },
      "name": "Success Response",
      "type": "n8n-nodes-base.respondToWebhook",
      "position": [1450, 300]
    }
  ],
  "connections": {
    "Webhook": { "main": [[{ "node": "AI Classification" }]] },
    "AI Classification": { "main": [[{ "node": "Parse Classification" }]] },
    "Parse Classification": { "main": [[{ "node": "Generate Embedding" }]] },
    "Generate Embedding": { "main": [[{ "node": "Prepare Data" }]] },
    "Prepare Data": { "main": [[{ "node": "Insert to PostgreSQL" }]] },
    "Insert to PostgreSQL": { "main": [[{ "node": "Success Response" }]] }
  }
}
```

## Implementation Checklist

### Phase 1: Setup (30 minutes)
- [ ] Configure PostgreSQL credentials in N8N
- [ ] Configure OpenAI credentials in N8N
- [ ] Create new workflow in N8N
- [ ] Test database connection

### Phase 2: Build Workflow (1 hour)
- [ ] Add webhook trigger node
- [ ] Add AI classification node
- [ ] Add parse classification code node
- [ ] Add embedding generation node
- [ ] Add data preparation code node
- [ ] Add PostgreSQL insert node
- [ ] Add response node
- [ ] Connect all nodes

### Phase 3: Testing (30 minutes)
- [ ] Test with curl command
- [ ] Verify data in PostgreSQL
- [ ] Check UI updates
- [ ] Test error scenarios
- [ ] Validate data formats

### Phase 4: Slack Integration (1 hour)
- [ ] Create Slack app
- [ ] Configure bot permissions
- [ ] Set up event subscriptions
- [ ] Install bot to workspace
- [ ] Test with Slack messages
- [ ] Verify bot mentions work

### Phase 5: Documentation (30 minutes)
- [ ] Document webhook URL
- [ ] Create user guide
- [ ] Add troubleshooting tips
- [ ] Share with team

## Success Metrics

After implementation, track:
- **Capture Rate**: Memories created per day
- **Classification Accuracy**: % needing user correction
- **Response Time**: Average workflow execution time
- **Cost per Memory**: OpenAI API costs
- **User Adoption**: Active users, daily captures
- **Error Rate**: Failed executions / total executions

## Next Steps After Implementation

1. **Monitor for 1 week** - Collect initial metrics
2. **Analyze patterns** - Review classifications, adjust prompts
3. **Optimize costs** - Consider switching models, batch processing
4. **Add features** - Email integration, voice notes, scheduled digests
5. **Scale up** - Handle higher volumes, implement queuing
6. **User training** - Teach effective capture techniques

## Conclusion

This N8N Direct PostgreSQL integration provides a robust, cost-effective, and scalable solution for automated thought capture and knowledge management. By bypassing the API layer for automated workflows while maintaining API access for manual tools like iOS Shortcuts, you get the best of both worlds: efficiency for automation and flexibility for user interactions.
