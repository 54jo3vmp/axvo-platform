// AXVO Backend — User repository
// Repository Pattern (Phase 1 requirement): all raw SQL for the
// `users` table lives here, so services never write SQL directly.

const { pool } = require('../db');

async function findByEmail(email) {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0] || null;
}

async function findById(id) {
  const result = await pool.query(
    'SELECT id, email, role, status, created_at FROM users WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
}

async function createUser({ email, passwordHash }) {
  const result = await pool.query(
    `INSERT INTO users (email, password_hash)
     VALUES ($1, $2)
     RETURNING id, email, role, status, created_at`,
    [email, passwordHash]
  );
  return result.rows[0];
}

module.exports = { findByEmail, findById, createUser };
