// AXVO Backend — Shared error type
// Used across services so the error-handling middleware can format
// every API error the same way (統一錯誤處理 — Phase 1 requirement).

class AppError extends Error {
  constructor(code, message, statusCode = 500) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
  }
}

module.exports = { AppError };
