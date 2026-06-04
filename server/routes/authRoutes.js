const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ─── Input Validation Rules ───────────────────────────────────
const registerValidation = [
  body('fullName')
    .trim()
    .matches(/^[a-zA-Z\s]{2,50}$/)
    .withMessage('Full name must only contain letters and spaces'),

  body('idNumber')
    .trim()
    .matches(/^\d{13}$/)
    .withMessage('ID number must be exactly 13 digits'),

  body('accountNumber')
    .trim()
    .matches(/^\d{10,12}$/)
    .withMessage('Account number must be 10 to 12 digits'),

  body('password')
    .trim()
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .withMessage('Password must be at least 8 characters with uppercase, lowercase, number and special character')
];

const loginValidation = [
  body('accountNumber')
    .trim()
    .matches(/^\d{10,12}$/)
    .withMessage('Invalid account number'),

  body('username')
    .trim()
    .matches(/^[a-zA-Z0-9_]{3,20}$/)
    .withMessage('Invalid username'),

  body('password')
    .trim()
    .notEmpty()
    .withMessage('Password is required')
];

// ─── Register Route ───────────────────────────────────────────
// POST /api/auth/register
router.post('/register', registerValidation, async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { fullName, idNumber, accountNumber, password } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ idNumber }, { accountNumber }]
    });

    if (existingUser) {
      return res.status(400).json({
        message: 'User with this ID number or account number already exists'
      });
    }

    // Create new user - password hashing happens in the model
    const user = await User.create({
      fullName,
      idNumber,
      accountNumber,
      password
    });

    // Generate JWT token
    const token = jwt.sign(
  {
    id: user._id,
    fullName: user.fullName,
    accountNumber: user.accountNumber
  },
  process.env.JWT_SECRET,
  { expiresIn: '1h' }
);

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        accountNumber: user.accountNumber
      }
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// ─── Login Route ──────────────────────────────────────────────
// POST /api/auth/login
router.post('/login', loginValidation, async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, accountNumber, password } = req.body;

  try {
    // Find user by account number
    const user = await User.findOne({ accountNumber });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if username matches full name (used as username)
    const nameMatch = user.fullName.toLowerCase().replace(/\s/g, '') ===
      username.toLowerCase().replace(/\s/g, '');

    if (!nameMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Compare password with hashed password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
  {
    id: user._id,
    fullName: user.fullName,
    accountNumber: user.accountNumber
  },
  process.env.JWT_SECRET,
  { expiresIn: '1h' }
);

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        accountNumber: user.accountNumber
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

module.exports = router;