const asyncHandler = require('express-async-handler');
const path = require('path');
const fs = require('fs');
const Proposal = require('../models/Proposal');
const Lead = require('../models/Lead');
const { paginate, buildMeta } = require('../utils/paginate');

// @desc List proposals
// @route GET /api/proposals
const getProposals = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query);
  const { status, lead } = req.query;
  const filter = { company: req.companyId };
  if (status) filter.status = status;
  if (lead) filter.lead = lead;

  const [proposals, total] = await Promise.all([
    Proposal.find(filter)
      .populate('lead', 'businessName phone email')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit),
    Proposal.countDocuments(filter),
  ]);

  res.json({ success: true, data: proposals, meta: buildMeta(total, page, limit) });
});

// @desc Get single proposal
// @route GET /api/proposals/:id
const getProposal = asyncHandler(async (req, res) => {
  const proposal = await Proposal.findOne({ _id: req.params.id, company: req.companyId }).populate(
    'lead'
  );
  if (!proposal) {
    res.status(404);
    throw new Error('Proposal not found');
  }
  res.json({ success: true, data: proposal });
});

// @desc Create proposal (with optional PDF upload via multer)
// @route POST /api/proposals
const createProposal = asyncHandler(async (req, res) => {
  const { lead: leadId, title, amount, currency, notes } = req.body;
  const lead = await Lead.findOne({ _id: leadId, company: req.companyId });
  if (!lead) {
    res.status(404);
    throw new Error('Lead not found');
  }

  const proposal = await Proposal.create({
    company: req.companyId,
    lead: leadId,
    title,
    amount,
    currency,
    notes,
    fileUrl: req.file ? `/uploads/proposals/${req.file.filename}` : '',
    fileName: req.file ? req.file.originalname : '',
    createdBy: req.user._id,
  });

  lead.activityLog.push({
    type: 'proposal',
    message: `Proposal "${title}" created`,
    user: req.user._id,
  });
  lead.lastActivityAt = new Date();
  await lead.save();

  res.status(201).json({ success: true, data: proposal });
});

// @desc Update proposal (status transitions: Pending -> Sent -> Accepted/Rejected)
// @route PUT /api/proposals/:id
const updateProposal = asyncHandler(async (req, res) => {
  const proposal = await Proposal.findOne({ _id: req.params.id, company: req.companyId });
  if (!proposal) {
    res.status(404);
    throw new Error('Proposal not found');
  }

  const prevStatus = proposal.status;
  Object.assign(proposal, req.body);

  if (req.file) {
    proposal.fileUrl = `/uploads/proposals/${req.file.filename}`;
    proposal.fileName = req.file.originalname;
  }

  if (req.body.status && req.body.status !== prevStatus) {
    if (req.body.status === 'Sent') proposal.sentAt = new Date();
    if (['Accepted', 'Rejected'].includes(req.body.status)) proposal.respondedAt = new Date();

    const lead = await Lead.findOne({ _id: proposal.lead, company: req.companyId });
    if (lead) {
      lead.activityLog.push({
        type: 'proposal',
        message: `Proposal "${proposal.title}" status changed to "${req.body.status}"`,
        user: req.user._id,
      });
      if (req.body.status === 'Sent') lead.status = 'Proposal Sent';
      if (req.body.status === 'Accepted') lead.status = 'Won';
      if (req.body.status === 'Rejected') lead.status = 'Lost';
      lead.lastActivityAt = new Date();
      await lead.save();
    }
  }

  await proposal.save();
  res.json({ success: true, data: proposal });
});

// @desc Delete proposal
// @route DELETE /api/proposals/:id
const deleteProposal = asyncHandler(async (req, res) => {
  const proposal = await Proposal.findOneAndDelete({ _id: req.params.id, company: req.companyId });
  if (!proposal) {
    res.status(404);
    throw new Error('Proposal not found');
  }
  if (proposal.fileUrl) {
    const filePath = path.join(__dirname, '..', '..', proposal.fileUrl);
    fs.unlink(filePath, () => {});
  }
  res.json({ success: true, message: 'Proposal deleted' });
});

// @desc Download proposal PDF
// @route GET /api/proposals/:id/download
const downloadProposal = asyncHandler(async (req, res) => {
  const proposal = await Proposal.findOne({ _id: req.params.id, company: req.companyId });
  if (!proposal || !proposal.fileUrl) {
    res.status(404);
    throw new Error('Proposal file not found');
  }
  const filePath = path.join(__dirname, '..', '..', proposal.fileUrl);
  if (!fs.existsSync(filePath)) {
    res.status(404);
    throw new Error('File missing on server');
  }
  res.download(filePath, proposal.fileName || 'proposal.pdf');
});

module.exports = {
  getProposals,
  getProposal,
  createProposal,
  updateProposal,
  deleteProposal,
  downloadProposal,
};
