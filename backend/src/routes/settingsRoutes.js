const express = require('express');
const {
  getSettings,
  updateProfile,
  updateStatuses,
  updateCategories,
  upsertEmailTemplate,
  deleteEmailTemplate,
  upsertWhatsAppTemplate,
  deleteWhatsAppTemplate,
} = require('../controllers/settingsController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

router.get('/', getSettings);
router.put('/profile', authorize('admin'), updateProfile);
router.put('/statuses', authorize('admin'), updateStatuses);
router.put('/categories', authorize('admin'), updateCategories);
router.post('/email-templates', authorize('admin'), upsertEmailTemplate);
router.delete('/email-templates/:name', authorize('admin'), deleteEmailTemplate);
router.post('/whatsapp-templates', authorize('admin'), upsertWhatsAppTemplate);
router.delete('/whatsapp-templates/:name', authorize('admin'), deleteWhatsAppTemplate);

module.exports = router;
