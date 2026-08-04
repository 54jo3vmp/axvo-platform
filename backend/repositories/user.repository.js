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
    `SELECT id, email, role, status, created_at, country_id, two_factor_secret, two_factor_enabled
     FROM users WHERE id = $1`,
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

async function markEmailVerified(userId) {
  await pool.query('UPDATE users SET email_verified_at = now() WHERE id = $1', [userId]);
}

async function updatePassword(userId, passwordHash) {
  await pool.query(
    'UPDATE users SET password_hash = $1, updated_at = now() WHERE id = $2',
    [passwordHash, userId]
  );
}

async function setTwoFactorSecret(userId, secret) {
  await pool.query('UPDATE users SET two_factor_secret = $1 WHERE id = $2', [secret, userId]);
}

async function enableTwoFactor(userId) {
  await pool.query('UPDATE users SET two_factor_enabled = true WHERE id = $1', [userId]);
}

async function disableTwoFactor(userId) {
  await pool.query(
    'UPDATE users SET two_factor_enabled = false, two_factor_secret = NULL WHERE id = $1',
    [userId]
  );
}

async function updateCountry(userId, countryId) {
  await pool.query('UPDATE users SET country_id = $1, updated_at = now() WHERE id = $2', [
    countryId,
    userId
  ]);
}

module.exports = {
  findByEmail,
  findById,
  createUser,
  markEmailVerified,
  updatePassword,
  setTwoFactorSecret,
  enableTwoFactor,
  disableTwoFactor,
  updateCountry
};
