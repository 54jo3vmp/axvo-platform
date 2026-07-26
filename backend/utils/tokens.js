// AXVO Backend — Refresh token helpers
// Refresh tokens are high-entropy random strings, not JWTs. We store
// only a SHA-256 hash of them in the database, so a leaked database
// row alone can't be used to impersonate a user.

const crypto = require('crypto');

function generateRefreshToken() {
  return crypto.randomBytes(40).toString('hex');
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

module.exports = { generateRefreshToken, hashToken };
