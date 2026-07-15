const asyncHandler = require('express-async-handler');
const Company = require('../models/Company');

// @desc Get company settings
// @route GET /api/settings
const getSettings = asyncHandler(async (req, res) => {
  const company = await Company.findById(req.companyId);
  res.json({ success: true, data: company });
});

// @desc Update company profile (name, logo, address, currency etc.)
// @route PUT /api/settings/profile
const updateProfile = asyncHandler(async (req, res) => {
  const company = await Company.findById(req.companyId);
  const allowed = ['name', 'logoUrl', 'industry', 'website', 'phone', 'address', 'timezone', 'currency'];
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) company[field] = req.body[field];
  });
  await company.save();
  res.json({ success: true, data: company });
});

// @desc Update lead statuses (pipeline stages)
// @route PUT /api/settings/statuses
const updateStatuses = asyncHandler(async (req, res) => {
  const { statuses } = req.body;
  if (!Array.isArray(statuses) || statuses.length === 0) {
    res.status(400);
    throw new Error('statuses must be a non-empty array');
  }
  const company = await Company.findById(req.companyId);
  company.settings.leadStatuses = statuses;
  await company.save();
  res.json({ success: true, data: company.settings.leadStatuses });
});

// @desc Update lead categories
// @route PUT /api/settings/categories
const updateCategories = asyncHandler(async (req, res) => {
  const { categories } = req.body;
  if (!Array.isArray(categories)) {
    res.status(400);
    throw new Error('categories must be an array');
  }
  const company = await Company.findById(req.companyId);
  company.settings.leadCategories = categories;
  await company.save();
  res.json({ success: true, data: company.settings.leadCategories });
});

// @desc Create/update an email template
// @route POST /api/settings/email-templates
const upsertEmailTemplate = asyncHandler(async (req, res) => {
  const { name, subject, body } = req.body;
  const company = await Company.findById(req.companyId);
  const existing = company.settings.emailTemplates.find((t) => t.name === name);
  if (existing) {
    existing.subject = subject;
    existing.body = body;
  } else {
    company.settings.emailTemplates.push({ name, subject, body });
  }
  await company.save();
  res.json({ success: true, data: company.settings.emailTemplates });
});

// @desc Delete email template
// @route DELETE /api/settings/email-templates/:name
const deleteEmailTemplate = asyncHandler(async (req, res) => {
  const company = await Company.findById(req.companyId);
  company.settings.emailTemplates = company.settings.emailTemplates.filter(
    (t) => t.name !== req.params.name
  );
  await company.save();
  res.json({ success: true, data: company.settings.emailTemplates });
});

// @desc Create/update a WhatsApp template
// @route POST /api/settings/whatsapp-templates
const upsertWhatsAppTemplate = asyncHandler(async (req, res) => {
  const { name, body } = req.body;
  const company = await Company.findById(req.companyId);
  const existing = company.settings.whatsappTemplates.find((t) => t.name === name);
  if (existing) {
    existing.body = body;
  } else {
    company.settings.whatsappTemplates.push({ name, body });
  }
  await company.save();
  res.json({ success: true, data: company.settings.whatsappTemplates });
});

// @desc Delete WhatsApp template
// @route DELETE /api/settings/whatsapp-templates/:name
const deleteWhatsAppTemplate = asyncHandler(async (req, res) => {
  const company = await Company.findById(req.companyId);
  company.settings.whatsappTemplates = company.settings.whatsappTemplates.filter(
    (t) => t.name !== req.params.name
  );
  await company.save();
  res.json({ success: true, data: company.settings.whatsappTemplates });
});

module.exports = {
  getSettings,
  updateProfile,
  updateStatuses,
  updateCategories,
  upsertEmailTemplate,
  deleteEmailTemplate,
  upsertWhatsAppTemplate,
  deleteWhatsAppTemplate,
};
