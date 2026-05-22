const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');
const os = require('os');

const { MongoMemoryServer } = require('mongodb-memory-server');
const { connectDb } = require('../src/db/connect');
const { getBaseConfig } = require('../src/config');
const { runReconciliation } = require('../src/services/reconciliationService');

test('full reconciliation run end-to-end', async (t) => {
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();

  // connect mongoose to in-memory server
  await connectDb(uri);

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'koinx-test-'));

  const userFile = path.join(process.cwd(), 'data', 'user_transactions.csv');
  const exchangeFile = path.join(process.cwd(), 'data', 'exchange_transactions.csv');

  const config = getBaseConfig({
    mongoUri: uri,
    outputDir: tmpDir,
    timestampToleranceSeconds: 300,
    quantityTolerancePercent: 0.01
  });

  let result;
  try {
    result = await runReconciliation({
    userFilePath: userFile,
    exchangeFilePath: exchangeFile,
    userFileName: path.basename(userFile),
    exchangeFileName: path.basename(exchangeFile),
    config
    });
  } catch (err) {
    console.error('runReconciliation failed:', err && err.stack ? err.stack : err);
    throw err;
  }

  // basic assertions
  assert.ok(result.runId, 'runId should be present');
  assert.ok(result.counts, 'counts should be present');
  assert.ok(typeof result.counts.matched === 'number');
  assert.ok(fs.existsSync(result.reportPath), 'report CSV should exist');

  // cleanup
  await mongod.stop();
});
