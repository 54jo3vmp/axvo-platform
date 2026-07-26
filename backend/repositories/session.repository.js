// AXVO Backend — Session repository

const { pool } = require('../db');

async function createSession({ userId, ipAddress, userAgent, expiresAt }) {
  const result = await pool.query(
    `INSERT INTO sessions (user_id, ip_address, user_agent, expires_at)
     VALUES ($1, $2, $3, $4)
     RETURNING id, user_id, ip_address, user_agent, created_at, expires_at`,
    [userId, ipAddress, userAgent, expiresAt]
  );
  return result.rows[0];
}

async function revokeSession(id) {
  await pool.query('UPDATE sessions SET revoked_at = now() WHERE id = $1', [id]);
}

module.exports = { createSession, revokeSession };
