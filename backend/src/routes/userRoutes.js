const express = require('express');
const { getUsers, createUser, updateUser, deleteUser } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

router.route('/').get(getUsers).post(authorize('admin'), createUser);
router.route('/:id').put(updateUser).delete(authorize('admin'), deleteUser);

module.exports = router;
