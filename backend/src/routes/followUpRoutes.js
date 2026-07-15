const express = require('express');
const {
  getFollowUps,
  createFollowUp,
  updateFollowUp,
  deleteFollowUp,
} = require('../controllers/followUpController');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

router.route('/').get(getFollowUps).post(createFollowUp);
router.route('/:id').put(updateFollowUp).delete(deleteFollowUp);

module.exports = router;
