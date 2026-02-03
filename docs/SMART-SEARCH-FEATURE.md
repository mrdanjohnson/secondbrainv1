# Smart Semantic Search Feature

## Overview

The Smart Semantic Search feature provides an intelligent, multi-stage search system that goes beyond simple keyword matching or basic vector similarity. It combines **natural language understanding**, **structured filtering**, and **AI embeddings** to find the most relevant memories.

## Architecture

### Search Priority Flow

The search system uses a **priority-based filtering approach** that applies filters in order of specificity:

```
1. Date Filtering (Highest Priority)
   ↓
2. Category Exact Match
   ↓
3. Tag Matching
   ↓
4. Vector Similarity (AI Embeddings)
```

This ensures that:
- Date-specific queries get temporally accurate results
- Category matches take precedence over semantic similarity
- Tag matches boost relevance scores
- Pure semantic search is used when no structured filters are detected

### Score Boosting System

Results are ranked using a **composite score** that combines:

- **Base Score**: Vector similarity (0.0 - 1.0)
- **Category Boost**: +3.0 for exact category match
- **Tag Boost**: +1.5 per matching tag
- **Final Score**: `similarity + categoryBoost + tagBoost`

This ensures exact matches rank higher than pure semantic similarity.

## Components

### 1. Query Analyzer (`queryAnalyzer.js`)

**Purpose**: Extract structured filters from natural language queries

**Key Function**: `analyzeQuery(userQuery)`

**Capabilities**:
- **Date Extraction**: Identifies date phrases and converts to date ranges
  - Supports: "yesterday", "this monday", "next friday", "in 3 days", "Q1 2026", etc.
- **Category Detection**: Matches query text against available categories
  - Case-insensitive matching
  - Removes category names from cleaned query
- **Tag Detection**: Matches query text against user's tags
  - Multiple tags can match
  - Tags removed from cleaned query
- **Exact Match Detection**: Identifies quoted strings for exact matching

**Output Structure**:
```javascript
{
  originalQuery: "show me work tasks from yesterday",
  cleanedQuery: "show me from yesterday",
  filters: {
    dates: [{ field: "memory_date", startDate: "2026-01-25", endDate: "2026-01-25" }],
    categories: ["work"],
    tags: ["tasks"],
    exactMatches: []
  },
  searchType: "hybrid" // or "semantic" or "filtered"
}
```

### 2. Smart Search Service (`smartSearch.js`)

**Purpose**: Execute multi-stage search with priority filtering and score boosting

**Key Function**: `smartSearch(userQuery, options)`

**Options**:
```javascript
{
  limit: 20,        // Max results to return
  userId: 1,        // User ID for filtering
  threshold: 0.5    // Minimum similarity score (ignored for exact matches)
}
```

**Process Flow**:

1. **Analyze Query**: Extract structured filters
2. **Build SQL WHERE Clauses**:
   - Date filters (using `*_formatted` fields for mm/dd/yy comparison)
   - Category exact match
   - Tag matching (using SQL LIKE)
3. **Generate Embedding**: For cleaned query text
4. **Execute Search**: Single SQL query with all filters and score boosting
5. **Filter Results**: Apply threshold OR include exact matches
6. **Return Results**: With metadata about what filters were applied

**SQL Example**:
```sql
WITH memory_scores AS (
  SELECT 
    m.*,
    (1 - (embedding <=> $1::vector)) AS similarity,
    CASE WHEN category = 'work' THEN 3.0 ELSE 0 END AS category_boost,
    CASE 
      WHEN content ILIKE '%tasks%' THEN 1.5 
      ELSE 0 
    END AS tag_boost,
    (1 - (embedding <=> $1::vector)) + 
      CASE WHEN category = 'work' THEN 3.0 ELSE 0 END + 
      CASE WHEN content ILIKE '%tasks%' THEN 1.5 ELSE 0 END AS final_score
  FROM memories m
  WHERE user_id = $2
    AND memory_date_formatted = '01/25/26'
    AND category = 'work'
  ORDER BY final_score DESC
  LIMIT $3
)
SELECT * FROM memory_scores
WHERE similarity >= $4 OR category_boost > 0 OR tag_boost > 0
```

**Return Structure**:
```javascript
{
  results: [
    {
      id: 123,
      content: "Complete project tasks",
      category: "work",
      similarity: 0.85,
      final_score: 5.35,  // 0.85 + 3.0 (category) + 1.5 (tag)
      match_type: "date+category+tag+semantic"
    }
  ],
  analysis: {
    originalQuery: "...",
    cleanedQuery: "...",
    filters: { ... }
  },
  metadata: {
    dateFiltered: true,
    categoryFiltered: true,
    tagFiltered: true,
    totalMatches: 1
  }
}
```

### 3. Enhanced Date Parser (`dateParser.js`)

**New Capabilities**:

- **Weekday Support**: "this monday", "next friday"
- **Relative Days**: "in 3 days", "in 2 weeks"
- **Quarter Support**: "Q1 2026", "this quarter", "next quarter"
- **All Previous**: "today", "yesterday", "last week", "last month", etc.

**Examples**:
```javascript
parseDateQuery("this monday")
// → { startDate: "2026-01-26", endDate: "2026-01-26", dateField: "memory_date" }

parseDateQuery("in 3 days")
// → { startDate: "2026-01-29", endDate: "2026-01-29", dateField: "due_date" }

parseDateQuery("Q1 2026")
// → { startDate: "2026-01-01", endDate: "2026-03-31", dateField: "memory_date" }
```

### 4. Search Controller Integration

**Endpoint**: `POST /api/search/semantic`

**Updated Implementation**:
```javascript
// OLD: Simple vector search
const results = await vectorService.searchMemoriesByText(query, options);

// NEW: Intelligent multi-stage search
const searchResult = await smartSearch(query, {
  limit: parseInt(limit),
  userId,
  threshold: finalThreshold
});
```

**Response**:
```json
{
  "success": true,
  "data": {
    "query": "work tasks from yesterday",
    "results": [...],
    "analysis": {...},
    "metadata": {
      "dateFiltered": true,
      "categoryFiltered": true,
      "tagFiltered": true,
      "totalMatches": 5
    }
  }
}
```

### 5. Chat Controller Integration

**Purpose**: Use smart search for RAG context retrieval

**Updated Implementation**:
```javascript
// OLD: Basic vector search
const contextMemories = await vectorService.searchMemoriesByVector(embedding, options);

// NEW: Smart search with natural language understanding
const searchResult = await smartSearch(message, {
  limit: contextLimit,
  userId,
  threshold
});
contextMemories = searchResult.results;
```

**Benefits**:
- Chat AI gets more relevant context
- Understands dates in questions: "What did I do yesterday?"
- Respects categories: "Tell me about my work projects"
- Uses tags intelligently: "Find tasks"

### 6. Frontend UI Enhancements

**Search Page Updates**:

1. **Search Insights Panel**:
   - Shows which filters were applied
   - Visual badges for date, category, tag, and vector search
   - Explains search strategy to user

2. **Result Cards**:
   - **Match Score**: Final composite score as percentage
   - **Match Type Badges**: Visual indicators showing:
     - 📅 Date match
     - 📁 Category match
     - 🏷️ Tag match
     - ✨ Semantic match

**Example UI**:
```
┌─────────────────────────────────────────────┐
│ 🌟 Search Intelligence                      │
│ ┌──────┐ ┌──────────┐ ┌──────┐ ┌──────────┐│
│ │📅Date│ │📁Category│ │🏷️Tag │ │⚡Vector  ││
│ └──────┘ └──────────┘ └──────┘ └──────────┘│
│ Applied date and category filters with      │
│ semantic search                             │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Complete project presentation               │
│ Work • tasks, urgent                        │
│ Yesterday at 2:30 PM                        │
│                          ┌────────────────┐ │
│                          │ 535% match ●   │ │
│                          │ 📅📁🏷️✨      │ │
│                          └────────────────┘ │
└─────────────────────────────────────────────┘
```

## Example Queries & Expected Behavior

### Date + Category + Tag Query
**Query**: `"show me work tasks from yesterday"`

**Processing**:
1. Extract date: "yesterday" → 01/25/26
2. Extract category: "work"
3. Extract tag: "tasks"
4. Cleaned query: "show me from"
5. Generate embedding for cleaned query
6. Build SQL with date, category, tag filters
7. Calculate scores with +3.0 (category) + 1.5 (tag) boosts

**Result**: Memories that are:
- From yesterday
- In "work" category
- Tagged with "tasks"
- Ranked by total score (likely 5.0+)

### Category + Semantic Query
**Query**: `"What are my project ideas?"`

**Processing**:
1. No date detected
2. Extract category: "ideas"
3. No tags detected
4. Cleaned query: "What are my project?"
5. Generate embedding
6. Build SQL with category filter
7. Calculate scores with +3.0 category boost

**Result**: Memories that are:
- In "ideas" category (guaranteed)
- Semantically similar to "project"
- Ranked by similarity + 3.0

### Pure Semantic Query
**Query**: `"machine learning concepts"`

**Processing**:
1. No date, category, or tags match
2. Cleaned query same as original
3. Generate embedding
4. Build SQL without structured filters
5. Pure vector similarity search

**Result**: Memories semantically similar to the query, ranked by similarity score only

### Date Range Query
**Query**: `"meetings in Q1 2026"`

**Processing**:
1. Extract date: "Q1 2026" → 01/01/26 to 03/31/26
2. No category/tags detected
3. Cleaned query: "meetings in"
4. Generate embedding
5. Build SQL with date range filter

**Result**: Memories from Q1 2026 that are semantically related to "meetings"

## Benefits

### 1. **Improved Relevance**
- Exact matches (category/tag) rank higher than pure semantic similarity
- Date filters ensure temporal accuracy
- Multi-factor scoring provides better ranking

### 2. **Natural Language Understanding**
- Users can search naturally: "work from yesterday"
- System extracts structure automatically
- No need for complex query syntax

### 3. **Transparent Results**
- UI shows which filters were applied
- Match type badges explain why results were returned
- Scores help users understand ranking

### 4. **Consistent Across Features**
- Search page and AI chat use same intelligence
- Ensures consistent experience
- Maintains same relevancy standards

### 5. **Performance Optimized**
- Single SQL query with all filters
- Efficient use of formatted date fields (mm/dd/yy)
- Vector index for fast similarity search

## Configuration

### Environment Variables

```bash
# Global embedding model (system-wide)
EMBEDDING_PROVIDER=openai  # or "ollama"
EMBEDDING_MODEL=text-embedding-3-small

# User-configurable per feature (in LLM Settings UI)
# - Chat provider/model
# - Search relevancy threshold (default: 0.5)
# - Category Classification model
```

### User Settings

Users can adjust:
- **Search Relevancy Score** (0.0 - 1.0): Minimum similarity threshold
  - Lower = more results, possibly less relevant
  - Higher = fewer results, only highly relevant
- **Chat Relevancy Score** (0.0 - 1.0): Threshold for context retrieval
- **LLM Providers**: Choose OpenAI or Ollama for chat/classification

## Testing

### Manual Testing Queries

Try these queries to test different scenarios:

```javascript
// Date + Category + Tag
"work tasks from yesterday"
"ideas from last week"

// Category + Semantic
"What are my project ideas?"
"Show me personal notes"

// Tag + Semantic
"Find tasks related to work"
"urgent items"

// Date Range + Semantic
"meetings from this monday"
"tasks due in 3 days"

// Quarter + Category
"What did I learn about AI in Q1 2026?"

// Pure Semantic
"machine learning concepts"
"how to improve productivity"
```

### Automated Testing

Run the test script:

```bash
cd backend
node test-smart-search.js
```

This will:
1. Test query analyzer with various inputs
2. Show extracted filters for each query
3. Execute sample searches (requires DB connection)
4. Display results with scores and match types

## Troubleshooting

### No Results Returned

**Check**:
1. Are there memories in the database?
2. Is the relevancy threshold too high?
3. Do categories/tags exist in the database?
4. Is the embedding service running?

**Solutions**:
- Lower the relevancy threshold in Settings
- Add more memories with categories/tags
- Check backend logs for errors
- Verify EMBEDDING_PROVIDER and EMBEDDING_MODEL env vars

### Incorrect Date Filtering

**Check**:
1. Are formatted date fields populated? (e.g., `memory_date_formatted`)
2. Is the date parser correctly interpreting the query?

**Solutions**:
- Ensure migration 004 was applied (adds formatted date fields)
- Check backend logs for date parsing output
- Use explicit date formats if natural language fails

### Low Relevance Scores

**Check**:
1. Is the embedding model consistent across all memories?
2. Are you using the correct EMBEDDING_MODEL env var?

**Solutions**:
- Verify all embeddings use the same model (migration 006 enforces this)
- Re-generate embeddings if model changed
- Adjust category/tag boosts in smartSearch.js if needed

## Future Enhancements

Potential improvements:

1. **Fuzzy Category Matching**: Allow partial category matches
2. **Synonym Support**: Map related terms (e.g., "work" → "job", "office")
3. **User Feedback Learning**: Track which results users click
4. **Query Suggestions**: Auto-complete based on past queries
5. **Advanced Operators**: Support AND/OR/NOT syntax
6. **Saved Searches**: Allow users to save frequent queries
7. **Search Analytics**: Track popular queries and result quality

## Related Documentation

- [DATE-FEATURE.md](./DATE-FEATURE.md) - Multi-date system documentation
- [LLM-SETTINGS-FEATURE.md](./LLM-SETTINGS-FEATURE.md) - LLM configuration guide
- [AI-CHAT-FEATURE.md](./AI-CHAT-FEATURE.md) - Chat with context documentation
- [README.md](../README.md) - General setup and configuration
