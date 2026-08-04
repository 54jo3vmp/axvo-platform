// AXVO Backend — Auth routes
// Mounted at /api/v1/auth in server.js

const express = require('express');
const authService = require('../services/auth.service');

const router = express.Router();

// Wraps async route handlers so thrown errors reach the centralized
// error-handling middleware instead of crashing the process.
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body || {};
    const user = await authService.register({ email, password });
    res.status(201).json({ user });
  })
);

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body || {};
    const ipAddress = req.ip;
    const userAgent = req.get('user-agent');
    const result = await authService.login({ email, password, ipAddress, userAgent });
    res.status(200).json(result);
  })
);

router.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const { refresh_token } = req.body || {};
    const result = await authService.refreshAccessToken(refresh_token);
    res.status(200).json(result);
  })
);

router.post(
  '/verify-email',
  asyncHandler(async (req, res) => {
    const { token } = req.body || {};
    const result = await authService.verifyEmail(token);
    res.status(200).json(result);
  })
);

router.post(
  '/forgot-password',
  asyncHandler(async (req, res) => {
    const { email } = req.body || {};
    const result = await authService.forgotPassword({ email });
    res.status(200).json(result);
  })
);

router.post(
  '/reset-password',
  asyncHandler(async (req, res) => {
    const { token, new_password: newPassword } = req.body || {};
    const result = await authService.resetPassword({ token, newPassword });
    res.status(200).json(result);
  })
);

router.post(
  '/logout',
  asyncHandler(async (req, res) => {
    const { refresh_token } = req.body || {};
    await authService.logout(refresh_token);
    res.status(200).json({ message: 'Logged out successfully' });
  })
);

module.exports = router;
