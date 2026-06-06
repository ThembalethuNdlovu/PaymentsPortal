const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const Employee = require('../models/Employee');
const ExpressBrute = require('express-brute');

const store = new ExpressBrute.MemoryStore();
const bruteforce = new ExpressBrute(store, {
  freeRetries: process.env.NODE_ENV === 'test' ? 1000 : 5,
  minWait: process.env.NODE_ENV === 'test' ? 0 : 5 * 60 * 1000,
  maxWait: process.env.NODE_ENV === 'test' ? 0 : 60 * 60 * 1000,
  failCallback: (req, res, next, nextValidRequestDate) => {
    res.status(429).json({
      message: `Too many failed attempts. Try again after ${nextValidRequestDate}`
    });
  }
});

// ─── Input Validation Rules ───────────────────────────────────
const loginValidation = [
  body('username')
    .trim()
    .matches(/^[a-zA-Z0-9_]{3,20}$/)
    .withMessage('Invalid username'),

  body('password')
    .trim()
    .notEmpty()
    .withMessage('Password is required')
];

// ─── Employee Login ───────────────────────────────────────────
// POST /api/employee/login
router.post('/login', bruteforce.prevent, loginValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password } = req.body;

  try {
    // Find employee by username
    const sanitizedUsername = username.replace(/[^a-zA-Z0-9_]/g, '');
    const employee = await Employee.findOne({ username: sanitizedUsername });

    if (!employee) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Compare password with hashed password
    const isMatch = await employee.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: employee._id, username: employee.username, role: employee.role },
      process.env.JWT_EMPLOYEE_SECRET,
      { expiresIn: '8h' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      employee: {
        id: employee._id,
        fullName: employee.fullName,
        username: employee.username,
        role: employee.role
      }
    });

  } catch (error) {
    console.error('Employee login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

module.exports = router;