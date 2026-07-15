const asyncHandler = require('express-async-handler');
const FollowUp = require('../models/FollowUp');
const Lead = require('../models/Lead');

function dayBounds(date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

// @desc List follow-ups grouped by bucket: today, tomorrow, this_week, overdue, completed
// @route GET /api/followups
const getFollowUps = asyncHandler(async (req, res) => {
  const now = new Date();
  const { start: todayStart, end: todayEnd } = dayBounds(now);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const { start: tomorrowStart, end: tomorrowEnd } = dayBounds(tomorrow);
  const weekEnd = new Date(now);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const base = { company: req.companyId };

  const [overdue, today, tomorrowList, thisWeek, completed] = await Promise.all([
    FollowUp.find({ ...base, status: 'pending', dueDate: { $lt: todayStart } })
      .populate('lead', 'businessName phone')
      .sort('dueDate'),
    FollowUp.find({ ...base, status: 'pending', dueDate: { $gte: todayStart, $lte: todayEnd } })
      .populate('lead', 'businessName phone')
      .sort('dueDate'),
    FollowUp.find({ ...base, status: 'pending', dueDate: { $gte: tomorrowStart, $lte: tomorrowEnd } })
      .populate('lead', 'businessName phone')
      .sort('dueDate'),
    FollowUp.find({
      ...base,
      status: 'pending',
      dueDate: { $gt: tomorrowEnd, $lte: weekEnd },
    })
      .populate('lead', 'businessName phone')
      .sort('dueDate'),
    FollowUp.find({ ...base, status: 'completed' })
      .populate('lead', 'businessName phone')
      .sort('-updatedAt')
      .limit(50),
  ]);

  res.json({
    success: true,
    data: { overdue, today, tomorrow: tomorrowList, thisWeek, completed },
  });
});

// @desc Create follow-up
// @route POST /api/followups
const createFollowUp = asyncHandler(async (req, res) => {
  const lead = await Lead.findOne({ _id: req.body.lead, company: req.companyId });
  if (!lead) {
    res.status(404);
    throw new Error('Lead not found');
  }
  const followUp = await FollowUp.create({
    ...req.body,
    company: req.companyId,
    createdBy: req.user._id,
  });
  res.status(201).json({ success: true, data: followUp });
});

// @desc Update follow-up (mark complete, reschedule)
// @route PUT /api/followups/:id
const updateFollowUp = asyncHandler(async (req, res) => {
  const followUp = await FollowUp.findOne({ _id: req.params.id, company: req.companyId });
  if (!followUp) {
    res.status(404);
    throw new Error('Follow-up not found');
  }
  Object.assign(followUp, req.body);
  await followUp.save();
  res.json({ success: true, data: followUp });
});

// @desc Delete follow-up
// @route DELETE /api/followups/:id
const deleteFollowUp = asyncHandler(async (req, res) => {
  const followUp = await FollowUp.findOneAndDelete({ _id: req.params.id, company: req.companyId });
  if (!followUp) {
    res.status(404);
    throw new Error('Follow-up not found');
  }
  res.json({ success: true, message: 'Follow-up deleted' });
});

module.exports = { getFollowUps, createFollowUp, updateFollowUp, deleteFollowUp };
