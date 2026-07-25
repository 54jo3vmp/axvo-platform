// AXVO Backend — Centralized error handler
// Phase 1 requirement: 統一錯誤處理 / Response Format
// Must be registered LAST in server.js (after all routes).

const { AppError } = require('../utils/errors');

function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: { code: err.code, message: err.message }
    });
  }

  console.error('[error]', err);
  return res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: 'Something went wrong. Please try again.' }
  });
}

module.exports = errorHandler;
