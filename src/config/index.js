require('dotenv').config();

function numberFromEnv(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}

function getBaseConfig(overrides = {}) {
  return {
    timestampToleranceSeconds: overrides.timestampToleranceSeconds ?? numberFromEnv('TIMESTAMP_TOLERANCE_SECONDS', 300),
    quantityTolerancePercent: overrides.quantityTolerancePercent ?? numberFromEnv('QUANTITY_TOLERANCE_PERCENT', 0.01),
    outputDir: overrides.outputDir ?? process.env.OUTPUT_DIR ?? 'reports',
    mongoUri: overrides.mongoUri ?? process.env.MONGO_URI ?? 'mongodb://localhost:27017/koinx_reconciliation',
    port: overrides.port ?? numberFromEnv('PORT', 3000)
  };
}

module.exports = { getBaseConfig };
