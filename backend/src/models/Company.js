const mongoose = require('mongoose');

/**
 * Company = Tenant.
 * Every other collection stores a `company` ObjectId reference to this model.
 * All queries in the app MUST be scoped by `company` (enforced via tenant middleware).
 */
const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    logoUrl: { type: String, default: '' },
    industry: { type: String, default: '' },
    website: { type: String, default: '' },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    timezone: { type: String, default: 'Asia/Kolkata' },
    currency: { type: String, default: 'INR' },
    plan: {
      type: String,
      enum: ['trial', 'starter', 'pro', 'enterprise'],
      default: 'trial',
    },
    isActive: { type: Boolean, default: true },
    settings: {
      leadStatuses: {
        type: [String],
        default: [
          'New Lead',
          'Contacted',
          'Interested',
          'Meeting Scheduled',
          'Proposal Sent',
          'Negotiation',
          'Won',
          'Lost',
        ],
      },
      leadCategories: { type: [String], default: [] },
      emailTemplates: [
        {
          name: String,
          subject: String,
          body: String,
        },
      ],
      whatsappTemplates: [
        {
          name: String,
          body: String,
        },
      ],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Company', companySchema);
