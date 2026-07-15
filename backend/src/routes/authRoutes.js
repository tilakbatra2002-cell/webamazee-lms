const express = require('express');
const rateLimit = require('express-rate-limit');
const { registerCompany, login, refresh, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { success: false, message: 'Too many attempts, please try again later' },
});

router.post('/register-company', authLimiter, registerCompany);
router.post('/login', authLimiter, login);
router.post('/refresh', refresh);
router.get('/me', protect, getMe);

module.exports = router;
