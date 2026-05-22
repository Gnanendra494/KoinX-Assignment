const path = require('path');
const { getBaseConfig } = require('../config');
const { runReconciliation, getRun, getReport, getUnmatched } = require('../services/reconciliationService');

async function triggerRun(req, res, next) {
  try {
    const config = getBaseConfig({
      timestampToleranceSeconds: req.body?.timestampToleranceSeconds,
      quantityTolerancePercent: req.body?.quantityTolerancePercent
    });

    const userFilePath = req.body?.userFilePath || path.join(process.cwd(), 'data', 'user_transactions.csv');
    const exchangeFilePath = req.body?.exchangeFilePath || path.join(process.cwd(), 'data', 'exchange_transactions.csv');

    const result = await runReconciliation({
      userFilePath,
      exchangeFilePath,
      userFileName: path.basename(userFilePath),
      exchangeFileName: path.basename(exchangeFilePath),
      config
    });

    res.status(201).json({
      runId: result.runId,
      counts: result.counts,
      reportPath: result.reportPath,
      unmatchedPath: result.unmatchedPath,
      qualityIssuesPath: result.qualityIssuesPath
    });
  } catch (error) {
    next(error);
  }
}

async function fetchRun(req, res, next) {
  try {
    const run = await getRun(req.params.runId);
    if (!run) return res.status(404).json({ message: 'run not found' });
    res.json(run);
  } catch (error) {
    next(error);
  }
}

async function fetchReport(req, res, next) {
  try {
    const csv = await getReport(req.params.runId);
    if (csv === null) return res.status(404).json({ message: 'report not found' });
    res.type('text/csv').send(csv);
  } catch (error) {
    next(error);
  }
}

async function fetchCounts(req, res, next) {
  try {
    const run = await getRun(req.params.runId);
    if (!run) return res.status(404).json({ message: 'run not found' });
    res.json({ runId: run._id, counts: run.counts, status: run.status });
  } catch (error) {
    next(error);
  }
}

async function fetchUnmatched(req, res, next) {
  try {
    const csv = await getUnmatched(req.params.runId);
    if (csv === null) return res.status(404).json({ message: 'unmatched report not found' });
    res.type('text/csv').send(csv);
  } catch (error) {
    next(error);
  }
}

module.exports = { triggerRun, fetchRun, fetchReport, fetchCounts, fetchUnmatched };
