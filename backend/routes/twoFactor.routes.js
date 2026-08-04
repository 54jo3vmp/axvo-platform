// AXVO Backend — Two-factor authentication routes
// setup/enable/disable are mounted behind `authenticate` in server.js
// (under /api/v1/2fa). The login-verification step is mounted publicly
// under /api/v1/auth (it happens mid-login, before a session exists).

const express = require('express');
const twoFactorService = require('../services/twoFactor.service');
const authService = require('../services/auth.service');

const router = express.Router();

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

// --- Protected routes (require a logged-in user) ---

router.post(
  '/setup',
  asyncHandler(async (req, res) => {
    const result = await twoFactorService.setupTwoFactor(req.user.id, req.user.email);
    res.status(200).json(result);
  })
);

router.post(
  '/enable',
  asyncHandler(async (req, res) => {
    const { code } = req.body || {};
    const result = await twoFactorService.enableTwoFactor(req.user.id, code);
    res.status(200).json(result);
  })
);

router.post(
  '/disable',
  asyncHandler(async (req, res) => {
    const result = await twoFactorService.disableTwoFactor(req.user.id);
    res.status(200).json(result);
  })
);

module.exports = router;

// --- Public route (used mid-login, exported separately) ---
// Mounted at /api/v1/auth/2fa/verify — no authentication yet, since the
// user hasn't completed login. Authorization comes from the pending_token.
module.exports.verifyLoginHandler = asyncHandler(async (req, res) => {
  const { pending_token: pendingToken, code } = req.body || {};
  const ipAddress = req.ip;
  const userAgent = req.get('user-agent');
  const result = await authService.verifyTwoFactorLogin({ pendingToken, code, ipAddress, userAgent });
  res.status(200).json(result);
});
