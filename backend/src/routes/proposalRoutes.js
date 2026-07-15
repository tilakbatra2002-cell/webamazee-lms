const express = require('express');
const {
  getProposals,
  getProposal,
  createProposal,
  updateProposal,
  deleteProposal,
  downloadProposal,
} = require('../controllers/proposalController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();
router.use(protect);

router.route('/').get(getProposals).post(upload.single('file'), createProposal);
router
  .route('/:id')
  .get(getProposal)
  .put(upload.single('file'), updateProposal)
  .delete(deleteProposal);
router.get('/:id/download', downloadProposal);

module.exports = router;
