const Transaction = require('../models/Transaction');
const { readCsv } = require('../utils/csv');
const { normalizeRow } = require('../utils/normalize');

function duplicateKey(record) {
  const n = record.normalized;
  return [n.transaction_id, n.timestamp, n.type, n.direction || '', n.asset, n.quantity, n.price_usd ?? '', n.fee ?? ''].join('|');
}

async function ingestFile({ runId, source, filePath }) {
  const rows = readCsv(filePath);
  const seenTxIds = new Map();
  const documents = [];
  const qualityIssues = [];

  rows.forEach((row, index) => {
    const normalized = normalizeRow(row, source, index + 2);
    const transactionId = normalized.normalized.transaction_id;

    if (transactionId) {
      const prev = seenTxIds.get(transactionId) || 0;
      seenTxIds.set(transactionId, prev + 1);
      if (prev >= 1) normalized.issues.push(`duplicate transaction_id in ${source} file`);
    }

    const doc = {
      runId,
      source,
      rowNumber: index + 2,
      transactionId,
      raw: row,
      normalized: normalized.normalized,
      issues: normalized.issues,
      validForMatching: normalized.issues.length === 0,
      duplicateGroupKey: duplicateKey(normalized)
    };

    if (normalized.issues.length) {
      qualityIssues.push({
        source,
        rowNumber: index + 2,
        transactionId: transactionId || '',
        reason: normalized.issues.join('; ')
      });
    }

    documents.push(doc);
  });

  await Transaction.insertMany(documents);
  return { rows: documents, qualityIssues };
}

module.exports = { ingestFile };
