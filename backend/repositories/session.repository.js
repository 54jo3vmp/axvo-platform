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

// Device Management: currently active (not revoked, not expired) sessions
async function findActiveByUserId(userId) {
  const result = await pool.query(
    `SELECT id, ip_address, user_agent, created_at, expires_at
     FROM sessions
     WHERE user_id = $1 AND revoked_at IS NULL AND expires_at > now()
     ORDER BY created_at DESC`,
    [userId]
  );
  return result.rows;
}

// Login History: all sessions regardless of status, most recent first
async function findAllByUserId(userId, limit = 50) {
  const result = await pool.query(
    `SELECT id, ip_address, user_agent, created_at, expires_at, revoked_at
     FROM sessions
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [userId, limit]
  );
  return result.rows;
}

async function findByIdAndUserId(id, userId) {
  const result = await pool.query(
    'SELECT id, user_id FROM sessions WHERE id = $1 AND user_id = $2',
    [id, userId]
  );
  return result.rows[0] || null;
}

async function revokeAllForUser(userId) {
  await pool.query(
    'UPDATE sessions SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL',
    [userId]
  );
}

module.exports = {
  createSession,
  revokeSession,
  findActiveByUserId,
  findAllByUserId,
  findByIdAndUserId,
  revokeAllForUser
};
