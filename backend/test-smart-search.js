/**
 * Test script for smart semantic search
 * Run with: node test-smart-search.js
 */

import { analyzeQuery } from './src/services/queryAnalyzer.js';
import { smartSearch } from './src/services/smartSearch.js';

const TEST_QUERIES = [
  'show me work tasks from yesterday',
  'ideas from last week',
  'What are my project ideas?',
  'Find tasks related to work',
  'meeting notes from this monday',
  'tasks due in 3 days',
  'What did I learn about AI in Q1 2026?',
  'personal tasks from today'
];

console.log('='.repeat(80));
console.log('SMART SEARCH TEST');
console.log('='.repeat(80));
console.log('');

// Test query analyzer
console.log('📊 QUERY ANALYZER TESTS');
console.log('-'.repeat(80));
console.log('');

for (const query of TEST_QUERIES) {
  console.log(`Query: "${query}"`);
  
  try {
    const analysis = await analyzeQuery(query);
    
    console.log('  Analysis:');
    console.log('    Search Type:', analysis.searchType);
    console.log('    Cleaned Query:', analysis.cleanedQuery);
    
    if (analysis.filters.dates.length > 0) {
      console.log('    📅 Dates:', analysis.filters.dates.map(d => 
        `${d.field}: ${d.startDate} to ${d.endDate}`
      ).join(', '));
    }
    
    if (analysis.filters.categories.length > 0) {
      console.log('    📁 Categories:', analysis.filters.categories.join(', '));
    }
    
    if (analysis.filters.tags.length > 0) {
      console.log('    🏷️  Tags:', analysis.filters.tags.join(', '));
    }
    
    console.log('');
  } catch (error) {
    console.error('  ❌ Error:', error.message);
    console.log('');
  }
}

console.log('');
console.log('='.repeat(80));
console.log('');

// Test a few actual searches (requires database connection)
console.log('🔍 SMART SEARCH EXECUTION TESTS');
console.log('-'.repeat(80));
console.log('');

const SEARCH_TESTS = [
  'What are my project ideas?',
  'work tasks from yesterday'
];

for (const query of SEARCH_TESTS) {
  console.log(`Query: "${query}"`);
  
  try {
    // Note: You'll need to provide a valid userId from your database
    const userId = 1; // Replace with actual user ID
    
    const result = await smartSearch(query, {
      limit: 5,
      userId,
      threshold: 0.3
    });
    
    console.log('  Results:', result.results.length);
    console.log('  Metadata:');
    console.log('    Date Filtered:', result.metadata.dateFiltered);
    console.log('    Category Filtered:', result.metadata.categoryFiltered);
    console.log('    Tag Filtered:', result.metadata.tagFiltered);
    
    if (result.results.length > 0) {
      console.log('  Top 3 Results:');
      result.results.slice(0, 3).forEach((r, i) => {
        console.log(`    ${i + 1}. [${r.final_score.toFixed(2)}] ${r.title || r.content.substring(0, 50)}...`);
        console.log(`       Match Types: ${r.match_type}`);
      });
    }
    
    console.log('');
  } catch (error) {
    console.error('  ❌ Error:', error.message);
    console.log('');
  }
}

console.log('='.repeat(80));
console.log('✅ Test script complete');
console.log('='.repeat(80));
