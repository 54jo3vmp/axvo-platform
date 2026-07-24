// AXVO Backend — Sprint 1: Production Foundation (infrastructure bootstrap only)
// This file intentionally does NOT contain business logic yet.
// Its only job is to prove that GitHub -> Render deployment works end to end.

const express = require('express');
const cors = require('cors');
const { checkConnection } = require('./db');
const { runMigrations } = require('./migrate');

const app = express();
const PORT = process.env.PORT || 3000;

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

// Fallback 404 handler (part of "統一錯誤處理" — will be expanded in a later Sprint)
app.use((req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} not found`
    }
  });
});

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
