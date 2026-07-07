const express = require('express');
const User = require('../models/User');
const ApiError = require('../utils/apiError');
const { signToken } = require('../utils/tokens');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function publicUser(user) {
  return user.toJSON ? user.toJSON() : user;
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

function validateMobile(mobile) {
  return /^(\+?977[-\s]?)?(97|98)\d{8}$/.test(String(mobile || '').replace(/\s/g, ''));
}

router.post('/register', async (req, res, next) => {
  try {
    const {
      email,
      password,
      fullName,
      full_name,
      mobileNumber,
      mobile_number,
      mobile,
      province,
      district,
    } = req.body;

    const normalizedMobile = mobileNumber || mobile_number || mobile;

    if (!email || !password || !(fullName || full_name) || !normalizedMobile || !province || !district) {
      throw new ApiError(400, 'Full name, email, mobile number, password, province, and district are required');
    }
    if (!validateEmail(email)) {
      throw new ApiError(400, 'Email address must be valid');
    }
    if (!validateMobile(normalizedMobile)) {
      throw new ApiError(400, 'Mobile number must be valid');
    }

    const existing = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { mobileNumber: normalizedMobile }],
    });
    if (existing) {
      throw new ApiError(400, 'A user with this email or mobile number already exists');
    }

    const user = await User.create({
      email,
      passwordHash: await User.hashPassword(password),
      fullName: fullName || full_name,
      mobileNumber: normalizedMobile,
      province,
      district,
      role: 'student',
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      user: publicUser(user),
      accessToken: signToken(user),
      tokenType: 'bearer',
    });
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const email = req.body.email || req.body.username;
    const { password, role } = req.body;

    if (!email || !password) {
      throw new ApiError(400, 'Email and password are required');
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    if (!user || !(await user.comparePassword(password))) {
      throw new ApiError(401, 'Incorrect email or password');
    }

    if (!user.isActive) {
      throw new ApiError(400, 'Inactive user');
    }

    if (role && user.role !== role) {
      throw new ApiError(403, `This account is not registered as ${role}`);
    }

    res.json({
      success: true,
      message: 'Login successful',
      user: publicUser(user),
      accessToken: signToken(user),
      tokenType: 'bearer',
    });
  } catch (error) {
    next(error);
  }
});

router.get('/me', requireAuth, async (req, res) => {
  res.json({ success: true, user: req.user });
});

module.exports = router;
