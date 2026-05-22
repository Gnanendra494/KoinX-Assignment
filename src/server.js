const { createApp } = require('./app');
const { getBaseConfig } = require('./config');
const { connectDb } = require('./db/connect');

async function main() {
  const config = getBaseConfig();
  await connectDb(config.mongoUri);
  const app = createApp();
  app.listen(config.port, () => {
    console.log(`Server listening on port ${config.port}`);
  });
}

if (require.main === module) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
