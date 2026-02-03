/**
 * Intelligent Query Analysis Service
 * Extracts structured filters from natural language queries
 */

import { query } from '../db/index.js';

/**
 * Category and tag synonym mappings
 * Maps common variations to canonical database values
 */
const CATEGORY_SYNONYMS = {
  'meeting': ['meeting', 'meetings', 'event', 'events', 'call', 'calls'],
  'task': ['task', 'tasks', 'todo', 'todos', 'to-do', 'to-dos'],
  'email': ['email', 'emails', 'message', 'messages'],
  'note': ['note', 'notes', 'memo', 'memos'],
  'idea': ['idea', 'ideas', 'thought', 'thoughts'],
  'project': ['project', 'projects'],
  'work': ['work', 'job'],
  'personal': ['personal', 'private']
};

const TAG_SYNONYMS = {
  'important': ['important', 'priority', 'urgent', 'critical'],
  'followup': ['followup', 'follow-up', 'follow up', 'check back'],
  'deadline': ['deadline', 'due', 'expires']
};

/**
 * Analyze query and extract structured filters
 */
export async function analyzeQuery(userQuery) {
  const analysis = {
    originalQuery: userQuery,
    cleanedQuery: userQuery,
    filters: {
      datePhrase: null,
      categories: [],
      tags: [],
      exactMatches: {
        category: null,
        tags: []
      }
    },
    searchType: 'semantic'
  };

  const queryLower = userQuery.toLowerCase();

  // 1. Extract date phrases
  const datePhrase = extractDatePhrase(userQuery);
  if (datePhrase) {
    analysis.filters.datePhrase = datePhrase;
    // Remove date phrase from cleaned query
    analysis.cleanedQuery = analysis.cleanedQuery.replace(new RegExp(datePhrase, 'gi'), '').trim();
    analysis.searchType = 'hybrid';
  }

  // 2. Get all actual categories and tags from database
  const categoriesResult = await query('SELECT DISTINCT category FROM memories WHERE category IS NOT NULL');
  const dbCategories = categoriesResult.rows.map(r => r.category);
  
  const tagsResult = await query(`
    SELECT DISTINCT unnest(tags) as tag 
    FROM memories 
    WHERE tags IS NOT NULL AND array_length(tags, 1) > 0
  `);
  const dbTags = tagsResult.rows.map(r => r.tag);

  // 3. Match categories (with synonym support)
  for (const dbCategory of dbCategories) {
    const categoryLower = dbCategory.toLowerCase();
    
    // Direct match
    if (queryLower.includes(categoryLower)) {
      analysis.filters.categories.push(dbCategory);
      analysis.filters.exactMatches.category = dbCategory;
      analysis.cleanedQuery = analysis.cleanedQuery.replace(new RegExp(dbCategory, 'gi'), '').trim();
      analysis.searchType = 'filtered';
      console.log(`[QUERY ANALYZER] Matched category (direct): ${dbCategory}`);
      break; // Only match one category
    }
    
    // Synonym match
    const synonyms = CATEGORY_SYNONYMS[categoryLower] || [];
    for (const synonym of synonyms) {
      if (queryLower.includes(synonym)) {
        analysis.filters.categories.push(dbCategory);
        analysis.filters.exactMatches.category = dbCategory;
        analysis.cleanedQuery = analysis.cleanedQuery.replace(new RegExp(synonym, 'gi'), '').trim();
        analysis.searchType = 'filtered';
        console.log(`[QUERY ANALYZER] Matched category (synonym '${synonym}'): ${dbCategory}`);
        break;
      }
    }
    
    if (analysis.filters.exactMatches.category) break;
  }

  // 4. Match tags (with synonym support)
  for (const dbTag of dbTags) {
    const tagLower = dbTag.toLowerCase();
    
    // Direct match
    if (queryLower.includes(tagLower)) {
      analysis.filters.tags.push(dbTag);
      analysis.filters.exactMatches.tags.push(dbTag);
      analysis.cleanedQuery = analysis.cleanedQuery.replace(new RegExp(dbTag, 'gi'), '').trim();
      analysis.searchType = 'filtered';
      console.log(`[QUERY ANALYZER] Matched tag (direct): ${dbTag}`);
      continue;
    }
    
    // Synonym match
    const synonyms = TAG_SYNONYMS[tagLower] || [];
    for (const synonym of synonyms) {
      if (queryLower.includes(synonym)) {
        analysis.filters.tags.push(dbTag);
        analysis.filters.exactMatches.tags.push(dbTag);
        analysis.cleanedQuery = analysis.cleanedQuery.replace(new RegExp(synonym, 'gi'), '').trim();
        analysis.searchType = 'filtered';
        console.log(`[QUERY ANALYZER] Matched tag (synonym '${synonym}'): ${dbTag}`);
        break;
      }
    }
  }

  // 5. Clean up the cleaned query
  analysis.cleanedQuery = analysis.cleanedQuery
    .replace(/\s+/g, ' ')
    .trim();

  console.log('[QUERY ANALYZER] Analysis:', {
    original: analysis.originalQuery,
    cleaned: analysis.cleanedQuery,
    datePhrase: analysis.filters.datePhrase,
    category: analysis.filters.exactMatches.category,
    tags: analysis.filters.exactMatches.tags
  });

  return analysis;
}

/**
 * Extract date-related phrases from query
 */
function extractDatePhrase(query) {
  const datePatterns = [
    /yesterday/i,
    /today/i,
    /tomorrow/i,
    /in\s+\d+\s+(day|days|week|weeks|month|months)/i,
    /(this|next|last)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i,
    /last\s+\d+\s+days?/i,
    /next\s+\d+\s+days?/i,
    /last\s+(week|month|year)/i,
    /next\s+(week|month|year)/i,
    /this\s+(week|month|year)/i,
    /overdue/i,
    /Q[1-4]\s+\d{4}/i
  ];

  for (const pattern of datePatterns) {
    const match = query.match(pattern);
    if (match) {
      return match[0];
    }
  }

  return null;
}
