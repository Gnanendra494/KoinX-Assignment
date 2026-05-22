const express = require('express');
const {
  triggerRun,
  fetchRun,
  fetchReport,
  fetchCounts,
  fetchUnmatched
} = require('../controllers/reconciliationController');

const router = express.Router();

router.post('/reconcile', triggerRun);
router.get('/runs/:runId', fetchRun);
router.get('/runs/:runId/report', fetchReport);
router.get('/runs/:runId/counts', fetchCounts);
router.get('/runs/:runId/unmatched', fetchUnmatched);

// Backwards-compatible aliases matching assignment spec
router.get('/report/:runId', fetchReport);
router.get('/report/:runId/summary', fetchCounts);
router.get('/report/:runId/unmatched', fetchUnmatched);

module.exports = router;
