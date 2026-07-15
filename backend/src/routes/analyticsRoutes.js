const express = require('express');
const { getDashboard, getAnalytics } = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

router.get('/dashboard', getDashboard);
router.get('/analytics', getAnalytics);

module.exports = router;
