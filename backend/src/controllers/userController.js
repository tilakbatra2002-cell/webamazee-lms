const asyncHandler = require('express-async-handler');
const User = require('../models/User');

// @desc List all users in the tenant
// @route GET /api/users
const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({ company: req.companyId }).sort('name');
  res.json({ success: true, data: users });
});

// @desc Create a new user in the tenant (admin only)
// @route POST /api/users
const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, phone } = req.body;
  const exists = await User.findOne({ company: req.companyId, email: email.toLowerCase() });
  if (exists) {
    res.status(400);
    throw new Error('A user with this email already exists in your company');
  }
  const user = await User.create({
    company: req.companyId,
    name,
    email: email.toLowerCase(),
    password,
    role: role || 'outreach_manager',
    phone,
  });
  res.status(201).json({
    success: true,
    data: { id: user._id, name: user.name, email: user.email, role: user.role },
  });
});

// @desc Update user (admin only, or self for profile/theme fields)
// @route PUT /api/users/:id
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findOne({ _id: req.params.id, company: req.companyId });
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const isSelf = user._id.toString() === req.user._id.toString();
  if (!isSelf && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Only admins can edit other users');
  }

  const allowedFields = isSelf
    ? ['name', 'phone', 'avatarUrl', 'theme', 'password']
    : ['name', 'phone', 'avatarUrl', 'theme', 'role', 'isActive'];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) user[field] = req.body[field];
  });

  await user.save();
  res.json({
    success: true,
    data: { id: user._id, name: user.name, email: user.email, role: user.role, theme: user.theme },
  });
});

// @desc Deactivate/delete a user (admin only)
// @route DELETE /api/users/:id
const deleteUser = asyncHandler(async (req, res) => {
  if (req.params.id === req.user._id.toString()) {
    res.status(400);
    throw new Error('You cannot delete your own account');
  }
  const user = await User.findOneAndDelete({ _id: req.params.id, company: req.companyId });
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  res.json({ success: true, message: 'User removed' });
});

module.exports = { getUsers, createUser, updateUser, deleteUser };
