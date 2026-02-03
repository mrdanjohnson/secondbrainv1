# Smart Search Quick Reference

## How It Works

Your semantic search now uses **4-stage priority filtering**:

```
Date → Category → Tag → Vector Embeddings
```

This means:
- ✅ Date-specific results always come first
- ✅ Category exact matches get +3.0 score boost
- ✅ Tag matches get +1.5 score boost per tag
- ✅ AI embeddings provide semantic understanding

## Example Queries

### Date + Category + Tag
```
"work tasks from yesterday"
"ideas from last week"  
"personal notes from this monday"
```

### Category + Semantic
```
"What are my project ideas?"
"Show me work projects"
"Find personal reflections"
```

### Tag + Semantic
```
"Find tasks related to work"
"urgent items"
"Show me important meetings"
```

### Date Range Queries
```
"tasks due in 3 days"
"meetings from this week"
"notes from Q1 2026"
"items due next friday"
```

### Pure Semantic
```
"machine learning concepts"
"how to improve productivity"
"creative writing techniques"
```

## Date Query Formats

The system understands:

**Absolute Dates**:
- `today`, `tomorrow`, `yesterday`
- `01/15/2026`, `January 15, 2026`

**Relative Dates**:
- `last week`, `this week`, `next week`
- `last month`, `this month`, `next month`
- `last 3 days`, `next 5 days`
- `in 2 days`, `in 1 week`

**Weekdays**:
- `this monday`, `next friday`
- `last tuesday`

**Quarters**:
- `Q1 2026`, `Q2`, `Q3`, `Q4`
- `this quarter`, `next quarter`, `last quarter`

**Due Dates**:
- `overdue`
- `due today`, `due tomorrow`
- `due this week`

## Understanding Results

### Match Score Badge
```
85% match
```
This is the **final composite score**:
- Vector similarity (0-100%)
- +300% for category match
- +150% per tag match

### Match Type Badges

| Badge | Meaning |
|-------|---------|
| 📅 Date | Matched date filter |
| 📁 Category | Exact category match |
| 🏷️ Tag | Tag matched in content |
| ✨ Semantic | AI embedding similarity |

### Search Insights Panel

Shows which filters were applied:
```
🌟 Search Intelligence
┌──────┐ ┌──────────┐ ┌──────┐ ┌──────────┐
│📅Date│ │📁Category│ │🏷️Tag │ │⚡Vector  │
└──────┘ └──────────┘ └──────┘ └──────────┘
Applied date and category filters with semantic search
```

## Tips for Best Results

### 1. Be Specific with Dates
✅ Good: "work tasks from yesterday"
❌ Less Good: "work tasks"

### 2. Use Your Categories
✅ Good: "project ideas from last week"
❌ Less Good: "some ideas I had"

### 3. Include Tags
✅ Good: "urgent tasks due today"
❌ Less Good: "things I need to do"

### 4. Natural Language
✅ Good: "What did I learn about AI?"
❌ Less Good: "AI learning"

### 5. Combine Filters
✅ Best: "work tasks from yesterday"
✅ Better: "work tasks"
✅ Good: "tasks"

## Adjusting Relevancy

In **Settings > LLM Settings > Search**:

- **Relevancy Score** (0.0 - 1.0):
  - `0.3` = More results, some less relevant
  - `0.5` = Balanced (default)
  - `0.7` = Fewer results, only highly relevant

**Note**: Exact category/tag matches ignore the threshold!

## How Chat Uses Smart Search

When chatting with your AI assistant, it uses the same smart search to find relevant context:

**You**: "What did I do yesterday?"
→ AI searches for memories from yesterday and includes them in its context

**You**: "Tell me about my work projects"
→ AI searches for "work" category memories about "projects"

**You**: "What are my urgent tasks?"
→ AI searches for memories tagged with "urgent" and "tasks"

This ensures the AI always has the most relevant context for your questions.

## Common Scenarios

### Scenario 1: Review Yesterday's Work
```
Query: "work from yesterday"

Applied:
- Date: 01/25/26
- Category: work
- Vector: embeddings for context

Result: All work items from yesterday, ranked by relevance
```

### Scenario 2: Find Project Ideas
```
Query: "What are my project ideas?"

Applied:
- Category: ideas
- Vector: embeddings for "project"

Result: Ideas category items related to projects
```

### Scenario 3: Check Upcoming Deadlines
```
Query: "tasks due in 3 days"

Applied:
- Date: 01/29/26 (due_date field)
- Vector: embeddings for "tasks"

Result: Items due on 01/29/26 related to tasks
```

### Scenario 4: Quarterly Review
```
Query: "work accomplishments from Q1 2026"

Applied:
- Date: 01/01/26 to 03/31/26
- Category: work
- Vector: embeddings for "accomplishments"

Result: Work items from Q1 related to accomplishments
```

## Troubleshooting

### "No results found"

**Possible Causes**:
1. No memories match your filters
2. Relevancy threshold too high
3. Wrong date range
4. Category/tag doesn't exist

**Solutions**:
- Lower relevancy score in Settings
- Check your categories and tags
- Try broader date ranges
- Use more general search terms

### "Results not relevant"

**Possible Causes**:
1. Relevancy threshold too low
2. Need more specific filters
3. Embedding model mismatch (unlikely after migration 006)

**Solutions**:
- Increase relevancy score in Settings
- Add category/tag filters to your query
- Be more specific: "work tasks" vs just "work"

### "Missing recent items"

**Possible Causes**:
1. Date filter excluding them
2. Category/tag filter too restrictive
3. Items not yet indexed

**Solutions**:
- Remove date filters
- Try broader search terms
- Wait a few seconds after creating memories

## Technical Details

### Score Calculation
```javascript
final_score = similarity + category_boost + tag_boost

Where:
- similarity: 0.0 to 1.0 (vector similarity)
- category_boost: 3.0 if exact match, else 0
- tag_boost: 1.5 per matching tag
```

### Example Score Breakdown
```
Query: "work tasks from yesterday"
Memory: "Complete project presentation"
- Category: work (+3.0)
- Tag: tasks (+1.5)
- Similarity: 0.85

Final Score: 0.85 + 3.0 + 1.5 = 5.35 (535%)
```

### Priority SQL
```sql
WHERE 
  memory_date_formatted = '01/25/26'  -- Date (priority 1)
  AND category = 'work'                -- Category (priority 2)
  AND content ILIKE '%tasks%'          -- Tag (priority 3)
  -- Vector similarity added to all results
ORDER BY final_score DESC
```

## Migration Guide

If upgrading from the old search:

### What Changed
- ✅ Smarter query understanding
- ✅ Better result ranking
- ✅ Match type indicators
- ✅ Search insights
- ✅ Consistent chat context

### What Stayed the Same
- ✅ Same search endpoint
- ✅ Same UI location
- ✅ Same keyboard shortcuts
- ✅ All your existing memories

### Breaking Changes
- ⚠️ Response format includes `analysis` and `metadata` fields
- ⚠️ Results have `final_score` instead of just `similarity`
- ⚠️ Date filters now use formatted fields (mm/dd/yy)

### Frontend Compatibility
If using the API directly, update your code:

**Old**:
```javascript
const { results } = response.data.data;
results.forEach(r => console.log(r.similarity));
```

**New**:
```javascript
const { results, metadata, analysis } = response.data.data;
results.forEach(r => {
  console.log(r.final_score);  // Composite score
  console.log(r.match_type);   // What matched
});
```

## API Reference

### POST /api/search/semantic

**Request**:
```json
{
  "query": "work tasks from yesterday",
  "limit": 20,
  "threshold": 0.5
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "query": "work tasks from yesterday",
    "results": [
      {
        "id": 123,
        "content": "Complete project presentation",
        "category": "work",
        "tags": ["tasks", "urgent"],
        "memory_date": "2026-01-25T14:30:00Z",
        "similarity": 0.85,
        "final_score": 5.35,
        "match_type": "date+category+tag+semantic"
      }
    ],
    "analysis": {
      "originalQuery": "work tasks from yesterday",
      "cleanedQuery": "from",
      "filters": {
        "dates": [{"field": "memory_date", "startDate": "2026-01-25", "endDate": "2026-01-25"}],
        "categories": ["work"],
        "tags": ["tasks"]
      },
      "searchType": "hybrid"
    },
    "metadata": {
      "dateFiltered": true,
      "categoryFiltered": true,
      "tagFiltered": true,
      "totalMatches": 1
    }
  }
}
```

## Related Docs

- [SMART-SEARCH-FEATURE.md](./SMART-SEARCH-FEATURE.md) - Full technical documentation
- [LLM-SETTINGS-FEATURE.md](./LLM-SETTINGS-FEATURE.md) - Configure relevancy scores
- [DATE-FEATURE.md](./DATE-FEATURE.md) - Understanding the date system
