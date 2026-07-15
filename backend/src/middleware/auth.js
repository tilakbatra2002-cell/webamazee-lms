const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Company = require('../models/Company');

/**
 * protect: verifies the JWT, loads the user, and — critically — attaches
 * req.companyId (derived from the token/user, never from the request body/query)
 * so every downstream controller scopes its DB queries to the correct tenant.
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token provided');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    res.status(401);
    throw new Error('Not authorized, token invalid or expired');
  }

  const user = await User.findById(decoded.id).select('-password');
  if (!user || !user.isActive) {
    res.status(401);
    throw new Error('Not authorized, user not found or deactivated');
  }

  const company = await Company.findById(user.company);
  if (!company || !company.isActive) {
    res.status(403);
    throw new Error('Company account is inactive. Contact support.');
  }

  req.user = user;
  req.company = company;
  req.companyId = user.company; // ALWAYS use this to scope queries

  next();
});

/**
 * authorize: role-based access control.
 * usage: authorize('admin') or authorize('admin', 'outreach_manager')
 */
const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    res.status(403);
    throw new Error(`Role '${req.user?.role}' is not permitted to perform this action`);
  }
  next();
};

module.exports = { protect, authorize };
