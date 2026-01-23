/**
 * Database Migration Runner
 * 
 * Usage:
 *   npm run db:migrate        - Run all pending migrations
 *   npm run db:migrate:dry    - Preview migrations without applying
 *   npm run db:migrate:undo   - Rollback last migration
 *   npm run db:setup          - Run first-time setup
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 
    `postgresql://${process.env.POSTGRES_USER || 'secondbrain'}:${process.env.POSTGRES_PASSWORD || 'secondbrain_secret'}@${process.env.POSTGRES_HOST || 'localhost'}:${process.env.POSTGRES_PORT || 5432}/${process.env.POSTGRES_DB || 'second_brain'}`
});

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(message) {
  console.log('\n' + '='.repeat(60));
  log(message, colors.cyan);
  console.log('='.repeat(60));
}

/**
 * Get list of migration files sorted by version
 */
function getMigrationFiles() {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    return [];
  }
  
  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.js') && /^\d{3}_/.test(f))
    .sort();
  
  return files;
}

/**
 * Calculate checksum for migration file
 */
function calculateChecksum(content) {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

/**
 * Ensure migrations table exists
 */
async function ensureMigrationsTable() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        migration_name VARCHAR(100) UNIQUE NOT NULL,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        checksum VARCHAR(64)
      )
    `);
  } finally {
    client.release();
  }
}

/**
 * Get already applied migrations
 */
async function getAppliedMigrations() {
  const result = await pool.query(
    'SELECT migration_name FROM schema_migrations ORDER BY applied_at'
  );
  return result.rows.map(r => r.migration_name);
}

/**
 * Run a single migration
 */
async function runMigration(filename) {
  const filePath = path.join(MIGRATIONS_DIR, filename);
  const content = fs.readFileSync(filePath, 'utf-8');
  const checksum = calculateChecksum(content);
  
  log(`\n📦 Applying: ${filename}`, colors.yellow);
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Run the migration SQL (skip the checksum line)
    const sqlContent = content
      .split('\n')
      .filter(line => !line.includes("sha256-here"))
      .join('\n');
    
    await client.query(sqlContent);
    
    // Record the migration
    const migrationName = filename.replace('.js', '');
    await client.query(`
      INSERT INTO schema_migrations (migration_name, checksum)
      VALUES ($1, $2)
      ON CONFLICT (migration_name) DO UPDATE SET checksum = $2
    `, [migrationName, checksum]);
    
    await client.query('COMMIT');
    log(`✅ Completed: ${filename}`, colors.green);
    
  } catch (error) {
    await client.query('ROLLBACK');
    log(`❌ Failed: ${filename}`, colors.red);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Run all pending migrations
 */
export async function migrate(dryRun = false) {
  logSection('Database Migration Runner');
  
  try {
    await ensureMigrationsTable();
    
    const migrationFiles = getMigrationFiles();
    const appliedMigrations = await getAppliedMigrations();
    const pendingMigrations = migrationFiles.filter(f => !appliedMigrations.includes(f.replace('.js', '')));
    
    if (pendingMigrations.length === 0) {
      log('\n✅ No pending migrations. Database is up to date.', colors.green);
      return { applied: 0, migrations: [] };
    }
    
    log(`\n📊 Found ${pendingMigrations.length} pending migration(s)`, colors.blue);
    log(`   Total migrations: ${migrationFiles.length}`, colors.blue);
    
    if (dryRun) {
      log('\n🔍 DRY RUN - The following migrations would be applied:', colors.yellow);
      pendingMigrations.forEach(f => log(`   - ${f}`));
      return { applied: 0, migrations: pendingMigrations, dryRun: true };
    }
    
    let applied = 0;
    for (const filename of pendingMigrations) {
      await runMigration(filename);
      applied++;
    }
    
    logSection('Migration Complete');
    log(`✅ Successfully applied ${applied} migration(s)`, colors.green);
    
    return { applied, migrations: pendingMigrations };
    
  } catch (error) {
    log(`\n❌ Migration failed: ${error.message}`, colors.red);
    throw error;
  } finally {
    await pool.end();
  }
}

/**
 * Rollback the last migration
 */
export async function rollback() {
  logSection('Database Rollback');
  
  try {
    await ensureMigrationsTable();
    
    const result = await pool.query(
      `SELECT * FROM schema_migrations 
       ORDER BY applied_at DESC 
       LIMIT 1`
    );
    
    if (result.rows.length === 0) {
      log('\n⚠️  No migrations to rollback', colors.yellow);
      return;
    }
    
    const lastMigration = result.rows[0];
    log(`\n🔙 Rolling back: ${lastMigration.migration_name}`, colors.yellow);
    
    // For rollback, we need a corresponding down script
    // This is a simplified version - in production, you'd have separate up/down files
    log('\n⚠️  Manual rollback required. Please check migration documentation.', colors.yellow);
    
    // Remove the migration record
    await pool.query(
      'DELETE FROM schema_migrations WHERE id = $1',
      [lastMigration.id]
    );
    
    log(`✅ Removed migration record: ${lastMigration.migration_name}`, colors.green);
    
    return { rolledBack: lastMigration.migration_name };
    
  } catch (error) {
    log(`\n❌ Rollback failed: ${error.message}`, colors.red);
    throw error;
  } finally {
    await pool.end();
  }
}

/**
 * Check database connection and schema status
 */
export async function status() {
  logSection('Database Status');
  
  try {
    await ensureMigrationsTable();
    
    const migrationFiles = getMigrationFiles();
    const appliedMigrations = await getAppliedMigrations();
    
    log(`\n📁 Migration files found: ${migrationFiles.length}`, colors.blue);
    log(`📊 Migrations applied: ${appliedMigrations.length}`, colors.blue);
    log(`⏳ Migrations pending: ${migrationFiles.length - appliedMigrations.length}`, colors.blue);
    
    if (appliedMigrations.length > 0) {
      log('\n📋 Applied migrations:', colors.cyan);
      appliedMigrations.forEach(m => log(`   ✅ ${m}`));
    }
    
    const pending = migrationFiles.filter(f => !appliedMigrations.includes(f.replace('.js', '')));
    if (pending.length > 0) {
      log('\n⏳ Pending migrations:', colors.yellow);
      pending.forEach(m => log(`   📌 ${m}`));
    }
    
    // Check database connection
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    log('\n✅ Database connection: OK', colors.green);
    
    return {
      total: migrationFiles.length,
      applied: appliedMigrations.length,
      pending: pending.length,
      connected: true
    };
    
  } catch (error) {
    log(`\n❌ Database error: ${error.message}`, colors.red);
    return { connected: false, error: error.message };
  } finally {
    await pool.end();
  }
}

/**
 * First-time setup - creates all extensions, tables, and runs migrations
 */
export async function setup() {
  logSection('First-Time Database Setup');
  log('This will initialize the database schema and apply all migrations.\n', colors.blue);
  
  const client = await pool.connect();
  try {
    // Enable required extensions
    log('📦 Enabling pgvector extension...', colors.yellow);
    await client.query('CREATE EXTENSION IF NOT EXISTS vector');
    log('✅ pgvector enabled', colors.green);
    
    // Run migrations
    const result = await migrate();
    
    logSection('Setup Complete');
    log('✅ Database has been successfully initialized!', colors.green);
    log(`   Migrations applied: ${result.applied}`, colors.blue);
    
    return { success: true, ...result };
    
  } catch (error) {
    log(`\n❌ Setup failed: ${error.message}`, colors.red);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// CLI execution
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const command = process.argv[2] || 'migrate';
  
  switch (command) {
    case 'migrate':
      migrate().catch(() => process.exit(1));
      break;
    case 'migrate:dry':
      migrate(true).catch(() => process.exit(1));
      break;
    case 'rollback':
      rollback().catch(() => process.exit(1));
      break;
    case 'status':
      status().catch(() => process.exit(1));
      break;
    case 'setup':
      setup().catch(() => process.exit(1));
      break;
    default:
      log(`Unknown command: ${command}`, colors.red);
      log('Usage: node migrate.js [migrate|migrate:dry|rollback|status|setup]', colors.cyan);
      process.exit(1);
  }
}

export default { migrate, rollback, status, setup };
