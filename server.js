// AXVO Backend — Sprint 1: Production Foundation (infrastructure bootstrap only)
// This file intentionally does NOT contain business logic yet.
// Its only job is to prove that GitHub -> Render deployment works end to end.

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

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
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime_seconds: process.uptime(),
    timestamp: new Date().toISOString()
  });
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

app.listen(PORT, () => {
  console.log(`AXVO backend listening on port ${PORT}`);
});
