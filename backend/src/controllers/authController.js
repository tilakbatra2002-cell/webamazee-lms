const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const Company = require('../models/Company');
const User = require('../models/User');
const { generateAccessToken, generateRefreshToken } = require('../utils/generateToken');

/**
 * @desc  Register a brand new tenant (company) + its first admin user
 * @route POST /api/auth/register-company
 * @access Public
 */
const registerCompany = asyncHandler(async (req, res) => {
  console.log("Login Body:", req.body);
  const { companyName, adminName, adminEmail, adminPassword } = req.body;

  if (!companyName || !adminName || !adminEmail || !adminPassword) {
    res.status(400);
    throw new Error('All fields are required');
  }

  const slug = companyName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const existingCompany = await Company.findOne({ slug });
  if (existingCompany) {
    res.status(400);
    throw new Error('A company with a similar name already exists. Please choose another name.');
  }

  const company = await Company.create({ name: companyName, slug });

  const user = await User.create({
    company: company._id,
    name: adminName,
    email: adminEmail.toLowerCase(),
    password: adminPassword,
    role: 'admin',
  });

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  res.status(201).json({
    success: true,
    accessToken,
    refreshToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      theme: user.theme,
    },
    company: {
      id: company._id,
      name: company.name,
      slug: company.slug,
    },
  });
});

/**
 * @desc  Login. Since email is unique PER COMPANY not globally, the user
 *        must supply the company slug so we know which tenant to check.
 * @route POST /api/auth/login
 * @access Public
 */
const login = asyncHandler(async (req, res) => {
  console.log("========== LOGIN ==========");
  console.log("Request Body:", req.body);

  const { companySlug, email, password } = req.body;

  if (!companySlug || !email || !password) {
    res.status(400);
    throw new Error("Company, email and password are required");
  }

  // Find company
  const company = await Company.findOne({
    slug: companySlug.toLowerCase().trim(),
  });

  console.log("Company Found:", company);

  if (!company || !company.isActive) {
    res.status(401);
    throw new Error("Invalid company, email or password");
  }

  // Find user
  const user = await User.findOne({
    company: company._id,
    email: email.toLowerCase().trim(),
  }).select("+password");

  console.log("User Found:", user);

  if (!user) {
    console.log("❌ User not found");
    res.status(401);
    throw new Error("Invalid company, email or password");
  }

  console.log("Stored Hash:", user.password);

  const isMatch = await user.matchPassword(password);

  console.log("Password Match:", isMatch);

  if (!isMatch) {
    console.log("❌ Password incorrect");
    res.status(401);
    throw new Error("Invalid company, email or password");
  }

  user.lastLoginAt = new Date();
  await user.save();

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  console.log("✅ Login Successful");

  res.json({
    success: true,
    accessToken,
    refreshToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      theme: user.theme,
      avatarUrl: user.avatarUrl,
    },
    company: {
      id: company._id,
      name: company.name,
      slug: company.slug,
      logoUrl: company.logoUrl,
    },
  });
});

/**
 * @desc  Refresh access token
 * @route POST /api/auth/refresh
 * @access Public (requires valid refresh token)
 */
const refresh = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    res.status(400);
    throw new Error('Refresh token required');
  }
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch (err) {
    res.status(401);
    throw new Error('Invalid or expired refresh token');
  }
  const user = await User.findById(decoded.id);
  if (!user || !user.isActive) {
    res.status(401);
    throw new Error('User not found or deactivated');
  }
  const accessToken = generateAccessToken(user._id);
  res.json({ success: true, accessToken });
});

/**
 * @desc  Get current logged-in user + company profile
 * @route GET /api/auth/me
 * @access Private
 */
const getMe = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      theme: req.user.theme,
      avatarUrl: req.user.avatarUrl,
    },
    company: {
      id: req.company._id,
      name: req.company.name,
      slug: req.company.slug,
      logoUrl: req.company.logoUrl,
      currency: req.company.currency,
      settings: req.company.settings,
    },
  });
});

module.exports = { registerCompany, login, refresh, getMe };
