const express = require('express');
const { getPipeline, moveLead } = require('../controllers/pipelineController');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

router.get('/', getPipeline);
router.patch('/:leadId/move', moveLead);

module.exports = router;
