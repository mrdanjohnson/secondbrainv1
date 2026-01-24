# N8N Direct PostgreSQL Integration Tutorial

## 🎯 Overview

This tutorial guides you through setting up an N8N workflow that captures thoughts, classifies them with AI, generates embeddings, and inserts them **directly into PostgreSQL**—bypassing the backend API for maximum efficiency.

### Why Direct PostgreSQL Integration?

✅ **Faster Performance** - No API layer overhead  
✅ **Reduced Costs** - Single AI processing (no duplicate calls)  
✅ **Simplified Architecture** - N8N → PostgreSQL → Frontend (UI auto-updates)  
✅ **Better for Automation** - Perfect for Slack, webhooks, scheduled tasks  
✅ **API Independence** - iOS Shortcuts and other apps use the API separately  

---

## 📋 Prerequisites

- ✅ N8N running via Docker Compose (`http://192.168.1.129:5678`)
- ✅ PostgreSQL with pgvector extension
- ✅ OpenAI API key (for classification & embeddings)
- ✅ Basic understanding of N8N workflows

---

## 🏗️ Architecture

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
```

---

## Part 1: Configure N8N PostgreSQL Credentials

### Step 1: Access N8N

1. Open your browser: `http://192.168.1.129:5678`
2. Login with your N8N credentials (default: admin / secondbrain123)

### Step 2: Add PostgreSQL Credentials

1. Click on **"Credentials"** in the left sidebar
2. Click **"Add Credential"**
3. Search for **"Postgres"** and select it
4. Fill in the connection details:

```
Host: postgres
Port: 5432
Database: second_brain
User: secondbrain
Password: secondbrain_secret
SSL: Disabled (for local development)
```

5. Click **"Test"** to verify connection
6. Click **"Save"**
7. Name it: **"Second Brain DB"**

---

## Part 2: Add OpenAI Credentials

### Step 1: Add OpenAI API Key

1. Go to **Credentials** → **"Add Credential"**
2. Search for **"OpenAI"**
3. Enter your OpenAI API Key
4. Click **"Save"**
5. Name it: **"OpenAI API"**

---

## Part 3: Understanding the Database Schema

### The `memories` Table Structure

```sql
CREATE TABLE memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    raw_content TEXT NOT NULL,              -- Original input text
    structured_content JSONB,                -- AI classification result
    category VARCHAR(100) DEFAULT 'Unsorted', -- Main category
    tags TEXT[],                             -- Array of tags
    embedding VECTOR(1536),                  -- OpenAI embedding
    source VARCHAR(50) DEFAULT 'slack',      -- Origin (slack, webhook, etc.)
    slack_message_ts VARCHAR(50),            -- Slack timestamp (if applicable)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Key Fields Explained

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Auto-generated unique ID |
| `raw_content` | TEXT | The original thought/message |
| `structured_content` | JSONB | AI classification: `{summary, category, tags, sentiment, priority, entities}` |
| `category` | VARCHAR | One of: Idea, Task, Project, Reference, Journal, Meeting, Learning, Unsorted |
| `tags` | TEXT[] | PostgreSQL array: `{"tag1", "tag2", "tag3"}` |
| `embedding` | VECTOR(1536) | OpenAI text-embedding-3-small vector |
| `source` | VARCHAR | Where it came from (slack, webhook, email, etc.) |

### Important: Data Formatting

**PostgreSQL TEXT[] Arrays (tags):**
```javascript
// ✅ CORRECT format
const tagsFormatted = `{${tagArray.map(t => `"${t}"`).join(',')}}`;
// Output: {"tag1","tag2","tag3"}

// ❌ WRONG - this won't work
const tags = JSON.stringify(tagArray);
```

**PostgreSQL VECTOR (embedding):**
```javascript
// ✅ CORRECT format
const embeddingFormatted = `[${embeddingArray.join(',')}]`;
// Output: [0.123,-0.456,0.789,...]

// ❌ WRONG - this won't work
const embedding = JSON.stringify(embeddingArray);
```

---

## Part 4: Import the Workflow

### Quick Start: Import Pre-Built Workflow

1. Download the workflow file: [`n8n/workflow-postgres-direct.json`](../n8n/workflow-postgres-direct.json)
2. In N8N, go to **Workflows** → **Import from File**
3. Select the downloaded JSON file
4. Update credential references:
   - Click each OpenAI node → Select your "OpenAI API" credential
   - Click PostgreSQL node → Select your "Second Brain DB" credential
5. Click **"Save"**
6. Click **"Activate"** to enable the workflow

### Manual Build: Step-by-Step Creation

If you prefer to build from scratch, continue with the sections below.

---

## Part 5: Build the Workflow (Manual)

### Step 1: Create New Workflow

1. In N8N, click **"Workflows"** → **"Add Workflow"**
2. Name it: **"Second Brain - Direct PostgreSQL"**

### Step 2: Add Webhook Trigger

1. Click **"+"** to add a node
2. Search for **"Webhook"** and select it
3. Configure:
   - **HTTP Method**: `POST`
   - **Path**: `memory-capture`
   - **Response Mode**: `Using 'Respond to Webhook' Node`
4. Click **"Listen for Test Event"** to get the webhook URL
5. Copy the URL (e.g., `http://192.168.1.129:5678/webhook/memory-capture`)

**Expected Input Format:**
```json
{
  "text": "Your thought or memory text",
  "source": "webhook",
  "timestamp": "optional"
}
```

### Step 3: Add AI Classification Node

1. Add a new node: **"OpenAI Chat Model"** (or **"OpenAI"** → **"Chat"**)
2. Configure:
   - **Credential**: Select "OpenAI API"
   - **Model**: `gpt-4o` (or `gpt-4o-mini` for cost savings)
   - **Messages**:
     - Click **"Add Message"**
     - **Role**: `System`
     - **Content**:
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
   - Click **"Add Message"** again
     - **Role**: `User`
     - **Content**: `={{ $json.body.text || $json.body.content }}`
   - **Options**:
     - Click **"Add Option"** → **"Response Format"** → `json_object`
     - **Temperature**: `0.3`
     - **Max Tokens**: `512`

### Step 4: Parse Classification (Code Node)

1. Add **"Code"** node
2. Name it: **"Parse Classification"**
3. Configure:
   - **Mode**: `Run Once for All Items`
   - **Language**: `JavaScript`
   - **Code**:

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

// Get AI classification result
const aiResponse = $input.item.json.message.content;
const classification = JSON.parse(aiResponse);

// Format tags as PostgreSQL array string
const tagsArray = classification.tags || [];
const tagsFormatted = `{${tagsArray.map(t => `"${t}"`).join(',')}}`;

// Return prepared data
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

### Step 5: Generate Embedding

1. Add **"OpenAI"** node (or search for **"Embeddings"**)
2. Configure:
   - **Resource**: `Embeddings` (if available in dropdown)
   - **Credential**: Select "OpenAI API"
   - **Model**: `text-embedding-3-small`
   - **Input**: `={{ $json.raw_content }}`

**Note**: If your N8N version uses HTTP Request for embeddings, use:
- **Method**: `POST`
- **URL**: `https://api.openai.com/v1/embeddings`
- **Authentication**: `Generic Credential Type` → Add OpenAI bearer token
- **Body**: 
```json
{
  "model": "text-embedding-3-small",
  "input": "={{ $json.raw_content }}",
  "dimensions": 1536
}
```

### Step 6: Prepare Final Data (Code Node)

1. Add **"Code"** node
2. Name it: **"Prepare Data"**
3. Configure:
   - **Mode**: `Run Once for All Items`
   - **Code**:

```javascript
// Get data from previous nodes
const preparedData = $('Parse Classification').item.json;
const embeddingData = $input.item.json.data[0].embedding;

// Format embedding as PostgreSQL vector string
const embeddingFormatted = `[${embeddingData.join(',')}]`;

// Combine everything for database insertion
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

### Step 7: Insert into PostgreSQL

1. Add **"Postgres"** node
2. Name it: **"Insert to PostgreSQL"**
3. Configure:
   - **Credential**: Select "Second Brain DB"
   - **Operation**: `Insert`
   - **Schema**: `public`
   - **Table**: `memories`
   - **Columns**:
     - Click **"Add Column"** for each field:
       - `raw_content` = `={{ $json.raw_content }}`
       - `structured_content` = `={{ $json.structured_content }}`
       - `category` = `={{ $json.category }}`
       - `tags` = `={{ $json.tags }}`
       - `embedding` = `={{ $json.embedding }}`
       - `source` = `={{ $json.source }}`
       - `slack_message_ts` = `={{ $json.slack_message_ts }}`
   - **Return Fields**: `*` (to get the inserted record including auto-generated ID)

### Step 8: Add Success Response

1. Add **"Respond to Webhook"** node
2. Configure:
   - **Response Body**: 
   ```json
   {
     "success": true,
     "message": "Memory captured successfully",
     "id": "={{ $json.id }}",
     "category": "={{ $json.category }}",
     "tags": "={{ $json.tags }}"
   }
   ```

### Step 9: Connect All Nodes

Connect the nodes in order:
1. Webhook → AI Classification
2. AI Classification → Parse Classification
3. Parse Classification → Generate Embedding
4. Generate Embedding → Prepare Data
5. Prepare Data → Insert to PostgreSQL
6. Insert to PostgreSQL → Respond to Webhook

### Step 10: Save and Activate

1. Click **"Save"** at the top
2. Click **"Activate"** to enable the workflow

---

## Part 6: Testing the Workflow

### Test 1: Manual Webhook Test

1. Click the **Webhook** node in your workflow
2. Click **"Listen for Test Event"**
3. In a new terminal window, run:

```bash
curl -X POST http://192.168.1.129:5678/webhook/memory-capture \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Test direct PostgreSQL insertion from N8N workflow",
    "source": "test"
  }'
```

4. Watch the workflow execute through each node
5. You should see a success response with the memory ID

### Test 2: Verify in Database

```bash
# Connect to PostgreSQL
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
SELECT 
  id, 
  category,
  pg_column_size(embedding) as embedding_bytes 
FROM memories 
WHERE embedding IS NOT NULL 
ORDER BY created_at DESC 
LIMIT 5;

# Exit
\q
```

### Test 3: Check Frontend UI

1. Open your Second Brain web app: `http://192.168.1.129:5173`
2. The test memory should appear instantly!
3. Click on it to see the AI-generated category, tags, and summary

---

## Part 7: Slack Integration

### Step 1: Create Slack App

1. Go to [Slack API](https://api.slack.com/apps)
2. Click **"Create New App"** → **"From scratch"**
3. **App Name**: `Second Brain`
4. **Workspace**: Select your workspace
5. Click **"Create App"**

### Step 2: Configure Bot Permissions

1. Go to **"OAuth & Permissions"** in the left sidebar
2. Scroll to **"Scopes"** → **"Bot Token Scopes"**
3. Click **"Add an OAuth Scope"** and add:
   - `channels:history` - Read channel messages
   - `channels:read` - View channel info
   - `chat:write` - Send messages (optional)
   - `app_mentions:read` - Read when bot is mentioned
4. Scroll up and click **"Install to Workspace"**
5. Click **"Allow"**
6. Copy the **"Bot User OAuth Token"** (starts with `xoxb-`)

### Step 3: Set Up Event Subscription

1. Go to **"Event Subscriptions"** in the left sidebar
2. Toggle **"Enable Events"** to **ON**
3. **Request URL**: Enter your N8N webhook URL
   - For local testing: Use [ngrok](https://ngrok.com/)
     ```bash
     ngrok http 5678
     # Copy the https URL, e.g., https://abc123.ngrok.io
     ```
   - **Request URL**: `https://abc123.ngrok.io/webhook/memory-capture`
   - ⚠️ Slack will verify the URL - make sure workflow is active!
4. Scroll to **"Subscribe to bot events"**
5. Click **"Add Bot User Event"** and add:
   - `app_mention` - When someone mentions your bot
   - `message.channels` - When messages are posted in channels (optional)
6. Click **"Save Changes"**

### Step 4: Update Workflow for Slack

Your workflow already handles Slack format in the "Parse Classification" code node. No changes needed!

### Step 5: Test Slack Integration

1. In Slack, invite your bot to a channel:
   ```
   /invite @Second Brain
   ```

2. Mention the bot:
   ```
   @Second Brain Remember to review the Q4 analytics dashboard and prepare insights for the team meeting
   ```

3. Check N8N execution log - should show successful run
4. Verify in your Second Brain UI - memory should appear!

---

## Part 8: Advanced Features

### Email Integration

Add email capture to your Second Brain:

1. Create a new workflow or add to existing
2. Add **"Email Trigger (IMAP)"** node
3. Configure with your email credentials
4. Extract subject and body
5. Connect to existing AI classification nodes

### Scheduled Digest

Create a weekly summary workflow:

1. Add **"Schedule Trigger"** node
   - **Cron Expression**: `0 0 * * 0` (Every Sunday at midnight)
2. Add **"PostgreSQL"** node to query last 7 days:
   ```sql
   SELECT category, COUNT(*) as count
   FROM memories
   WHERE created_at > NOW() - INTERVAL '7 days'
   GROUP BY category
   ORDER BY count DESC
   ```
3. Add **"Email"** node to send summary

### Voice Notes (Whisper API)

1. Add webhook that accepts audio files
2. Add **"HTTP Request"** node to call OpenAI Whisper API
3. Extract transcription
4. Route to existing classification workflow

---

## Part 9: Troubleshooting

### "Invalid array literal" Error

**Problem**: PostgreSQL doesn't recognize the tags array format

**Solution**: Ensure tags are formatted as:
```javascript
const tagsFormatted = `{${tags.map(t => `"${t}"`).join(',')}}`;
// Output must be: {"tag1","tag2","tag3"}
```

### "Invalid vector" Error

**Problem**: Embedding isn't formatted correctly

**Solution**:
```javascript
const embeddingFormatted = `[${embedding.join(',')}]`;
// Output must be: [0.123,-0.456,0.789,...]
```

### "Connection refused" to PostgreSQL

**Problem**: N8N can't reach PostgreSQL

**Solution**:
- Use hostname `postgres` (not `localhost`)
- Ensure both containers are on same Docker network: `second-brain-net`
- Check `docker-compose ps` to verify both running

### Webhook Not Triggering from Slack

**Problem**: No data received from Slack

**Solution**:
- Verify Request URL in Slack Event Subscriptions is correct
- Check if N8N port 5678 is accessible
- Use ngrok for local testing: `ngrok http 5678`
- Update Slack Request URL to ngrok HTTPS URL
- Make sure workflow is **Active** (toggle at top)

### UI Not Updating

**Problem**: Memories inserted but don't show in UI

**Solution**:
- Hard refresh browser: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- Check browser console for errors (F12)
- Verify `created_at` timestamp is correct in database
- Clear browser cache

### N8N Execution Errors

**Problem**: Workflow fails at certain nodes

**Solution**:
- Click on failed node to see error details
- Check **"Executions"** tab for full error log
- Verify all credentials are properly configured
- Test each node individually with "Execute Node" button

---

## Part 10: Performance Optimization

### Reduce AI Costs

1. **Use Cheaper Models**:
   - Classification: Switch from `gpt-4o` to `gpt-4o-mini` (90% cheaper)
   - Embeddings: Already using cheapest model (`text-embedding-3-small`)

2. **Limit Token Usage**:
   - Truncate long inputs:
   ```javascript
   const text = rawText.slice(0, 2000); // Max 2000 chars
   ```

3. **Batch Embeddings** (for bulk processing):
   - OpenAI allows up to 2048 texts per request
   - Modify workflow to batch multiple memories

### Speed Improvements

1. **Parallel Processing** (Advanced):
   - Run classification and embedding in parallel
   - Merge results before database insert

2. **Database Indexing** (Already configured):
   - GIN index on `tags`
   - IVFFlat index on `embedding`
   - B-tree index on `created_at`

---

## Part 11: Monitoring & Maintenance

### View Execution History

1. In N8N, click **"Executions"** in left sidebar
2. See all workflow runs with timestamps
3. Click any execution to see full details
4. Filter by: Success, Error, Waiting

### Database Statistics

Run these queries periodically:

```sql
-- Daily memory count
SELECT 
  DATE(created_at) as date, 
  COUNT(*) as memories,
  COUNT(DISTINCT category) as categories
FROM memories 
GROUP BY DATE(created_at) 
ORDER BY date DESC 
LIMIT 30;

-- Category distribution
SELECT 
  category, 
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM memories 
GROUP BY category 
ORDER BY count DESC;

-- Source distribution
SELECT 
  source,
  COUNT(*) as count
FROM memories 
GROUP BY source 
ORDER BY count DESC;

-- Average embeddings per day
SELECT 
  DATE(created_at) as date,
  COUNT(*) FILTER (WHERE embedding IS NOT NULL) as with_embedding,
  COUNT(*) as total
FROM memories
GROUP BY DATE(created_at)
ORDER BY date DESC
LIMIT 7;
```

### Set Up Alerts (Optional)

Create a monitoring workflow:
1. **Schedule Trigger**: Every hour
2. **PostgreSQL Query**: Count failed insertions
3. **If** node: If failures > threshold
4. **Email/Slack Alert**: Notify admin

---

## 🎯 Best Practices

### ✅ Do's

- ✅ Test workflow thoroughly before activating
- ✅ Monitor execution logs regularly
- ✅ Keep credentials secure (never expose in workflow)
- ✅ Use descriptive node names
- ✅ Add error handling to critical nodes
- ✅ Document any custom modifications
- ✅ Back up workflow JSON periodically

### ❌ Don'ts

- ❌ Don't hardcode API keys in Code nodes
- ❌ Don't skip input validation
- ❌ Don't ignore rate limits (OpenAI: 60 req/min)
- ❌ Don't process untrusted input without sanitization
- ❌ Don't forget to deactivate test workflows
- ❌ Don't expose webhook URLs publicly without authentication

---

## 📚 Additional Resources

- **N8N Documentation**: https://docs.n8n.io
- **PostgreSQL Arrays**: https://www.postgresql.org/docs/current/arrays.html
- **pgvector Documentation**: https://github.com/pgvector/pgvector
- **OpenAI API Reference**: https://platform.openai.com/docs
- **Slack API Documentation**: https://api.slack.com

---

## 🎉 Success Checklist

After completing this tutorial, you should have:

- [x] N8N workflow that captures thoughts from webhooks
- [x] AI classification using GPT-4o
- [x] Vector embeddings for semantic search
- [x] Direct PostgreSQL insertion (no API layer)
- [x] Slack integration (optional but recommended)
- [x] Real-time frontend UI updates
- [x] Working test examples

---

## What's Next?

1. **Monitor for 1 Week** - Track classifications, costs, performance
2. **Refine AI Prompts** - Adjust based on classification accuracy
3. **Add More Sources** - Email, voice notes, scheduled digests
4. **Optimize Costs** - Consider gpt-4o-mini or local LLMs (Ollama)
5. **Scale Up** - Add batch processing for bulk imports
6. **Share with Team** - Train others on effective capture techniques

---

**Congratulations!** 🎊

You now have a fully automated Second Brain that captures thoughts 24/7, processes them with AI, and makes them instantly searchable. Your knowledge management system is ready to grow with you!

**Questions?** Check the troubleshooting section or review the workflow execution logs for detailed error messages.

**Happy automating!** 🚀🧠
