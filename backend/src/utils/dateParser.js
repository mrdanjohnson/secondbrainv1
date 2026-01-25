/**
 * Natural Language Date Parser for Second Brain
 * Parses human-friendly date queries into date ranges
 */

import { getStartOfDay, getEndOfDay } from './dateUtils.js';

/**
 * Parse natural language date queries into date ranges
 * Returns { startDate, endDate, dateField }
 */
export function parseDateQuery(query, context = {}) {
  const queryLower = query.toLowerCase().trim();
  const now = new Date();
  
  let startDate, endDate, dateField = context.defaultField || 'memory_date';
  
  // Detect field from context keywords
  if (queryLower.includes('due') || queryLower.includes('deadline')) {
    dateField = 'due_date';
  } else if (queryLower.includes('received') || queryLower.includes('got') || queryLower.includes('email')) {
    dateField = 'received_date';
  }
  
  // Yesterday
  if (queryLower.includes('yesterday')) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    startDate = getStartOfDay(yesterday);
    endDate = getEndOfDay(yesterday);
  }
  // Today
  else if (queryLower.includes('today')) {
    startDate = getStartOfDay(now);
    endDate = getEndOfDay(now);
  }
  // Tomorrow
  else if (queryLower.includes('tomorrow')) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    startDate = getStartOfDay(tomorrow);
    endDate = getEndOfDay(tomorrow);
  }
  // Last X days
  else if (queryLower.match(/last\s+(\d+)\s+days?/)) {
    const match = queryLower.match(/last\s+(\d+)\s+days?/);
    const days = parseInt(match[1]);
    const past = new Date(now);
    past.setDate(past.getDate() - days);
    startDate = getStartOfDay(past);
    endDate = getEndOfDay(now);
  }
  // Next X days
  else if (queryLower.match(/next\s+(\d+)\s+days?/)) {
    const match = queryLower.match(/next\s+(\d+)\s+days?/);
    const days = parseInt(match[1]);
    const future = new Date(now);
    future.setDate(future.getDate() + days);
    startDate = getStartOfDay(now);
    endDate = getEndOfDay(future);
  }
  // Last week / past week
  else if (queryLower.includes('last week') || queryLower.includes('past week')) {
    const past = new Date(now);
    past.setDate(past.getDate() - 7);
    startDate = getStartOfDay(past);
    endDate = getEndOfDay(now);
  }
  // Last month / past month
  else if (queryLower.includes('last month') || queryLower.includes('past month')) {
    const past = new Date(now);
    past.setMonth(past.getMonth() - 1);
    startDate = getStartOfDay(past);
    endDate = getEndOfDay(now);
  }
  // Next week
  else if (queryLower.includes('next week')) {
    startDate = getStartOfDay(now);
    const future = new Date(now);
    future.setDate(future.getDate() + 7);
    endDate = getEndOfDay(future);
  }
  // This week
  else if (queryLower.includes('this week')) {
    const dayOfWeek = now.getDay();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek);
    startDate = getStartOfDay(startOfWeek);
    endDate = getEndOfDay(now);
  }
  // This month
  else if (queryLower.includes('this month')) {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    startDate = getStartOfDay(startOfMonth);
    endDate = getEndOfDay(now);
  }
  // Overdue (special case for due_date)
  else if (queryLower.includes('overdue')) {
    startDate = new Date('1970-01-01');
    endDate = new Date(now);
    dateField = 'due_date';
  }
  else {
    return null; // Couldn't parse
  }
  
  return { startDate, endDate, dateField };
}

/**
 * Extract date query from user message
 * Returns the matched date phrase or null
 */
export function extractDateFromMessage(message) {
  const patterns = [
    /yesterday/i,
    /today/i,
    /tomorrow/i,
    /last\s+\d+\s+days?/i,
    /next\s+\d+\s+days?/i,
    /last\s+week/i,
    /past\s+week/i,
    /last\s+month/i,
    /past\s+month/i,
    /next\s+week/i,
    /this\s+week/i,
    /this\s+month/i,
    /overdue/i
  ];
  
  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) {
      return match[0];
    }
  }
  
  return null;
}

/**
 * Check if message contains date-related queries
 */
export function hasDateQuery(message) {
  return extractDateFromMessage(message) !== null;
}
