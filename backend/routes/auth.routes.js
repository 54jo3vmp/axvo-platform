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
    const result = await authService.login({ email, password });
    res.status(200).json(result);
  })
);

module.exports = router;
