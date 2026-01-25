import { query } from '../db/index.js';
import { normalizeDate, formatToMMDDYY } from '../utils/dateUtils.js';

export async function createMemory(memoryData) {
  const {
    raw_content,
    structured_content,
    category,
    tags,
    embedding,
    source = 'slack',
    source_id,
    memory_date,
    due_date,
    received_date,
    slack_message_ts
  } = memoryData;

  // Convert embedding array to PostgreSQL vector format
  let embeddingVector = null;
  if (embedding) {
    // Ensure embedding is an array (handle both array and object formats)
    const embeddingArray = Array.isArray(embedding) ? embedding : Object.values(embedding);
    embeddingVector = `[${embeddingArray.join(',')}]`;
  }

  // Normalize and format dates
  const normalizedMemoryDate = normalizeDate(memory_date);
  const normalizedDueDate = normalizeDate(due_date);
  const normalizedReceivedDate = normalizeDate(received_date);

  const memoryDateFormatted = normalizedMemoryDate ? formatToMMDDYY(normalizedMemoryDate) : null;
  const dueDateFormatted = normalizedDueDate ? formatToMMDDYY(normalizedDueDate) : null;
  const receivedDateFormatted = normalizedReceivedDate ? formatToMMDDYY(normalizedReceivedDate) : null;

  const result = await query(
    `INSERT INTO memories 
      (raw_content, structured_content, category, tags, embedding, source, source_id, 
       memory_date, due_date, received_date,
       memory_date_formatted, due_date_formatted, received_date_formatted,
       slack_message_ts)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
     RETURNING *`,
    [
      raw_content,
      structured_content || null,
      category || 'Unsorted',
      tags || [],
      embeddingVector,
      source,
      source_id || null,
      normalizedMemoryDate,
      normalizedDueDate,
      normalizedReceivedDate,
      memoryDateFormatted,
      dueDateFormatted,
      receivedDateFormatted,
      slack_message_ts || null
    ]
  );

  return formatMemory(result.rows[0]);
}

export async function findBySourceId(source, source_id) {
  if (!source_id) return null;
  
  const result = await query(
    'SELECT * FROM memories WHERE source = $1 AND source_id = $2',
    [source, source_id]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return formatMemory(result.rows[0]);
}

export async function getMemoryById(id) {
  const result = await query(
    'SELECT * FROM memories WHERE id = $1',
    [id]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return formatMemory(result.rows[0]);
}

export async function getMemories(options = {}) {
  const {
    category,
    tags,
    limit = 20,
    offset = 0,
    sortBy = 'created_at',
    sortOrder = 'DESC',
    dateField = 'memory_date',
    dateFrom,
    dateTo
  } = options;

  let whereConditions = ['1=1'];
  const params = [];
  let paramIndex = 1;

  if (category) {
    whereConditions.push(`category = $${paramIndex}`);
    params.push(category);
    paramIndex++;
  }

  if (tags && tags.length > 0) {
    whereConditions.push(`tags && $${paramIndex}::text[]`);
    params.push(tags);
    paramIndex++;
  }

  // Date range filtering
  if (dateFrom) {
    whereConditions.push(`${dateField} >= $${paramIndex}`);
    params.push(dateFrom);
    paramIndex++;
  }

  if (dateTo) {
    whereConditions.push(`${dateField} <= $${paramIndex}`);
    params.push(dateTo);
    paramIndex++;
  }

  // Validate sort parameters to prevent SQL injection
  const allowedSortFields = ['created_at', 'updated_at', 'category', 'raw_content', 'memory_date', 'due_date', 'received_date'];
  const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
  const validSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  const result = await query(
    `SELECT * FROM memories 
     WHERE ${whereConditions.join(' AND ')}
     ORDER BY ${validSortBy} ${validSortOrder}
     LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...params, limit, offset]
  );

  return result.rows.map(formatMemory);
}

export async function updateMemory(id, updates) {
  const allowedFields = ['raw_content', 'structured_content', 'category', 'tags'];
  const setClauses = [];
  const params = [];
  let paramIndex = 1;

  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key)) {
      setClauses.push(`${key} = $${paramIndex}`);
      params.push(value);
      paramIndex++;
    }
  }

  if (setClauses.length === 0) {
    return getMemoryById(id);
  }

  params.push(id);

  const result = await query(
    `UPDATE memories 
     SET ${setClauses.join(', ')}
     WHERE id = $${paramIndex}
     RETURNING *`,
    params
  );

  if (result.rows.length === 0) {
    return null;
  }

  return formatMemory(result.rows[0]);
}

export async function deleteMemory(id) {
  const result = await query(
    'DELETE FROM memories WHERE id = $1 RETURNING id',
    [id]
  );

  return result.rowCount > 0;
}

export async function searchMemoriesByVector(queryEmbedding, options = {}) {
  const { limit = 10, category, tags, threshold = 0.5, dateFrom, dateTo, dateField = 'memory_date' } = options;

  console.log('[VECTOR searchByVector] Input embedding type:', typeof queryEmbedding, 'isArray:', Array.isArray(queryEmbedding));
  console.log('[VECTOR searchByVector] Options:', options);

  // Convert embedding array to PostgreSQL vector format
  const embeddingVector = Array.isArray(queryEmbedding) 
    ? `[${queryEmbedding.join(',')}]` 
    : queryEmbedding;

  console.log('[VECTOR searchByVector] Converted vector length:', embeddingVector.length, 'first 50 chars:', embeddingVector.substring(0, 50));

  let whereConditions = ['embedding IS NOT NULL'];
  const params = [embeddingVector];
  let paramIndex = 2;

  if (category) {
    whereConditions.push(`category = $${paramIndex}`);
    params.push(category);
    paramIndex++;
  }

  if (tags && tags.length > 0) {
    whereConditions.push(`tags && $${paramIndex}::text[]`);
    params.push(tags);
    paramIndex++;
  }

  // Date range filtering
  if (dateFrom) {
    whereConditions.push(`${dateField} >= $${paramIndex}`);
    params.push(dateFrom);
    paramIndex++;
  }

  if (dateTo) {
    whereConditions.push(`${dateField} <= $${paramIndex}`);
    params.push(dateTo);
    paramIndex++;
  }

  const finalParams = [...params, limit];
  const sqlQuery = `SELECT *, 
            1 - (embedding <=> $1::vector) as similarity
     FROM memories 
     WHERE ${whereConditions.join(' AND ')}
     ORDER BY embedding <=> $1::vector
     LIMIT $${paramIndex}`;
  
  console.log('[VECTOR searchByVector] Executing SQL:', sqlQuery);
  console.log('[VECTOR searchByVector] Params count:', finalParams.length, 'paramIndex:', paramIndex);
  console.log('[VECTOR searchByVector] Param 1 (embedding) length:', finalParams[0].length);
  console.log('[VECTOR searchByVector] Param 2 (limit):', finalParams[1]);

  const result = await query(sqlQuery, finalParams);

  // Log similarities for debugging
  if (process.env.NODE_ENV === 'development') {
    console.log('Search results:', result.rows.length, 'found');
    if (result.rows.length > 0) {
      console.log('Similarities:', result.rows.map(r => ({ 
        id: r.id, 
        similarity: parseFloat(r.similarity).toFixed(3),
        threshold_check: parseFloat(r.similarity) >= threshold ? 'PASS' : 'FAIL',
        content: r.raw_content?.substring(0, 50) + '...'
      })));
      console.log('Threshold:', threshold);
    }
  }

  const filtered = result.rows.filter(row => row.similarity >= threshold);
  console.log(`Filtered ${result.rows.length} to ${filtered.length} results (threshold: ${threshold})`);

  return filtered.map(row => ({
      ...formatMemory(row),
      similarity: parseFloat(row.similarity)
    }));
}

export async function searchMemoriesByText(searchText, options = {}) {
  console.log('[VECTOR] searchMemoriesByText called with:', { searchText, options });
  const embedding = await import('./aiService.js').then(m => m.generateEmbedding(searchText));
  console.log('[VECTOR] Generated embedding length:', embedding?.length);
  console.log('[VECTOR] First 5 embedding values:', embedding?.slice(0, 5));
  const results = await searchMemoriesByVector(embedding, options);
  console.log('[VECTOR] searchMemoriesByText returning:', results.length, 'results');
  return results;
}

export async function getCategories() {
  const result = await query(
    'SELECT * FROM categories ORDER BY name',
    []
  );

  return result.rows;
}

export async function getCategoryStats() {
  const result = await query(
    `SELECT category, COUNT(*) as count 
     FROM memories 
     GROUP BY category 
     ORDER BY count DESC`,
    []
  );

  return result.rows;
}

export async function getRecentMemories(limit = 10) {
  const result = await query(
    `SELECT * FROM memories 
     ORDER BY created_at DESC 
     LIMIT $1`,
    [limit]
  );

  return result.rows.map(formatMemory);
}

export async function bulkClassify(ids, category) {
  const result = await query(
    `UPDATE memories 
     SET category = $2, updated_at = NOW()
     WHERE id = ANY($1::uuid[])
     RETURNING *`,
    [ids, category]
  );

  return result.rows.map(formatMemory);
}

export async function bulkTag(ids, tags, action = 'add') {
  if (action === 'add') {
    const result = await query(
      `UPDATE memories 
       SET tags = ARRAY_UNIQUE(ARRAY_CAT(tags, $2::text[])), updated_at = NOW()
       WHERE id = ANY($1::uuid[])
       RETURNING *`,
      [ids, tags]
    );
    return result.rows.map(formatMemory);
  } else if (action === 'remove') {
    const result = await query(
      `UPDATE memories 
       SET tags = ARRAY_REMOVE(tags, ANY($2::text[])), updated_at = NOW()
       WHERE id = ANY($1::uuid[])
       RETURNING *`,
      [ids, tags]
    );
    return result.rows.map(formatMemory);
  } else if (action === 'replace') {
    const result = await query(
      `UPDATE memories 
       SET tags = $2::text[], updated_at = NOW()
       WHERE id = ANY($1::uuid[])
       RETURNING *`,
      [ids, tags]
    );
    return result.rows.map(formatMemory);
  }
}

// Helper function to format memory object
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

// Get overdue memories
export async function getOverdue(limit = 20) {
  const result = await query(
    `SELECT * FROM memories 
     WHERE due_date IS NOT NULL 
     AND due_date < NOW()
     ORDER BY due_date ASC
     LIMIT $1`,
    [limit]
  );
  
  return result.rows.map(formatMemory);
}

// Get upcoming memories (due in next 7 days)
export async function getUpcoming(days = 7, limit = 20) {
  const result = await query(
    `SELECT * FROM memories 
     WHERE due_date IS NOT NULL 
     AND due_date >= NOW()
     AND due_date <= NOW() + INTERVAL '${days} days'
     ORDER BY due_date ASC
     LIMIT $1`,
    [limit]
  );
  
  return result.rows.map(formatMemory);
}

export default {
  createMemory,
  getMemoryById,
  getMemories,
  updateMemory,
  deleteMemory,
  searchMemoriesByVector,
  searchMemoriesByText,
  getCategories,
  getCategoryStats,
  getRecentMemories,
  getOverdue,
  getUpcoming,
  bulkClassify,
  bulkTag,
  findBySourceId
};
