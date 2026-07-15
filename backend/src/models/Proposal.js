const mongoose = require('mongoose');

const proposalSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    lead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true, index: true },
    title: { type: String, required: true },
    amount: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' },
    status: {
      type: String,
      enum: ['Pending', 'Sent', 'Accepted', 'Rejected'],
      default: 'Pending',
      index: true,
    },
    fileUrl: { type: String, default: '' },
    fileName: { type: String, default: '' },
    sentAt: { type: Date },
    respondedAt: { type: Date },
    notes: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Proposal', proposalSchema);
