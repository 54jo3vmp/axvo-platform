// AXVO Backend — Sprint 2: Database connection module
// This module ONLY sets up a reusable connection pool to PostgreSQL.
// No tables, no queries beyond a basic connectivity check yet — that comes in Sprint 3.

const { Pool } = require('pg');

// Render's PostgreSQL connection string will be provided via the
// DATABASE_URL environment variable (set in the Render dashboard).
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn('[db] Warning: DATABASE_URL is not set. Database features will fail.');
}

const pool = new Pool({
  connectionString,
  // Render's managed Postgres requires SSL; this setting works for
  // both Render Postgres and most other managed cloud databases.
  ssl: connectionString ? { rejectUnauthorized: false } : false
});

/**
 * Simple connectivity check — runs SELECT 1 to confirm the database
 * is reachable. Used by the /api/v1/health endpoint.
 */
async function checkConnection() {
  const client = await pool.connect();
  try {
    await client.query('SELECT 1');
    return true;
  } finally {
    client.release();
  }
}

module.exports = { pool, checkConnection };
