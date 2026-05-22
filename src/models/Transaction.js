const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  runId: { type: mongoose.Schema.Types.ObjectId, ref: 'ReconciliationRun', index: true },
  source: { type: String, enum: ['user', 'exchange'], required: true, index: true },
  rowNumber: Number,
  transactionId: String,
  raw: mongoose.Schema.Types.Mixed,
  normalized: mongoose.Schema.Types.Mixed,
  issues: [String],
  validForMatching: Boolean,
  duplicateGroupKey: String
}, { timestamps: true });

transactionSchema.index({ runId: 1, source: 1, transactionId: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);
