const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    lead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true, index: true },
    title: { type: String, required: true },
    scheduledAt: { type: Date, required: true, index: true },
    durationMinutes: { type: Number, default: 30 },
    mode: { type: String, enum: ['call', 'video', 'in_person'], default: 'video' },
    requirements: { type: String, default: '' },
    budget: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled', 'no_show', 'rescheduled'],
      default: 'scheduled',
      index: true,
    },
    notes: { type: String, default: '' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

meetingSchema.index({ company: 1, scheduledAt: 1 });

module.exports = mongoose.model('Meeting', meetingSchema);
