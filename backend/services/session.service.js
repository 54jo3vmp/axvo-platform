// AXVO Backend — Session service
// Powers "Device Management" (active sessions) and "Login History"
// (full session log) from Phase 2.

const sessionRepository = require('../repositories/session.repository');
const { AppError } = require('../utils/errors');

async function listActiveSessions(userId) {
  return sessionRepository.findActiveByUserId(userId);
}

async function listLoginHistory(userId) {
  return sessionRepository.findAllByUserId(userId);
}

async function revokeSessionForUser(userId, sessionId) {
  const session = await sessionRepository.findByIdAndUserId(sessionId, userId);
  if (!session) {
    throw new AppError('SESSION_NOT_FOUND', 'Session not found', 404);
  }
  await sessionRepository.revokeSession(sessionId);
}

module.exports = { listActiveSessions, listLoginHistory, revokeSessionForUser };
