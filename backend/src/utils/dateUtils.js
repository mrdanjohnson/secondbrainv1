/**
 * Date Utilities for Second Brain
 * Handles date normalization, formatting, and validation
 */

/**
 * Normalize various date formats to TIMESTAMP WITH TIME ZONE
 * Returns null if invalid (doesn't default to current time)
 */
export function normalizeDate(input) {
  if (!input) return null;
  
  let date;
  
  // Already a Date object
  if (input instanceof Date) {
    date = input;
  }
  // Unix timestamp (number)
  else if (typeof input === 'number') {
    date = new Date(input);
  }
  // String (ISO 8601, mm/dd/yy, etc.)
  else if (typeof input === 'string') {
    // Handle mm/dd/yy format specifically
    const mmddyyPattern = /^(\d{1,2})\/(\d{1,2})\/(\d{2})$/;
    const match = input.match(mmddyyPattern);
    
    if (match) {
      const [_, month, day, year] = match;
      const fullYear = parseInt(year) + 2000; // Assume 20xx
      date = new Date(fullYear, parseInt(month) - 1, parseInt(day));
    } else {
      // Try standard Date parsing for ISO 8601 and other formats
      date = new Date(input);
    }
  }
  else {
    return null;
  }
  
  // Validate the date
  if (isNaN(date.getTime())) {
    return null;
  }
  
  return date;
}

/**
 * Format Date object to mm/dd/yy string
 */
export function formatToMMDDYY(date) {
  if (!date) return null;
  
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return null;
  
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const year = String(d.getFullYear()).slice(-2);
  
  return `${month}/${day}/${year}`;
}

/**
 * Validate if input is a valid date
 */
export function validateDate(input) {
  const normalized = normalizeDate(input);
  return normalized !== null;
}

/**
 * Get current timestamp
 */
export function getCurrentTimestamp() {
  return new Date();
}

/**
 * Parse relative date (e.g., "30 days", "1 week")
 * Returns Date object in the past
 */
export function parseRelativeDate(relativeString) {
  const pattern = /^(\d+)\s+(day|days|week|weeks|month|months)$/i;
  const match = relativeString.match(pattern);
  
  if (!match) return null;
  
  const [_, amount, unit] = match;
  const num = parseInt(amount);
  const now = new Date();
  
  switch (unit.toLowerCase()) {
    case 'day':
    case 'days':
      return new Date(now.setDate(now.getDate() - num));
    case 'week':
    case 'weeks':
      return new Date(now.setDate(now.getDate() - (num * 7)));
    case 'month':
    case 'months':
      return new Date(now.setMonth(now.getMonth() - num));
    default:
      return null;
  }
}

/**
 * Check if a date is in the past
 */
export function isPastDate(date) {
  if (!date) return false;
  const d = normalizeDate(date);
  if (!d) return false;
  return d < new Date();
}

/**
 * Check if a date is overdue (past and exists)
 */
export function isOverdue(dueDate) {
  return dueDate && isPastDate(dueDate);
}

/**
 * Get start and end of day for a date
 */
export function getStartOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function getEndOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}
