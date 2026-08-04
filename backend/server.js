// AXVO Backend — Sprint 1: Production Foundation (infrastructure bootstrap only)
// This file intentionally does NOT contain business logic yet.
// Its only job is to prove that GitHub -> Render deployment works end to end.

const express = require('express');
const cors = require('cors');
const { checkConnection } = require('./db');
const { runMigrations } = require('./migrate');
const authRoutes = require('./routes/auth.routes');
const sessionRoutes = require('./routes/session.routes');
const twoFactorRoutes = require('./routes/twoFactor.routes');
const profileRoutes = require('./routes/profile.routes');
const referenceRoutes = require('./routes/reference.routes');
const errorHandler = require('./middleware/errorHandler');
const authenticate = require('./middleware/authenticate');

const app = express();
const PORT = process.env.PORT || 3000;

// Render sits behind a reverse proxy — this makes req.ip reflect the
// real client IP (from X-Forwarded-For) instead of Render's internal IP.
app.set('trust proxy', true);

// Tracks the result of the most recent migration run, exposed via /api/v1/health
let lastMigrationResult = null;

app.use(cors());
app.use(express.json());

// Root route — quick sanity check when visiting the URL in a browser
app.get('/', (req, res) => {
  res.json({
    service: 'axvo-backend',
    status: 'ok',
    message: 'AXVO backend is running.'
  });
});

// Standardized API namespace, per Phase 1 requirement: 統一 API /api/v1
// Sprint 2 adds a real database connectivity check alongside the basic uptime check.
app.get('/api/v1/health', async (req, res) => {
  const health = {
    status: 'ok',
    uptime_seconds: process.uptime(),
    timestamp: new Date().toISOString(),
    database: 'unknown',
    migrations: lastMigrationResult
  };

  try {
    await checkConnection();
    health.database = 'connected';
  } catch (err) {
    health.database = 'disconnected';
    health.status = 'degraded';
    health.database_error = err.message;
  }

  const httpStatus = health.status === 'ok' ? 200 : 503;
  res.status(httpStatus).json(health);
});

// Sprint 4 — Phase 2 Authentication (register/login only; more endpoints later)
app.use('/api/v1/auth', authRoutes);

// Sprint 9 — 2FA login verification step (public: happens mid-login, before a session exists)
app.post('/api/v1/auth/2fa/verify', twoFactorRoutes.verifyLoginHandler);

// Sprint 6 — Login History + Device Management (requires a valid access token)
app.use('/api/v1/sessions', authenticate, sessionRoutes);

// Sprint 9 — 2FA setup/enable/disable (requires a valid access token)
app.use('/api/v1/2fa', authenticate, twoFactorRoutes);

// Sprint 10 — Phase 3: Profile (requires a valid access token)
app.use('/api/v1/profile', authenticate, profileRoutes);

// Sprint 10 — Reference data (public: countries, currencies)
app.use('/api/v1', referenceRoutes);

// Fallback 404 handler (part of "統一錯誤處理" — will be expanded in a later Sprint)
app.use((req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} not found`
    }
  });
});

// Centralized error handler — must be registered last, after all routes
app.use(errorHandler);

async function start() {
  try {
    lastMigrationResult = await runMigrations();
  } catch (err) {
    console.error('[migrate] Unexpected error while running migrations:', err.message);
    lastMigrationResult = { applied: [], skipped: [], failed: { error: err.message } };
  }

  app.listen(PORT, () => {
    console.log(`AXVO backend listening on port ${PORT}`);
  });
}

start();
