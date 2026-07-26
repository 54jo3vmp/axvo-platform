// AXVO Backend — Refresh token repository

const { pool } = require('../db');

async function createRefreshToken({ userId, tokenHash, expiresAt }) {
  const result = await pool.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)
     RETURNING id, user_id, expires_at, created_at`,
    [userId, tokenHash, expiresAt]
  );
  return result.rows[0];
}

async function findValidByHash(tokenHash) {
  const result = await pool.query(
    `SELECT * FROM refresh_tokens
     WHERE token_hash = $1 AND revoked_at IS NULL AND expires_at > now()`,
    [tokenHash]
  );
  return result.rows[0] || null;
}

async function revokeById(id) {
  await pool.query('UPDATE refresh_tokens SET revoked_at = now() WHERE id = $1', [id]);
}

async function revokeByHash(tokenHash) {
  await pool.query('UPDATE refresh_tokens SET revoked_at = now() WHERE token_hash = $1', [tokenHash]);
}

module.exports = { createRefreshToken, findValidByHash, revokeById, revokeByHash };
