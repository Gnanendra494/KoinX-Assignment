const path = require('path');
const { connectDb } = require('../src/db/connect');
const { getBaseConfig } = require('../src/config');
const { runReconciliation } = require('../src/services/reconciliationService');

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--user') args.userFilePath = argv[++i];
    else if (arg === '--exchange') args.exchangeFilePath = argv[++i];
    else if (arg === '--timestampToleranceSeconds') args.timestampToleranceSeconds = Number(argv[++i]);
    else if (arg === '--quantityTolerancePercent') args.quantityTolerancePercent = Number(argv[++i]);
  }
  return args;
}

(async () => {
  const args = parseArgs(process.argv);
  const config = getBaseConfig({
    timestampToleranceSeconds: args.timestampToleranceSeconds,
    quantityTolerancePercent: args.quantityTolerancePercent
  });
  await connectDb(config.mongoUri);

  const userFilePath = args.userFilePath || path.join(process.cwd(), 'data', 'user_transactions.csv');
  const exchangeFilePath = args.exchangeFilePath || path.join(process.cwd(), 'data', 'exchange_transactions.csv');

  const result = await runReconciliation({
    userFilePath,
    exchangeFilePath,
    userFileName: path.basename(userFilePath),
    exchangeFileName: path.basename(exchangeFilePath),
    config
  });

  console.log(JSON.stringify(result, null, 2));
})().catch(err => {
  console.error(err);
  process.exit(1);
});
