const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const reconciliationRoutes = require('./routes/reconciliationRoutes');

function createApp() {
  const app = express();
  app.use(helmet());
  app.use(express.json({ limit: '2mb' }));
  app.use(morgan('dev'));

  app.get('/health', (_req, res) => res.json({ ok: true }));
  app.use('/api', reconciliationRoutes);

  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ message: err.message || 'Internal Server Error' });
  });

  return app;
}

module.exports = { createApp };
