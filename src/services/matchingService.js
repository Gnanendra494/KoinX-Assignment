const { compatibleTypes, quantityDifferencePercent, timestampDifferenceSeconds } = require('../utils/normalize');

function buildCandidateReason(userRow, exchangeRow, config) {
  const tDiff = timestampDifferenceSeconds(userRow.normalized.timestamp, exchangeRow.normalized.timestamp);
  const qDiff = quantityDifferencePercent(userRow.normalized.quantity, exchangeRow.normalized.quantity);
  const parts = [];
  if (tDiff > config.timestampToleranceSeconds) parts.push(`timestamp diff ${tDiff.toFixed(2)}s exceeds tolerance ${config.timestampToleranceSeconds}s`);
  if (qDiff > config.quantityTolerancePercent) parts.push(`quantity diff ${qDiff.toFixed(6)}% exceeds tolerance ${config.quantityTolerancePercent}%`);
  if (userRow.normalized.asset !== exchangeRow.normalized.asset) parts.push(`asset mismatch ${userRow.normalized.asset} vs ${exchangeRow.normalized.asset}`);
  if (!compatibleTypes(userRow, exchangeRow)) parts.push(`type mismatch ${userRow.normalized.type} vs ${exchangeRow.normalized.type}`);
  return parts.join('; ');
}

function scoreCandidate(userRow, exchangeRow, config) {
  const tDiff = timestampDifferenceSeconds(userRow.normalized.timestamp, exchangeRow.normalized.timestamp);
  const qDiff = quantityDifferencePercent(userRow.normalized.quantity, exchangeRow.normalized.quantity);
  const typePenalty = compatibleTypes(userRow, exchangeRow) ? 0 : 1000000;
  return typePenalty + (tDiff * 1000) + (qDiff * 100);
}

function canPotentiallyMatch(userRow, exchangeRow) {
  if (!userRow.validForMatching || !exchangeRow.validForMatching) return false;
  if (!userRow.normalized.timestamp || !exchangeRow.normalized.timestamp) return false;
  if (!userRow.normalized.quantity || !exchangeRow.normalized.quantity) return false;
  if (!userRow.normalized.asset || !exchangeRow.normalized.asset) return false;
  if (userRow.normalized.asset !== exchangeRow.normalized.asset) return false;
  if (!compatibleTypes(userRow, exchangeRow)) return false;
  return true;
}

function exactMatch(userRow, exchangeRow, config) {
  const timestampDiff = timestampDifferenceSeconds(userRow.normalized.timestamp, exchangeRow.normalized.timestamp);
  const quantityDiff = quantityDifferencePercent(userRow.normalized.quantity, exchangeRow.normalized.quantity);
  return timestampDiff <= config.timestampToleranceSeconds && quantityDiff <= config.quantityTolerancePercent;
}

function reconcileRows(userRows, exchangeRows, config) {
  const exchangeUsed = new Set();
  const report = [];

  const groupedExchange = new Map();
  exchangeRows.forEach((row, idx) => {
    const key = `${row.normalized.type}::${row.normalized.asset}`;
    if (!groupedExchange.has(key)) groupedExchange.set(key, []);
    groupedExchange.get(key).push({ row, idx });
  });

  const sortedUser = [...userRows].sort((a, b) => {
    const ta = new Date(a.normalized.timestamp || 0).getTime();
    const tb = new Date(b.normalized.timestamp || 0).getTime();
    return ta - tb;
  });

  for (const userRow of sortedUser) {
    if (!userRow.validForMatching) {
      report.push({
        category: 'unmatched_user',
        reason: userRow.issues.join('; ') || 'invalid user row',
        user: userRow,
        exchange: null
      });
      continue;
    }

    const key = `${userRow.normalized.type}::${userRow.normalized.asset}`;
    const candidates = (groupedExchange.get(key) || []).filter(({ idx, row }) => !exchangeUsed.has(idx) && row.validForMatching && canPotentiallyMatch(userRow, row));

    if (candidates.length === 0) {
      report.push({
        category: 'unmatched_user',
        reason: 'no candidate found in exchange file',
        user: userRow,
        exchange: null
      });
      continue;
    }

    candidates.sort((a, b) => scoreCandidate(userRow, a.row, config) - scoreCandidate(userRow, b.row, config));
    const best = candidates[0];
    const tDiff = timestampDifferenceSeconds(userRow.normalized.timestamp, best.row.normalized.timestamp);
    const qDiff = quantityDifferencePercent(userRow.normalized.quantity, best.row.normalized.quantity);

    if (exactMatch(userRow, best.row, config)) {
      exchangeUsed.add(best.idx);
      report.push({
        category: 'matched',
        reason: `within tolerance: timestamp diff ${tDiff.toFixed(2)}s, quantity diff ${qDiff.toFixed(6)}%`,
        user: userRow,
        exchange: best.row
      });
    } else {
      exchangeUsed.add(best.idx);
      report.push({
        category: 'conflicting',
        reason: buildCandidateReason(userRow, best.row, config),
        user: userRow,
        exchange: best.row
      });
    }
  }

  exchangeRows.forEach((row, idx) => {
    if (exchangeUsed.has(idx)) return;
    report.push({
      category: 'unmatched_exchange',
      reason: row.validForMatching ? 'no candidate found in user file' : row.issues.join('; ') || 'invalid exchange row',
      user: null,
      exchange: row
    });
  });

  return report;
}

module.exports = { reconcileRows };
