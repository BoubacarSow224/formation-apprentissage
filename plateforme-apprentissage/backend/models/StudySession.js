const mongoose = require('mongoose');

const studySessionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Cours' },
  context: { type: String, trim: true },
  startedAt: { type: Date, default: Date.now, required: true },
  endedAt: { type: Date },
  durationMs: { type: Number, default: 0 },
}, { timestamps: true });

// Index for recent queries
studySessionSchema.index({ user: 1, startedAt: -1 });

module.exports = mongoose.model('StudySession', studySessionSchema);
