const asyncHandler = require('express-async-handler');
const Meeting = require('../models/Meeting');
const Lead = require('../models/Lead');
const { paginate, buildMeta } = require('../utils/paginate');

// @desc List meetings (optionally filtered by date range/status)
// @route GET /api/meetings
const getMeetings = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query);
  const { status, from, to, assignedTo } = req.query;

  const filter = { company: req.companyId };
  if (status) filter.status = status;
  if (assignedTo) filter.assignedTo = assignedTo;
  if (from || to) {
    filter.scheduledAt = {};
    if (from) filter.scheduledAt.$gte = new Date(from);
    if (to) filter.scheduledAt.$lte = new Date(to);
  }

  const [meetings, total] = await Promise.all([
    Meeting.find(filter)
      .populate('lead', 'businessName phone email')
      .populate('assignedTo', 'name')
      .sort('scheduledAt')
      .skip(skip)
      .limit(limit),
    Meeting.countDocuments(filter),
  ]);

  res.json({ success: true, data: meetings, meta: buildMeta(total, page, limit) });
});

// @desc Get single meeting
// @route GET /api/meetings/:id
const getMeeting = asyncHandler(async (req, res) => {
  const meeting = await Meeting.findOne({ _id: req.params.id, company: req.companyId })
    .populate('lead')
    .populate('assignedTo', 'name');
  if (!meeting) {
    res.status(404);
    throw new Error('Meeting not found');
  }
  res.json({ success: true, data: meeting });
});

// @desc Create meeting (also books it on the lead + logs activity + updates lead status)
// @route POST /api/meetings
const createMeeting = asyncHandler(async (req, res) => {
  const { lead: leadId } = req.body;
  const lead = await Lead.findOne({ _id: leadId, company: req.companyId });
  if (!lead) {
    res.status(404);
    throw new Error('Lead not found');
  }

  const meeting = await Meeting.create({
    ...req.body,
    company: req.companyId,
    createdBy: req.user._id,
  });

  lead.status = 'Meeting Scheduled';
  lead.activityLog.push({
    type: 'meeting',
    message: `Meeting "${meeting.title}" scheduled for ${new Date(meeting.scheduledAt).toLocaleString()}`,
    user: req.user._id,
  });
  lead.lastActivityAt = new Date();
  await lead.save();

  res.status(201).json({ success: true, data: meeting });
});

// @desc Update meeting
// @route PUT /api/meetings/:id
const updateMeeting = asyncHandler(async (req, res) => {
  const meeting = await Meeting.findOne({ _id: req.params.id, company: req.companyId });
  if (!meeting) {
    res.status(404);
    throw new Error('Meeting not found');
  }
  Object.assign(meeting, req.body);
  await meeting.save();

  if (req.body.status === 'completed') {
    const lead = await Lead.findOne({ _id: meeting.lead, company: req.companyId });
    if (lead) {
      lead.activityLog.push({
        type: 'meeting',
        message: `Meeting "${meeting.title}" marked completed`,
        user: req.user._id,
      });
      lead.lastActivityAt = new Date();
      await lead.save();
    }
  }

  res.json({ success: true, data: meeting });
});

// @desc Delete meeting
// @route DELETE /api/meetings/:id
const deleteMeeting = asyncHandler(async (req, res) => {
  const meeting = await Meeting.findOneAndDelete({ _id: req.params.id, company: req.companyId });
  if (!meeting) {
    res.status(404);
    throw new Error('Meeting not found');
  }
  res.json({ success: true, message: 'Meeting deleted' });
});

module.exports = { getMeetings, getMeeting, createMeeting, updateMeeting, deleteMeeting };
