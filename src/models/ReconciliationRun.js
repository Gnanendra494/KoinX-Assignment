const mongoose = require('mongoose');

const reconciliationRunSchema = new mongoose.Schema({
  status: { type: String, enum: ['running', 'completed', 'failed'], default: 'running' },
  userFileName: String,
  exchangeFileName: String,
  config: mongoose.Schema.Types.Mixed,
  counts: {
    matched: { type: Number, default: 0 },
    conflicting: { type: Number, default: 0 },
    unmatchedUser: { type: Number, default: 0 },
    unmatchedExchange: { type: Number, default: 0 }
  },
  reportPath: String,
  unmatchedPath: String,
  qualityIssuesPath: String,
  errorMessage: String
}, { timestamps: true });

module.exports = mongoose.model('ReconciliationRun', reconciliationRunSchema);
