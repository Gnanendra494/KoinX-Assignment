const test = require('node:test');
const assert = require('node:assert');
const { normalizeRow, quantityDifferencePercent, timestampDifferenceSeconds } = require('../src/utils/normalize');

test('normalizes bitcoin alias to BTC', () => {
  const row = normalizeRow({ transaction_id: '1', timestamp: '2024-03-01T00:00:00Z', type: 'BUY', asset: 'bitcoin', quantity: '1', price_usd: '10', fee: '0.1' }, 'user', 2);
  assert.equal(row.normalized.asset, 'BTC');
  assert.equal(row.issues.length, 0);
});

test('flags malformed timestamp', () => {
  const row = normalizeRow({ transaction_id: '1', timestamp: '2024-03-09T', type: 'SELL', asset: 'ETH', quantity: '1', price_usd: '10', fee: '0.1' }, 'user', 2);
  assert.ok(row.issues.some(x => x.includes('invalid timestamp')));
});

test('quantity diff percent uses relative diff', () => {
  const diff = quantityDifferencePercent(0.3, 0.3001);
  assert.ok(diff > 0.01);
});

test('timestamp diff seconds', () => {
  const diff = timestampDifferenceSeconds('2024-03-01T00:00:00Z', '2024-03-01T00:05:00Z');
  assert.equal(diff, 300);
});
