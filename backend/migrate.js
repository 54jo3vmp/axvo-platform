// AXVO Backend — Sprint 3: Automatic migration runner
// Designed so the non-technical operator never has to run a command manually:
// this runs automatically every time the server boots on Render.

const fs = require('fs');
const path = require('path');
const { pool } = require('./db');

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}

async function getAppliedMigrations(client) {
  const result = await client.query('SELECT name FROM schema_migrations');
  return new Set(result.rows.map((row) => row.name));
}

/**
 * Runs any .sql files in /migrations that haven't been applied yet,
 * in filename order (hence the 001_, 002_ prefixes). Each migration
 * runs inside its own transaction — if one fails, it rolls back and
 * stops, leaving already-applied migrations intact.
 */
async function runMigrations() {
  const client = await pool.connect();
  const results = { applied: [], skipped: [], failed: null };

  try {
    await ensureMigrationsTable(client);
    const applied = await getAppliedMigrations(client);

    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      if (applied.has(file)) {
        results.skipped.push(file);
        continue;
      }

      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');

      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
        results.applied.push(file);
        console.log(`[migrate] Applied ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        results.failed = { file, error: err.message };
        console.error(`[migrate] Failed on ${file}:`, err.message);
        break; // stop on first failure — don't attempt later migrations out of order
      }
    }
  } finally {
    client.release();
  }

  return results;
}

module.exports = { runMigrations };
