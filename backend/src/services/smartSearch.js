/**
 * Smart Multi-Stage Search Service
 * Implements priority-based filtering with intelligent score boosting
 * Priority: Date > Category > Tag > Vector Similarity
 */

import { generateEmbedding } from './aiService.js';
import { analyzeQuery } from './queryAnalyzer.js';
import { parseDateQuery } from '../utils/dateParser.js';
import { formatToMMDDYY } from '../utils/dateUtils.js';
import { query as dbQuery } from '../db/index.js';

/**
 * Format a row from database into memory object
 */
function formatMemory(row) {
  return {
    id: row.id,
    rawContent: row.raw_content,
    structuredContent: row.structured_content,
    category: row.category,
    tags: row.tags || [],
    embedding: row.embedding,
    source: row.source,
    sourceId: row.source_id,
    slackMessageTs: row.slack_message_ts,
    
    // Date fields (raw timestamps)
    memoryDate: row.memory_date,
    dueDate: row.due_date,
    receivedDate: row.received_date,
    
    // Date fields (formatted mm/dd/yy)
    memoryDateFormatted: row.memory_date_formatted,
    dueDateFormatted: row.due_date_formatted,
    receivedDateFormatted: row.received_date_formatted,
    
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

/**
 * Execute smart search with priority filtering and score boosting
 */
export async function smartSearch(userQuery, options = {}) {
  const {
    limit = 20,
    userId,
    threshold = 0.5
  } = options;

  console.log('[SMART SEARCH] Starting:', userQuery);

  // Step 1: Analyze query to extract structured filters
  const analysis = await analyzeQuery(userQuery);
  console.log('[SMART SEARCH] Analysis complete');

  // Step 2: Parse dates if found
  let dateFilter = null;
  if (analysis.filters.datePhrase) {
    dateFilter = parseDateQuery(analysis.filters.datePhrase);
    if (!dateFilter) {
      console.warn('[SMART SEARCH] Could not parse date:', analysis.filters.datePhrase);
    }
  }

  // Step 3: Build WHERE clauses with priority filters
  const whereClauses = ['embedding IS NOT NULL'];
  const params = [];
  let paramIndex = 1;

  // Priority 1: Date filtering (using formatted fields)
  if (dateFilter) {
    const { startDate, endDate, dateField } = dateFilter;
    const formattedField = `${dateField}_formatted`;
    
    const startFormatted = formatToMMDDYY(startDate);
    const endFormatted = formatToMMDDYY(endDate);
    
    whereClauses.push(`${formattedField} >= $${paramIndex}`);
    params.push(startFormatted);
    paramIndex++;
    
    whereClauses.push(`${formattedField} <= $${paramIndex}`);
    params.push(endFormatted);
    paramIndex++;
    
    console.log(`[SMART SEARCH] Date filter: ${formattedField} BETWEEN ${startFormatted} AND ${endFormatted}`);
  }

  // Priority 2: Category filtering (exact match)
  let categoryParamIndex = null;
  if (analysis.filters.exactMatches.category) {
    whereClauses.push(`category = $${paramIndex}`);
    params.push(analysis.filters.exactMatches.category);
    categoryParamIndex = paramIndex;
    paramIndex++;
    console.log('[SMART SEARCH] Category filter:', analysis.filters.exactMatches.category);
  }

  // Priority 3: Tag filtering (contains any)
  let tagParamIndex = null;
  if (analysis.filters.exactMatches.tags.length > 0) {
    whereClauses.push(`tags && $${paramIndex}::text[]`);
    params.push(analysis.filters.exactMatches.tags);
    tagParamIndex = paramIndex;
    paramIndex++;
    console.log('[SMART SEARCH] Tag filter:', analysis.filters.exactMatches.tags);
  }

  // Step 4: Generate embedding for semantic search (Priority 4)
  const embedding = await generateEmbedding(
    analysis.cleanedQuery || analysis.originalQuery
  );
  const embeddingVector = `[${embedding.join(',')}]`;
  
  params.push(embeddingVector);
  const embedParamIndex = paramIndex;
  paramIndex++;

  // Get more results than limit for boosting calculations
  params.push(Math.min(limit * 3, 100));
  const limitParamIndex = paramIndex;

  // Step 5: Build SQL query with score boosting
  const whereClause = whereClauses.join(' AND ');

  const sql = `
    SELECT *,
      1 - (embedding <=> $${embedParamIndex}::vector) as similarity,
      CASE 
        WHEN category = $${categoryParamIndex || 'NULL'} THEN 3.0 
        ELSE 0 
      END as category_boost,
      CASE 
        WHEN tags && $${tagParamIndex || 'NULL'}::text[] THEN 
          1.5 * COALESCE(array_length(
            ARRAY(SELECT unnest(tags) INTERSECT SELECT unnest($${tagParamIndex || 'NULL'}::text[])), 
            1
          ), 0)
        ELSE 0 
      END as tag_boost
    FROM memories
    WHERE ${whereClause}
    ORDER BY 
      (1 - (embedding <=> $${embedParamIndex}::vector) + 
       CASE WHEN category = $${categoryParamIndex || 'NULL'} THEN 3.0 ELSE 0 END +
       CASE WHEN tags && $${tagParamIndex || 'NULL'}::text[] THEN 1.5 ELSE 0 END
      ) DESC
    LIMIT $${limitParamIndex}
  `;

  console.log('[SMART SEARCH] Executing SQL with', params.length, 'params');

  const result = await dbQuery(sql, params);

  // Step 6: Calculate final scores and filter by threshold
  const scoredResults = result.rows.map(row => {
    const baseScore = parseFloat(row.similarity || 0);
    const categoryBoost = parseFloat(row.category_boost || 0);
    const tagBoost = parseFloat(row.tag_boost || 0);
    const finalScore = baseScore + categoryBoost + tagBoost;

    return {
      ...formatMemory(row),
      similarity: baseScore,
      categoryBoost,
      tagBoost,
      finalScore,
      matchType: determineMatchType(row, analysis, categoryBoost, tagBoost)
    };
  });

  // Filter: Keep if semantic similarity >= threshold OR has exact matches
  const filtered = scoredResults.filter(r => 
    r.similarity >= threshold || r.categoryBoost > 0 || r.tagBoost > 0
  );

  // Sort by final score and limit
  const sorted = filtered
    .sort((a, b) => b.finalScore - a.finalScore)
    .slice(0, limit);

  console.log(`[SMART SEARCH] Returning ${sorted.length} results (filtered from ${result.rows.length})`);

  return {
    results: sorted,
    analysis,
    metadata: {
      total: sorted.length,
      dateFiltered: !!dateFilter,
      categoryFiltered: !!analysis.filters.exactMatches.category,
      tagFiltered: analysis.filters.exactMatches.tags.length > 0,
      avgScore: sorted.length > 0 
        ? (sorted.reduce((sum, r) => sum + r.finalScore, 0) / sorted.length).toFixed(2)
        : 0
    }
  };
}

/**
 * Determine what type of match this result is
 */
function determineMatchType(row, analysis, categoryBoost, tagBoost) {
  const types = [];
  
  if (analysis.filters.datePhrase) types.push('date');
  if (categoryBoost > 0) types.push('category');
  if (tagBoost > 0) types.push('tag');
  if (row.similarity > 0) types.push('semantic');
  
  return types.length > 0 ? types.join('+') : 'semantic';
}
