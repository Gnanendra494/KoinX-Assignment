const fs = require('fs');
const ReconciliationRun = require('../models/ReconciliationRun');
const { ingestFile } = require('./ingestionService');
const { reconcileRows } = require('./matchingService');
const { generateCsvReport, generateUnmatchedCsv, generateQualityIssuesCsv } = require('./reportService');

async function runReconciliation({ userFilePath, exchangeFilePath, userFileName, exchangeFileName, config }) {
  const run = await ReconciliationRun.create({
    status: 'running',
    userFileName,
    exchangeFileName,
    config
  });

  try {
    const userResult = await ingestFile({ runId: run._id, source: 'user', filePath: userFilePath });
    const exchangeResult = await ingestFile({ runId: run._id, source: 'exchange', filePath: exchangeFilePath });

    const reportResults = reconcileRows(userResult.rows, exchangeResult.rows, config);

    const counts = {
      matched: reportResults.filter(x => x.category === 'matched').length,
      conflicting: reportResults.filter(x => x.category === 'conflicting').length,
      unmatchedUser: reportResults.filter(x => x.category === 'unmatched_user').length,
      unmatchedExchange: reportResults.filter(x => x.category === 'unmatched_exchange').length
    };

    const outputDir = config.outputDir || 'reports';
    const { reportPath } = generateCsvReport(reportResults, outputDir, String(run._id));
    const { unmatchedPath } = generateUnmatchedCsv(reportResults, outputDir, String(run._id));
    const { qualityIssuesPath } = generateQualityIssuesCsv(
      [...userResult.qualityIssues, ...exchangeResult.qualityIssues],
      outputDir,
      String(run._id)
    );

    await ReconciliationRun.findByIdAndUpdate(run._id, {
      status: 'completed',
      counts,
      reportPath,
      unmatchedPath,
      qualityIssuesPath
    });

    return { runId: run._id.toString(), counts, reportPath, unmatchedPath, qualityIssuesPath, reportResults };
  } catch (error) {
    await ReconciliationRun.findByIdAndUpdate(run._id, {
      status: 'failed',
      errorMessage: error.message
    });
    throw error;
  }
}

async function getRun(runId) {
  return ReconciliationRun.findById(runId).lean();
}

async function getReport(runId) {
  const run = await ReconciliationRun.findById(runId).lean();
  if (!run || !run.reportPath || !fs.existsSync(run.reportPath)) return null;
  return fs.readFileSync(run.reportPath, 'utf8');
}

async function getUnmatched(runId) {
  const run = await ReconciliationRun.findById(runId).lean();
  if (!run || !run.unmatchedPath || !fs.existsSync(run.unmatchedPath)) return null;
  return fs.readFileSync(run.unmatchedPath, 'utf8');
}

module.exports = { runReconciliation, getRun, getReport, getUnmatched };
