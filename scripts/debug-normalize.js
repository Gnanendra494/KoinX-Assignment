const path = require('path');
const { readCsv } = require('../src/utils/csv');
const { normalizeRow } = require('../src/utils/normalize');

const userFile = path.join(process.cwd(), 'data', 'user_transactions.csv');
const rows = readCsv(userFile);
const normalized = normalizeRow(rows[0], 'user', 2);
console.log('normalized:', normalized);
