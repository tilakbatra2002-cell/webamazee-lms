const express = require('express');
const {
  getLeads,
  getLead,
  createLead,
  updateLead,
  deleteLead,
  bulkDelete,
  bulkAssign,
  addActivity,
  sendWhatsApp,
  sendLeadEmail,
  markLead,
  getFilterMeta,
} = require('../controllers/leadController');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

router.get('/filters/meta', getFilterMeta);
router.post('/bulk-delete', bulkDelete);
router.post('/bulk-assign', bulkAssign);

router.route('/').get(getLeads).post(createLead);
router.route('/:id').get(getLead).put(updateLead).delete(deleteLead);

router.post('/:id/activity', addActivity);
router.post('/:id/whatsapp', sendWhatsApp);
router.post('/:id/email', sendLeadEmail);
router.post('/:id/mark', markLead);

module.exports = router;
