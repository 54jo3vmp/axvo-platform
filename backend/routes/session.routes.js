// AXVO Backend — Session routes
// Mounted at /api/v1/sessions in server.js. All routes here require
// a valid access token (protected by the `authenticate` middleware).

const express = require('express');
const sessionService = require('../services/session.service');

const router = express.Router();

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

// Device Management: list devices/sessions currently logged in
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const sessions = await sessionService.listActiveSessions(req.user.id);
    res.status(200).json({ sessions });
  })
);

// Login History: full log including past/revoked sessions
router.get(
  '/history',
  asyncHandler(async (req, res) => {
    const sessions = await sessionService.listLoginHistory(req.user.id);
    res.status(200).json({ sessions });
  })
);

// Revoke a specific device/session (e.g. "log out this device")
router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await sessionService.revokeSessionForUser(req.user.id, req.params.id);
    res.status(200).json({ message: 'Session revoked successfully' });
  })
);

module.exports = router;
