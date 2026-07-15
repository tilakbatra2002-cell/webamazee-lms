const mongoose = require('mongoose');

const scrapeJobSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    keyword: { type: String, required: true },
    location: { type: String, required: true },
    maxLeads: { type: Number, required: true, min: 1, max: 500 },
    status: {
      type: String,
      enum: ['queued', 'running', 'paused', 'stopped', 'completed', 'failed'],
      default: 'queued',
      index: true,
    },
    totalFound: { type: Number, default: 0 },
    totalSaved: { type: Number, default: 0 },
    totalDuplicates: { type: Number, default: 0 },
    currentBusiness: { type: String, default: '' },
    startedAt: { type: Date },
    finishedAt: { type: Date },
    avgMsPerLead: { type: Number, default: 4000 },
    errorMessage: { type: String, default: '' },
    // internal scroll/pagination cursor so a "resume" can pick up roughly where it left off
    cursor: { type: Number, default: 0 },
  },
  { timestamps: true }
);

scrapeJobSchema.index({ company: 1, createdAt: -1 });

module.exports = mongoose.model('ScrapeJob', scrapeJobSchema);
