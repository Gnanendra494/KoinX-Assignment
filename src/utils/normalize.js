const TYPE_ALIASES = new Map([
  ['BUY', { canonical: 'BUY', direction: null }],
  ['SELL', { canonical: 'SELL', direction: null }],
  ['TRANSFER_IN', { canonical: 'TRANSFER', direction: 'IN' }],
  ['TRANSFER_OUT', { canonical: 'TRANSFER', direction: 'OUT' }],
  ['DEPOSIT', { canonical: 'TRANSFER', direction: 'IN' }],
  ['WITHDRAWAL', { canonical: 'TRANSFER', direction: 'OUT' }],
  ['RECEIVE', { canonical: 'TRANSFER', direction: 'IN' }],
  ['SEND', { canonical: 'TRANSFER', direction: 'OUT' }],
  ['IN', { canonical: 'TRANSFER', direction: 'IN' }],
  ['OUT', { canonical: 'TRANSFER', direction: 'OUT' }]
]);

const ASSET_ALIASES = new Map([
  ['BTC', 'BTC'],
  ['BITCOIN', 'BTC'],
  ['XBT', 'BTC'],
  ['ETH', 'ETH'],
  ['ETHEREUM', 'ETH'],
  ['USDT', 'USDT'],
  ['TETHER', 'USDT'],
  ['SOL', 'SOL'],
  ['SOLANA', 'SOL'],
  ['MATIC', 'MATIC'],
  ['POLYGON', 'MATIC'],
  ['LINK', 'LINK'],
  ['CHAINLINK', 'LINK']
]);

function normalizeWhitespace(value) {
  return String(value ?? '').trim().replace(/\s+/g, ' ');
}

function normalizeAsset(asset) {
  const raw = normalizeWhitespace(asset);
  if (!raw) return { value: null, issue: 'missing asset' };
  const normalized = ASSET_ALIASES.get(raw.toUpperCase()) || raw.toUpperCase();
  return { value: normalized, issue: null };
}

function normalizeType(type) {
  const raw = normalizeWhitespace(type);
  if (!raw) return { value: null, direction: null, issue: 'missing type' };
  const normalized = TYPE_ALIASES.get(raw.toUpperCase());
  if (normalized) return { value: normalized.canonical, direction: normalized.direction, issue: null };
  return { value: raw.toUpperCase(), direction: null, issue: null };
}

function parseTimestamp(value) {
  const raw = normalizeWhitespace(value);
  if (!raw) return { value: null, issue: 'missing timestamp' };
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return { value: null, issue: `invalid timestamp: ${raw}` };
  return { value: date.toISOString(), issue: null };
}

function parseNumber(value, fieldName) {
  const raw = normalizeWhitespace(value);
  if (raw === '') return { value: null, issue: `missing ${fieldName}` };
  const n = Number(raw);
  if (!Number.isFinite(n)) return { value: null, issue: `invalid ${fieldName}: ${raw}` };
  return { value: n, issue: null };
}

function normalizeRow(rawRow, source, rowNumber) {
  const issues = [];
  const timestamp = parseTimestamp(rawRow.timestamp);
  if (timestamp.issue) issues.push(timestamp.issue);

  const type = normalizeType(rawRow.type);
  if (type.issue) issues.push(type.issue);

  const asset = normalizeAsset(rawRow.asset);
  if (asset.issue) issues.push(asset.issue);

  const quantity = parseNumber(rawRow.quantity, 'quantity');
  if (quantity.issue) issues.push(quantity.issue);
  else if (quantity.value <= 0) issues.push(`non-positive quantity: ${quantity.value}`);

  const price = parseNumber(rawRow.price_usd, 'price_usd');
  if (price.issue && rawRow.price_usd !== undefined && String(rawRow.price_usd).trim() !== '') issues.push(price.issue);

  const fee = parseNumber(rawRow.fee, 'fee');
  if (fee.issue && rawRow.fee !== undefined && String(rawRow.fee).trim() !== '') issues.push(fee.issue);

  const transactionId = normalizeWhitespace(rawRow.transaction_id);
  if (!transactionId) issues.push('missing transaction_id');

  const normalized = {
    transaction_id: transactionId || null,
    timestamp: timestamp.value,
    type: type.value,
    direction: type.direction,
    asset: asset.value,
    quantity: quantity.value,
    price_usd: price.value,
    fee: fee.value,
    note: normalizeWhitespace(rawRow.note) || null
  };

  return {
    source,
    rowNumber,
    raw: rawRow,
    normalized,
    issues,
    validForMatching: issues.length === 0
  };
}

function compatibleTypes(userRecord, exchangeRecord) {
  if (!userRecord.normalized.type || !exchangeRecord.normalized.type) return false;
  if (userRecord.normalized.type !== exchangeRecord.normalized.type) return false;
  if (userRecord.normalized.type === 'TRANSFER') {
    const a = userRecord.normalized.direction;
    const b = exchangeRecord.normalized.direction;
    return a && b && a !== b;
  }
  return true;
}

function quantityDifferencePercent(a, b) {
  const left = Math.abs(Number(a));
  const right = Math.abs(Number(b));
  const base = Math.max(left, right, 1e-12);
  return (Math.abs(left - right) / base) * 100;
}

function timestampDifferenceSeconds(a, b) {
  return Math.abs(new Date(a).getTime() - new Date(b).getTime()) / 1000;
}

module.exports = {
  normalizeRow,
  compatibleTypes,
  quantityDifferencePercent,
  timestampDifferenceSeconds
};
