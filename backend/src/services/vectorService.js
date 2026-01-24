import { query } from '../db/index.js';

export async function createMemory(memoryData) {
  const {
    raw_content,
    structured_content,
    category,
    tags,
    embedding,
    source = 'slack',
    slack_message_ts
  } = memoryData;

  // Convert embedding array to PostgreSQL vector format
  let embeddingVector = null;
  if (embedding) {
    // Ensure embedding is an array (handle both array and object formats)
    const embeddingArray = Array.isArray(embedding) ? embedding : Object.values(embedding);
    embeddingVector = `[${embeddingArray.join(',')}]`;
  }

  const result = await query(
    `INSERT INTO memories 
      (raw_content, structured_content, category, tags, embedding, source, slack_message_ts)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      raw_content,
      structured_content || null,
      category || 'Unsorted',
      tags || [],
      embeddingVector,
      source,
      slack_message_ts || null
    ]
  );

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
    sortOrder = 'DESC'
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

  // Validate sort parameters to prevent SQL injection
  const allowedSortFields = ['created_at', 'category', 'raw_content'];
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
  const { limit = 10, category, tags, threshold = 0.5 } = options;

  // Convert embedding array to PostgreSQL vector format
  const embeddingVector = Array.isArray(queryEmbedding) 
    ? `[${queryEmbedding.join(',')}]` 
    : queryEmbedding;

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

  const result = await query(
    `SELECT *, 
            1 - (embedding <=> $1::vector) as similarity
     FROM memories 
     WHERE ${whereConditions.join(' AND ')}
     ORDER BY embedding <=> $1::vector
     LIMIT $${paramIndex}`,
    [...params, limit]
  );

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
    slackMessageTs: row.slack_message_ts,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
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
  bulkClassify,
  bulkTag
};
