const asyncHandler = require('express-async-handler');
const ScrapeJob = require('../models/ScrapeJob');
const Lead = require('../models/Lead');
const { scrapeGoogleMaps } = require('../utils/mapsScraper');
const { analyzeWebsite, scoreToPriority } = require('../utils/websiteAnalyzer');
const jobControl = require('../utils/jobControl');

// io is attached to the app in server.js and passed down via req.app.get('io')
function emitProgress(io, companyId, jobId, payload) {
  io.to(`company:${companyId}`).emit('scrape:progress', { jobId, ...payload });
}

async function runJob(io, job) {
  jobControl.register(job._id.toString());
  job.status = 'running';
  job.startedAt = new Date();
  await job.save();
  emitProgress(io, job.company.toString(), job._id.toString(), { status: 'running' });

  const startTime = Date.now();
  let processedCount = 0;

  try {
    await scrapeGoogleMaps({
      keyword: job.keyword,
      location: job.location,
      maxLeads: job.maxLeads,
      shouldStop: jobControl.shouldStop(job._id.toString()),
      onResult: async (leadData) => {
        // Duplicate check within this tenant
        const existing = await Lead.findOne({
          company: job.company,
          businessName: leadData.businessName,
          address: leadData.address,
        });

        if (existing) {
          job.totalDuplicates += 1;
        } else {
          // Analyze website inline (best-effort, non-blocking failures)
          let websiteAnalysis = { analyzed: false };
          if (leadData.website) {
            websiteAnalysis = await analyzeWebsite(leadData.website).catch(() => ({
              analyzed: false,
            }));
          }
          const priority = scoreToPriority(websiteAnalysis.score || 0, !!leadData.website);

          await Lead.create({
            company: job.company,
            businessName: leadData.businessName,
            category: leadData.category,
            phone: leadData.phone,
            website: leadData.website,
            address: leadData.address,
            city: job.location,
            rating: leadData.rating,
            reviewCount: leadData.reviewCount,
            googleMapsUrl: leadData.googleMapsUrl,
            location: leadData.location,
            websiteAnalysis,
            priority,
            leadSource: 'google_maps_scraper',
            status: 'New Lead',
            scrapeJob: job._id,
            activityLog: [
              { type: 'system', message: `Scraped via Google Maps scraper (keyword: "${job.keyword}")` },
            ],
          });
          job.totalSaved += 1;
        }

        processedCount += 1;
        job.avgMsPerLead = Math.round((Date.now() - startTime) / processedCount);
        await job.save();
      },
      onProgress: async ({ currentBusiness, totalFound }) => {
        job.currentBusiness = currentBusiness;
        job.totalFound = totalFound;
        await job.save();

        const remaining = Math.max(job.maxLeads - totalFound, 0);
        const etaMs = remaining * job.avgMsPerLead;

        emitProgress(io, job.company.toString(), job._id.toString(), {
          status: 'running',
          currentBusiness,
          totalFound,
          totalSaved: job.totalSaved,
          totalDuplicates: job.totalDuplicates,
          etaSeconds: Math.round(etaMs / 1000),
        });
      },
    });

    const stillRunning = job.status !== 'stopped';
    job.status = stillRunning ? 'completed' : 'stopped';
    job.finishedAt = new Date();
    await job.save();

    emitProgress(io, job.company.toString(), job._id.toString(), {
      status: job.status,
      totalFound: job.totalFound,
      totalSaved: job.totalSaved,
      totalDuplicates: job.totalDuplicates,
    });
  } catch (err) {
    job.status = 'failed';
    job.errorMessage = err.message;
    job.finishedAt = new Date();
    console.log("========== SCRAPER ERROR ==========");
console.error(err);
console.error(err.stack);
console.log("==================================");
    await job.save();
    emitProgress(io, job.company.toString(), job._id.toString(), {
      status: 'failed',
      error: err.message,
    });
  } finally {
    jobControl.clear(job._id.toString());
  }
}

// @desc Start a new scrape job
// @route POST /api/scraper/start
const startScrape = asyncHandler(async (req, res) => {
  const { keyword, location, maxLeads } = req.body;
  if (!keyword || !location || !maxLeads) {
    res.status(400);
    throw new Error('keyword, location and maxLeads are required');
  }

  const job = await ScrapeJob.create({
    company: req.companyId,
    createdBy: req.user._id,
    keyword,
    location,
    maxLeads: Math.min(Number(maxLeads), 500),
  });

  const io = req.app.get('io');
  // fire and forget — progress streamed via socket.io + polling endpoint
  runJob(io, job);

  res.status(201).json({ success: true, data: job });
});

// @desc Stop a running scrape job
// @route POST /api/scraper/:id/stop
const stopScrape = asyncHandler(async (req, res) => {
  const job = await ScrapeJob.findOne({ _id: req.params.id, company: req.companyId });
  if (!job) {
    res.status(404);
    throw new Error('Scrape job not found');
  }
  job.status = 'stopped';
  await job.save();
  jobControl.requestStop(job._id.toString());
  res.json({ success: true, data: job });
});

// @desc Pause a running scrape job
// @route POST /api/scraper/:id/pause
const pauseScrape = asyncHandler(async (req, res) => {
  const job = await ScrapeJob.findOne({ _id: req.params.id, company: req.companyId });
  if (!job) {
    res.status(404);
    throw new Error('Scrape job not found');
  }
  job.status = 'paused';
  await job.save();
  jobControl.requestPause(job._id.toString(), true);
  res.json({ success: true, data: job });
});

// @desc Resume a paused scrape job (resumes in-memory if server hasn't restarted;
//       otherwise starts a fresh job continuing from where totalSaved left off)
// @route POST /api/scraper/:id/resume
const resumeScrape = asyncHandler(async (req, res) => {
  const job = await ScrapeJob.findOne({ _id: req.params.id, company: req.companyId });
  if (!job) {
    res.status(404);
    throw new Error('Scrape job not found');
  }

  if (job.status === 'paused') {
    jobControl.requestPause(job._id.toString(), false);
    job.status = 'running';
    await job.save();
    return res.json({ success: true, data: job, message: 'Resumed in-memory job' });
  }

  // Server restarted / job no longer in memory: spawn a continuation job
  const remaining = Math.max(job.maxLeads - job.totalSaved, 0);
  if (remaining <= 0) {
    res.status(400);
    throw new Error('Job already reached its target lead count');
  }

  const newJob = await ScrapeJob.create({
    company: req.companyId,
    createdBy: req.user._id,
    keyword: job.keyword,
    location: job.location,
    maxLeads: remaining,
  });

  const io = req.app.get('io');
  runJob(io, newJob);

  res.status(201).json({ success: true, data: newJob, message: 'Started continuation job' });
});

// @desc List scrape jobs for this tenant
// @route GET /api/scraper/jobs
const listJobs = asyncHandler(async (req, res) => {
  const jobs = await ScrapeJob.find({ company: req.companyId })
    .sort('-createdAt')
    .limit(50)
    .populate('createdBy', 'name');
  res.json({ success: true, data: jobs });
});

// @desc Get a single job's current status (for polling fallback if sockets unavailable)
// @route GET /api/scraper/:id
const getJob = asyncHandler(async (req, res) => {
  const job = await ScrapeJob.findOne({ _id: req.params.id, company: req.companyId });
  if (!job) {
    res.status(404);
    throw new Error('Scrape job not found');
  }
  res.json({ success: true, data: job });
});

module.exports = { startScrape, stopScrape, pauseScrape, resumeScrape, listJobs, getJob };
