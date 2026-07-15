const asyncHandler = require('express-async-handler');
const Lead = require('../models/Lead');
const Company = require('../models/Company');

// @desc Get leads grouped by pipeline stage for Kanban board
// @route GET /api/pipeline
const getPipeline = asyncHandler(async (req, res) => {
  const company = await Company.findById(req.companyId);
  const stages = company.settings.leadStatuses;

  const leads = await Lead.find({ company: req.companyId })
    .select('businessName phone email priority status dealValue assignedTo updatedAt')
    .populate('assignedTo', 'name')
    .sort('-updatedAt')
    .limit(1000);

  const grouped = stages.reduce((acc, stage) => {
    acc[stage] = leads.filter((l) => l.status === stage);
    return acc;
  }, {});

  res.json({ success: true, data: { stages, grouped } });
});

// @desc Move a lead to a different pipeline stage (drag and drop)
// @route PATCH /api/pipeline/:leadId/move
const moveLead = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const lead = await Lead.findOne({ _id: req.params.leadId, company: req.companyId });
  if (!lead) {
    res.status(404);
    throw new Error('Lead not found');
  }
  const prevStatus = lead.status;
  lead.status = status;
  lead.activityLog.push({
    type: 'status_change',
    message: `Moved from "${prevStatus}" to "${status}" via pipeline board`,
    user: req.user._id,
  });
  lead.lastActivityAt = new Date();
  await lead.save();
  res.json({ success: true, data: lead });
});

module.exports = { getPipeline, moveLead };
