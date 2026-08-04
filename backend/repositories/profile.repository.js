// AXVO Backend — Profile repository

const { pool } = require('../db');

async function findByUserId(userId) {
  const result = await pool.query(
    `SELECT id, user_id, full_name, avatar_url, address, currency_id, language, created_at, updated_at
     FROM profiles WHERE user_id = $1`,
    [userId]
  );
  return result.rows[0] || null;
}

// Creates the profile row on first save, updates it on every subsequent save.
async function upsert(userId, { fullName, address, currencyId, language }) {
  const result = await pool.query(
    `INSERT INTO profiles (user_id, full_name, address, currency_id, language)
     VALUES ($1, $2, $3, $4, COALESCE($5, 'zh-TW'))
     ON CONFLICT (user_id) DO UPDATE SET
       full_name = EXCLUDED.full_name,
       address = EXCLUDED.address,
       currency_id = EXCLUDED.currency_id,
       language = COALESCE(EXCLUDED.language, profiles.language),
       updated_at = now()
     RETURNING id, user_id, full_name, avatar_url, address, currency_id, language, created_at, updated_at`,
    [userId, fullName, address, currencyId, language]
  );
  return result.rows[0];
}

async function updateAvatarUrl(userId, avatarUrl) {
  const result = await pool.query(
    `INSERT INTO profiles (user_id, avatar_url)
     VALUES ($1, $2)
     ON CONFLICT (user_id) DO UPDATE SET avatar_url = EXCLUDED.avatar_url, updated_at = now()
     RETURNING id, user_id, full_name, avatar_url, address, currency_id, language`,
    [userId, avatarUrl]
  );
  return result.rows[0];
}

module.exports = { findByUserId, upsert, updateAvatarUrl };
