const path = require('path');
const fs = require('fs');
const os = require('os');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { connectDb } = require('../src/db/connect');
const { getBaseConfig } = require('../src/config');
const { runReconciliation } = require('../src/services/reconciliationService');

(async () => {
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();

  await connectDb(uri);

  const outputDir = path.join(process.cwd(), 'reports-memory');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const config = getBaseConfig({ mongoUri: uri, outputDir, timestampToleranceSeconds: 300, quantityTolerancePercent: 0.01 });

  const userFilePath = path.join(process.cwd(), 'data', 'user_transactions.csv');
  const exchangeFilePath = path.join(process.cwd(), 'data', 'exchange_transactions.csv');

  try {
    const result = await runReconciliation({
      userFilePath,
      exchangeFilePath,
      userFileName: path.basename(userFilePath),
      exchangeFileName: path.basename(exchangeFilePath),
      config
    });

    console.log('RECONCILIATION RESULT:');
    console.log(JSON.stringify(result, null, 2));
    console.log('\nGenerated files in:', outputDir);
  } catch (err) {
    console.error('Run failed:', err && err.stack ? err.stack : err);
    process.exitCode = 1;
  } finally {
    await mongod.stop();
  }
})();
