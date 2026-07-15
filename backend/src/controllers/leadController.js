const asyncHandler = require('express-async-handler');
const Lead = require('../models/Lead');
const FollowUp = require('../models/FollowUp');
const { paginate, buildMeta } = require('../utils/paginate');
const { sendEmail } = require('../utils/sendEmail');

// @desc List leads with filters, search, sorting, pagination
// @route GET /api/leads
const getLeads = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query);
  const {
    search,
    category,
    city,
    priority,
    status,
    assignedTo,
    hasWebsite,
    minRating,
    sortBy = '-createdAt',
  } = req.query;

  const filter = { company: req.companyId };

  if (category) filter.category = category;
  if (city) filter.city = new RegExp(city, 'i');
  if (priority) filter.priority = priority;
  if (status) filter.status = status;
  if (assignedTo) filter.assignedTo = assignedTo;
  if (minRating) filter.rating = { $gte: Number(minRating) };
  if (hasWebsite === 'true') filter.website = { $nin: [null, ''] };
  if (hasWebsite === 'false') filter.$or = [{ website: null }, { website: '' }];
  if (search) filter.$text = { $search: search };

  const [leads, total] = await Promise.all([
    Lead.find(filter)
      .populate('assignedTo', 'name email')
      .sort(sortBy)
      .skip(skip)
      .limit(limit),
    Lead.countDocuments(filter),
  ]);

  res.json({ success: true, data: leads, meta: buildMeta(total, page, limit) });
});

// @desc Get single lead
// @route GET /api/leads/:id
const getLead = asyncHandler(async (req, res) => {
  const lead = await Lead.findOne({ _id: req.params.id, company: req.companyId }).populate(
    'assignedTo',
    'name email'
  );
  if (!lead) {
    res.status(404);
    throw new Error('Lead not found');
  }
  res.json({ success: true, data: lead });
});

// @desc Create a manual lead
// @route POST /api/leads
const createLead = asyncHandler(async (req, res) => {
  const lead = await Lead.create({
    ...req.body,
    company: req.companyId,
    leadSource: req.body.leadSource || 'manual',
    activityLog: [
      { type: 'system', message: 'Lead created', user: req.user._id },
    ],
  });
  res.status(201).json({ success: true, data: lead });
});

// @desc Update lead
// @route PUT /api/leads/:id
const updateLead = asyncHandler(async (req, res) => {
  const lead = await Lead.findOne({ _id: req.params.id, company: req.companyId });
  if (!lead) {
    res.status(404);
    throw new Error('Lead not found');
  }

  const prevStatus = lead.status;
  Object.assign(lead, req.body);

  if (req.body.status && req.body.status !== prevStatus) {
    lead.activityLog.push({
      type: 'status_change',
      message: `Status changed from "${prevStatus}" to "${req.body.status}"`,
      user: req.user._id,
    });
  }
  lead.lastActivityAt = new Date();
  await lead.save();

  res.json({ success: true, data: lead });
});

// @desc Delete lead
// @route DELETE /api/leads/:id
const deleteLead = asyncHandler(async (req, res) => {
  const lead = await Lead.findOneAndDelete({ _id: req.params.id, company: req.companyId });
  if (!lead) {
    res.status(404);
    throw new Error('Lead not found');
  }
  await FollowUp.deleteMany({ lead: lead._id, company: req.companyId });
  res.json({ success: true, message: 'Lead deleted' });
});

// @desc Bulk delete
// @route POST /api/leads/bulk-delete
const bulkDelete = asyncHandler(async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    res.status(400);
    throw new Error('No lead IDs provided');
  }
  const result = await Lead.deleteMany({ _id: { $in: ids }, company: req.companyId });
  res.json({ success: true, deletedCount: result.deletedCount });
});

// @desc Bulk assign
// @route POST /api/leads/bulk-assign
const bulkAssign = asyncHandler(async (req, res) => {
  const { ids, assignedTo } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    res.status(400);
    throw new Error('No lead IDs provided');
  }
  const result = await Lead.updateMany(
    { _id: { $in: ids }, company: req.companyId },
    { $set: { assignedTo } }
  );
  res.json({ success: true, modifiedCount: result.modifiedCount });
});

// @desc Add a note / activity entry
// @route POST /api/leads/:id/activity
const addActivity = asyncHandler(async (req, res) => {
  const { type, message } = req.body;
  const lead = await Lead.findOne({ _id: req.params.id, company: req.companyId });
  if (!lead) {
    res.status(404);
    throw new Error('Lead not found');
  }
  lead.activityLog.push({ type: type || 'note', message, user: req.user._id });
  lead.lastActivityAt = new Date();
  await lead.save();
  res.json({ success: true, data: lead });
});

// @desc Generate a WhatsApp click-to-chat link (actual sending happens client-side via WhatsApp Web/App)
// @route POST /api/leads/:id/whatsapp
const sendWhatsApp = asyncHandler(async (req, res) => {
  const { message } = req.body;
  const lead = await Lead.findOne({ _id: req.params.id, company: req.companyId });
  if (!lead) {
    res.status(404);
    throw new Error('Lead not found');
  }
  if (!lead.phone) {
    res.status(400);
    throw new Error('Lead has no phone number');
  }
  const digits = lead.phone.replace(/[^\d]/g, '');
  const waLink = `https://wa.me/${digits}?text=${encodeURIComponent(message || '')}`;

  lead.activityLog.push({
    type: 'whatsapp',
    message: `WhatsApp opened: "${(message || '').slice(0, 120)}"`,
    user: req.user._id,
  });
  lead.status = lead.status === 'New Lead' ? 'Contacted' : lead.status;
  lead.lastActivityAt = new Date();
  await lead.save();

  res.json({ success: true, waLink, data: lead });
});

// @desc Send an email to the lead
// @route POST /api/leads/:id/email
const sendLeadEmail = asyncHandler(async (req, res) => {
  const { subject, body } = req.body;
  const lead = await Lead.findOne({ _id: req.params.id, company: req.companyId });
  if (!lead) {
    res.status(404);
    throw new Error('Lead not found');
  }
  if (!lead.email) {
    res.status(400);
    throw new Error('Lead has no email address');
  }

  try {
    await sendEmail({ to: lead.email, subject, html: body });
  } catch (err) {
    res.status(502);
    throw new Error(`Email failed to send: ${err.message}`);
  }

  lead.activityLog.push({ type: 'email', message: `Email sent: "${subject}"`, user: req.user._id });
  lead.status = lead.status === 'New Lead' ? 'Contacted' : lead.status;
  lead.lastActivityAt = new Date();
  await lead.save();

  res.json({ success: true, data: lead });
});

// @desc Mark called / interested / not interested (simple status shortcuts)
// @route POST /api/leads/:id/mark
const markLead = asyncHandler(async (req, res) => {
  const { action } = req.body; // 'called' | 'interested' | 'not_interested'
  const lead = await Lead.findOne({ _id: req.params.id, company: req.companyId });
  if (!lead) {
    res.status(404);
    throw new Error('Lead not found');
  }

  const map = {
    called: { type: 'call', message: 'Marked as called', status: 'Contacted' },
    interested: { type: 'system', message: 'Marked as interested', status: 'Interested' },
    not_interested: { type: 'system', message: 'Marked as not interested', status: 'Lost' },
  };
  const entry = map[action];
  if (!entry) {
    res.status(400);
    throw new Error('Invalid action');
  }

  lead.activityLog.push({ type: entry.type, message: entry.message, user: req.user._id });
  lead.status = entry.status;
  if (action === 'not_interested') lead.lostReason = req.body.reason || 'Not interested';
  lead.lastActivityAt = new Date();
  await lead.save();

  res.json({ success: true, data: lead });
});

// @desc Get distinct filter values (categories, cities) for the tenant
// @route GET /api/leads/filters/meta
const getFilterMeta = asyncHandler(async (req, res) => {
  const [categories, cities] = await Promise.all([
    Lead.distinct('category', { company: req.companyId }),
    Lead.distinct('city', { company: req.companyId }),
  ]);
  res.json({ success: true, data: { categories, cities } });
});

module.exports = {
  getLeads,
  getLead,
  createLead,
  updateLead,
  deleteLead,
  bulkDelete,
  bulkAssign,
  addActivity,
  sendWhatsApp,
  sendLeadEmail,
  markLead,
  getFilterMeta,
};
