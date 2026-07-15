const mongoose = require('mongoose');

const activityEntrySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        'note',
        'whatsapp',
        'email',
        'call',
        'meeting',
        'status_change',
        'proposal',
        'system',
      ],
      required: true,
    },
    message: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const websiteAnalysisSchema = new mongoose.Schema(
  {
    analyzed: { type: Boolean, default: false },
    hasSSL: { type: Boolean, default: false },
    isMobileFriendly: { type: Boolean, default: false },
    hasContactForm: { type: Boolean, default: false },
    hasWhatsAppButton: { type: Boolean, default: false },
    socialLinks: {
      facebook: String,
      instagram: String,
      linkedin: String,
      twitter: String,
      youtube: String,
    },
    metaTitle: { type: String, default: '' },
    metaDescription: { type: String, default: '' },
    loadTimeMs: { type: Number, default: 0 },
    technologies: { type: [String], default: [] },
    score: { type: Number, default: 0, min: 0, max: 100 },
    analyzedAt: { type: Date },
    error: { type: String, default: '' },
  },
  { _id: false }
);

const leadSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
      index: true,
    },
    businessName: { type: String, required: true, trim: true },
    category: { type: String, default: 'Uncategorized', trim: true },
    ownerName: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    website: { type: String, default: '' },
    address: { type: String, default: '' },
    city: { type: String, default: '', index: true },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    googleMapsUrl: { type: String, default: '' },
    location: {
      lat: { type: Number },
      lng: { type: Number },
    },
    websiteAnalysis: { type: websiteAnalysisSchema, default: () => ({}) },
    priority: {
      type: String,
      enum: ['High', 'Medium', 'Low'],
      default: 'Medium',
    },
    leadSource: {
      type: String,
      enum: ['google_maps_scraper', 'manual', 'import', 'referral', 'other'],
      default: 'manual',
    },
    status: { type: String, default: 'New Lead', index: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String, default: '' },
    tags: { type: [String], default: [] },
    activityLog: { type: [activityEntrySchema], default: [] },
    lastActivityAt: { type: Date, default: Date.now },
    dealValue: { type: Number, default: 0 },
    lostReason: { type: String, default: '' },
    scrapeJob: { type: mongoose.Schema.Types.ObjectId, ref: 'ScrapeJob' },
  },
  { timestamps: true }
);

// Compound indexes scoped by tenant for fast filtering/search
leadSchema.index({ company: 1, status: 1 });
leadSchema.index({ company: 1, category: 1 });
leadSchema.index({ company: 1, priority: 1 });
leadSchema.index({ company: 1, assignedTo: 1 });
leadSchema.index({ company: 1, createdAt: -1 });
// Prevent duplicate businesses per tenant (same name + address combo)
leadSchema.index(
  { company: 1, businessName: 1, address: 1 },
  { unique: false }
);
leadSchema.index({ businessName: 'text', category: 'text', city: 'text', address: 'text' });

module.exports = mongoose.model('Lead', leadSchema);
