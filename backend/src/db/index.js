import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Create connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://secondbrain:secondbrain_secret@localhost:5432/second_brain',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Log connection errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

// Query helper function
export async function query(text, params) {
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;
  
  // Query logging disabled - enable if needed for debugging
  // if (process.env.NODE_ENV === 'development') {
  //   const truncatedParams = params?.map(param => {
  //     if (typeof param === 'string' && param.startsWith('[') && param.length > 100) {
  //       return param.substring(0, 20) + '...' + param.substring(param.length - 5);
  //     }
  //     return param;
  //   });
  //   
  //   console.log('Executed query', { 
  //     text: text.substring(0, 100), 
  //     duration, 
  //     rows: result.rowCount,
  //     ...(truncatedParams && truncatedParams.length > 0 ? { params: truncatedParams } : {})
  //   });
  // }
  
  return result;
}

// Transaction helper
export async function transaction(callback) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Get a single client for complex operations
export async function getClient() {
  return await pool.connect();
}

// Close pool (for graceful shutdown)
export async function closePool() {
  await pool.end();
}

export default { query, transaction, getClient, closePool, pool };
