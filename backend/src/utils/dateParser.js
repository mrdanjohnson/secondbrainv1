/**
 * Natural Language Date Parser for Second Brain
 * Parses human-friendly date queries into date ranges
 */

/**
 * Set to start of day (00:00:00)
 */
function getStartOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Set to end of day (23:59:59)
 */
function getEndOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export { getStartOfDay, getEndOfDay };

/**
 * Parse natural language date queries into date ranges
 * Returns { startDate, endDate, dateField }
 * 
 * Note: dateField returns the base field name (e.g., 'due_date')
 * The calling code will append '_formatted' for SQL queries (e.g., 'due_date_formatted')
 */
export function parseDateQuery(query, context = {}) {
  const queryLower = query.toLowerCase().trim();
  const now = new Date();
  
  let startDate, endDate, dateField = context.defaultField || 'memory_date';
  
  // Detect field from context keywords
  // These base field names will be appended with '_formatted' in SQL queries
  if (queryLower.includes('due') || queryLower.includes('deadline')) {
    dateField = 'due_date'; // → due_date_formatted in SQL
  } else if (queryLower.includes('received') || queryLower.includes('got') || queryLower.includes('email') || queryLower.includes('sent')) {
    dateField = 'received_date'; // → received_date_formatted in SQL
  } else if (queryLower.includes('from') || queryLower.includes('on') || queryLower.includes('occurred')) {
    dateField = 'memory_date'; // → memory_date_formatted in SQL
  }
  
  // Specific weekdays (this monday, next tuesday, last friday)
  const weekdayMatch = queryLower.match(/(this|next|last)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i);
  if (weekdayMatch) {
    const [_, modifier, weekday] = weekdayMatch;
    const targetDay = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].indexOf(weekday.toLowerCase());
    const currentDay = now.getDay();
    
    let targetDate = new Date(now);
    
    if (modifier === 'this') {
      // Get the next occurrence of this weekday (could be today)
      const daysUntil = (targetDay - currentDay + 7) % 7;
      targetDate.setDate(targetDate.getDate() + daysUntil);
    } else if (modifier === 'next') {
      // Get the weekday in next week
      const daysUntil = (targetDay - currentDay + 7) % 7 || 7;
      targetDate.setDate(targetDate.getDate() + daysUntil);
    } else if (modifier === 'last') {
      // Get the most recent occurrence of this weekday
      const daysSince = (currentDay - targetDay + 7) % 7 || 7;
      targetDate.setDate(targetDate.getDate() - daysSince);
    }
    
    startDate = getStartOfDay(targetDate);
    endDate = getEndOfDay(targetDate);
  }
  // "In X days/weeks" (future dates) - range from now to future date
  else if (queryLower.match(/in\s+(\d+)\s+(day|days|week|weeks|month|months)/)) {
    const match = queryLower.match(/in\s+(\d+)\s+(day|days|week|weeks|month|months)/);
    const amount = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    
    const future = new Date(now);
    if (unit.includes('day')) {
      future.setDate(future.getDate() + amount);
    } else if (unit.includes('week')) {
      future.setDate(future.getDate() + (amount * 7));
    } else if (unit.includes('month')) {
      future.setMonth(future.getMonth() + amount);
    }
    
    startDate = getStartOfDay(now);
    endDate = getEndOfDay(future);
    dateField = 'due_date'; // "in X days" implies due date context
  }
  // Quarter references (Q1 2026, Q2 2026, etc.)
  else if (queryLower.match(/q([1-4])\s+(\d{4})/)) {
    const match = queryLower.match(/q([1-4])\s+(\d{4})/);
    const quarter = parseInt(match[1]);
    const year = parseInt(match[2]);
    
    const quarterStarts = {
      1: [0, 2],  // Jan-Mar
      2: [3, 5],  // Apr-Jun
      3: [6, 8],  // Jul-Sep
      4: [9, 11]  // Oct-Dec
    };
    
    const [startMonth, endMonth] = quarterStarts[quarter];
    startDate = new Date(year, startMonth, 1, 0, 0, 0, 0);
    endDate = new Date(year, endMonth + 1, 0, 23, 59, 59, 999); // Last day of quarter
  }
  // "This quarter"
  else if (queryLower.includes('this quarter')) {
    const currentMonth = now.getMonth();
    const currentQuarter = Math.floor(currentMonth / 3) + 1;
    const quarterStarts = {
      1: [0, 2],
      2: [3, 5],
      3: [6, 8],
      4: [9, 11]
    };
    const [startMonth, endMonth] = quarterStarts[currentQuarter];
    startDate = new Date(now.getFullYear(), startMonth, 1, 0, 0, 0, 0);
    endDate = getEndOfDay(now); // Up to today
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
    dateField = 'due_date'; // → due_date_formatted in SQL
  }
  else {
    return null; // Couldn't parse
  }
  
  // Return base field names - calling code will append '_formatted' for SQL
  return { startDate, endDate, dateField };
}

/**
 * Extract date query from user message
 * Returns the matched date phrase or null
 */
export function extractDateFromMessage(message) {
  const patterns = [
    /in\s+\d+\s+(day|days|week|weeks|month|months)/i,
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
