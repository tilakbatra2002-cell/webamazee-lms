const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const Lead = require('../models/Lead');
const Meeting = require('../models/Meeting');
const Proposal = require('../models/Proposal');
const FollowUp = require('../models/FollowUp');

function dayBounds(date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

// @desc Dashboard summary cards + charts
// @route GET /api/dashboard
const getDashboard = asyncHandler(async (req, res) => {
  const companyId = new mongoose.Types.ObjectId(req.companyId);
  const { start: todayStart, end: todayEnd } = dayBounds(new Date());
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [
    totalLeads,
    todaysLeads,
    todaysMeetings,
    pendingFollowups,
    proposalsCount,
    wonDeals,
    lostDeals,
    revenueAgg,
    monthlyLeadsAgg,
    dailyLeadsAgg,
    funnelAgg,
    revenueTrendAgg,
    meetingsTrendAgg,
    todaysOutreach,
  ] = await Promise.all([
    Lead.countDocuments({ company: companyId }),
    Lead.countDocuments({ company: companyId, createdAt: { $gte: todayStart, $lte: todayEnd } }),
    Meeting.countDocuments({ company: companyId, scheduledAt: { $gte: todayStart, $lte: todayEnd } }),
    FollowUp.countDocuments({ company: companyId, status: 'pending' }),
    Proposal.countDocuments({ company: companyId }),
    Lead.countDocuments({ company: companyId, status: 'Won' }),
    Lead.countDocuments({ company: companyId, status: 'Lost' }),
    Proposal.aggregate([
      { $match: { company: companyId, status: 'Accepted' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Lead.countDocuments({ company: companyId, createdAt: { $gte: monthStart } }),
    Lead.aggregate([
      { $match: { company: companyId, createdAt: { $gte: new Date(Date.now() - 13 * 86400000) } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Lead.aggregate([
      { $match: { company: companyId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Proposal.aggregate([
      {
        $match: {
          company: companyId,
          status: 'Accepted',
          respondedAt: { $gte: new Date(Date.now() - 180 * 86400000) },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$respondedAt' } },
          revenue: { $sum: '$amount' },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Meeting.aggregate([
      { $match: { company: companyId, scheduledAt: { $gte: new Date(Date.now() - 13 * 86400000) } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$scheduledAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Lead.countDocuments({
      company: companyId,
      lastActivityAt: { $gte: todayStart, $lte: todayEnd },
      status: { $ne: 'New Lead' },
    }),
  ]);

  const revenue = revenueAgg[0]?.total || 0;
  const conversionRate = totalLeads > 0 ? Number(((wonDeals / totalLeads) * 100).toFixed(1)) : 0;
  const monthlyConversion =
    monthlyLeadsAgg > 0 ? Number(((wonDeals / monthlyLeadsAgg) * 100).toFixed(1)) : 0;

  res.json({
    success: true,
    data: {
      cards: {
        totalLeads,
        todaysLeads,
        todaysOutreach,
        todaysMeetings,
        pendingFollowups,
        proposals: proposalsCount,
        wonDeals,
        lostDeals,
        revenue,
        monthlyConversion,
        conversionRate,
      },
      charts: {
        dailyLeads: dailyLeadsAgg,
        conversionFunnel: funnelAgg,
        revenueTrend: revenueTrendAgg,
        meetingsTrend: meetingsTrendAgg,
      },
    },
  });
});

// @desc Detailed analytics page (top categories, cities, monthly reports)
// @route GET /api/analytics
const getAnalytics = asyncHandler(async (req, res) => {
  const companyId = new mongoose.Types.ObjectId(req.companyId);

  const [
    topCategories,
    topCities,
    monthlyReport,
    proposalRatioAgg,
    totalLeads,
    wonDeals,
    totalMeetings,
    totalProposals,
  ] = await Promise.all([
    Lead.aggregate([
      { $match: { company: companyId } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
    Lead.aggregate([
      { $match: { company: companyId, city: { $ne: '' } } },
      { $group: { _id: '$city', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
    Lead.aggregate([
      { $match: { company: companyId } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          totalLeads: { $sum: 1 },
          won: { $sum: { $cond: [{ $eq: ['$status', 'Won'] }, 1, 0] } },
          lost: { $sum: { $cond: [{ $eq: ['$status', 'Lost'] }, 1, 0] } },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 12 },
    ]),
    Proposal.aggregate([
      { $match: { company: companyId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Lead.countDocuments({ company: companyId }),
    Lead.countDocuments({ company: companyId, status: 'Won' }),
    Meeting.countDocuments({ company: companyId }),
    Proposal.countDocuments({ company: companyId }),
  ]);

  res.json({
    success: true,
    data: {
      topCategories,
      topCities,
      monthlyReport,
      proposalStatusBreakdown: proposalRatioAgg,
      summary: {
        totalLeads,
        conversionRate: totalLeads > 0 ? Number(((wonDeals / totalLeads) * 100).toFixed(1)) : 0,
        totalMeetings,
        totalProposals,
        proposalRatio: totalLeads > 0 ? Number(((totalProposals / totalLeads) * 100).toFixed(1)) : 0,
      },
    },
  });
});

module.exports = { getDashboard, getAnalytics };
