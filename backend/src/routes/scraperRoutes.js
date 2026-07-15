const express = require('express');
const {
  startScrape,
  stopScrape,
  pauseScrape,
  resumeScrape,
  listJobs,
  getJob,
} = require('../controllers/scraperController');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

router.get('/jobs', listJobs);
router.post('/start', startScrape);
router.post('/:id/stop', stopScrape);
router.post('/:id/pause', pauseScrape);
router.post('/:id/resume', resumeScrape);
router.get('/:id', getJob);

module.exports = router;
