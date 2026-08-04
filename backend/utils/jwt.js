// AXVO Backend — JWT access tokens
// Sprint 4 issues short-lived access tokens only. Refresh token
// rotation and session management are handled in a later Sprint.

const jwt = require('jsonwebtoken');

const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET;
const ACCESS_TOKEN_EXPIRES_IN = '15m';

function signAccessToken(payload) {
  if (!ACCESS_TOKEN_SECRET) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
}

function verifyAccessToken(token) {
  if (!ACCESS_TOKEN_SECRET) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return jwt.verify(token, ACCESS_TOKEN_SECRET);
}

const TWO_FACTOR_PENDING_EXPIRES_IN = '5m';

function signTwoFactorPendingToken(payload) {
  if (!ACCESS_TOKEN_SECRET) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return jwt.sign({ ...payload, purpose: '2fa_pending' }, ACCESS_TOKEN_SECRET, {
    expiresIn: TWO_FACTOR_PENDING_EXPIRES_IN
  });
}

function verifyTwoFactorPendingToken(token) {
  const payload = verifyAccessToken(token);
  if (payload.purpose !== '2fa_pending') {
    throw new Error('Token is not a valid 2FA pending token');
  }
  return payload;
}

module.exports = {
  signAccessToken,
  verifyAccessToken,
  ACCESS_TOKEN_EXPIRES_IN,
  signTwoFactorPendingToken,
  verifyTwoFactorPendingToken
};
