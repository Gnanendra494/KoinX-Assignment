const fs = require('fs');
const path = require('path');
const { stringify } = require('csv-stringify/sync');

function flattenRecord(record) {
  if (!record) {
    return {
      transaction_id: '',
      timestamp: '',
      type: '',
      direction: '',
      asset: '',
      quantity: '',
      price_usd: '',
      fee: '',
      note: '',
      rowNumber: '',
      issues: ''
    };
  }
  return {
    transaction_id: record.normalized.transaction_id ?? '',
    timestamp: record.normalized.timestamp ?? '',
    type: record.normalized.type ?? '',
    direction: record.normalized.direction ?? '',
    asset: record.normalized.asset ?? '',
    quantity: record.normalized.quantity ?? '',
    price_usd: record.normalized.price_usd ?? '',
    fee: record.normalized.fee ?? '',
    note: record.normalized.note ?? '',
    rowNumber: record.rowNumber ?? '',
    issues: (record.issues || []).join('; ')
  };
}

function toReportRows(results) {
  return results.map((item, index) => {
    const user = flattenRecord(item.user);
    const exchange = flattenRecord(item.exchange);
    return {
      index: index + 1,
      category: item.category,
      reason: item.reason,
      user_transaction_id: user.transaction_id,
      user_timestamp: user.timestamp,
      user_type: user.type,
      user_direction: user.direction,
      user_asset: user.asset,
      user_quantity: user.quantity,
      user_price_usd: user.price_usd,
      user_fee: user.fee,
      user_note: user.note,
      user_row_number: user.rowNumber,
      user_issues: user.issues,
      exchange_transaction_id: exchange.transaction_id,
      exchange_timestamp: exchange.timestamp,
      exchange_type: exchange.type,
      exchange_direction: exchange.direction,
      exchange_asset: exchange.asset,
      exchange_quantity: exchange.quantity,
      exchange_price_usd: exchange.price_usd,
      exchange_fee: exchange.fee,
      exchange_note: exchange.note,
      exchange_row_number: exchange.rowNumber,
      exchange_issues: exchange.issues
    };
  });
}

function generateCsvReport(results, outputDir, runId) {
  const rows = toReportRows(results);
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  const reportPath = path.join(outputDir, `${runId}-reconciliation-report.csv`);
  const csv = stringify(rows, { header: true });
  fs.writeFileSync(reportPath, csv, 'utf8');
  return { reportPath, rows };
}

function generateUnmatchedCsv(results, outputDir, runId) {
  const rows = toReportRows(results).filter(r => r.category.startsWith('unmatched'));
  const unmatchedPath = path.join(outputDir, `${runId}-unmatched-only.csv`);
  const csv = stringify(rows, { header: true });
  fs.writeFileSync(unmatchedPath, csv, 'utf8');
  return { unmatchedPath, rows };
}

function generateQualityIssuesCsv(issues, outputDir, runId) {
  const qualityIssuesPath = path.join(outputDir, `${runId}-quality-issues.csv`);
  const csv = stringify(issues, { header: true });
  fs.writeFileSync(qualityIssuesPath, csv, 'utf8');
  return { qualityIssuesPath };
}

module.exports = { generateCsvReport, generateUnmatchedCsv, generateQualityIssuesCsv, toReportRows };
