const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const Transaction = require('../models/Transaction');

// ─── Auth Middleware ──────────────────────────────────────────
const protectCustomer = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: 'Token invalid or expired' });
  }
};

const protectEmployee = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_EMPLOYEE_SECRET);
    req.employee = decoded;
    next();
  } catch {
    return res.status(401).json({ message: 'Token invalid or expired' });
  }
};

// ─── Transaction Validation ───────────────────────────────────
const transactionValidation = [
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),

  body('currency')
    .trim()
    .matches(/^[A-Z]{3}$/)
    .withMessage('Currency must be a valid 3 letter code'),

  body('recipientName')
    .trim()
    .matches(/^[a-zA-Z\s]{2,50}$/)
    .withMessage('Invalid recipient name'),

  body('recipientBank')
    .trim()
    .matches(/^[a-zA-Z\s]{2,100}$/)
    .withMessage('Invalid bank name'),

  body('recipientAccountNumber')
    .trim()
    .matches(/^\d{10,12}$/)
    .withMessage('Recipient account number must be 10 to 12 digits'),

  body('swiftCode')
    .trim()
    .matches(/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/)
    .withMessage('Invalid SWIFT code format')
];

// ─── Create Transaction ───────────────────────────────────────
// POST /api/transactions
router.post('/', protectCustomer, transactionValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    amount, currency, provider,
    recipientName, recipientBank,
    recipientAccountNumber, swiftCode
  } = req.body;

  try {
    const transaction = await Transaction.create({
      customer: req.user.id,
      customerName: req.user.fullName,
      accountNumber: req.user.accountNumber,
      amount,
      currency,
      provider: provider || 'SWIFT',
      recipientName,
      recipientBank,
      recipientAccountNumber,
      swiftCode,
      status: 'Pending'
    });

    res.status(201).json({
      message: 'Transaction submitted successfully',
      transaction
    });

  } catch (error) {
    console.error('Transaction error:', error);
    res.status(500).json({ message: 'Server error creating transaction' });
  }
});

// ─── Get All Transactions (Employee) ─────────────────────────
// GET /api/transactions
router.get('/', protectEmployee, async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate('customer', 'fullName accountNumber')
      .sort({ createdAt: -1 });

    res.status(200).json({ transactions });
  } catch (error) {
    console.error('Fetch transactions error:', error);
    res.status(500).json({ message: 'Server error fetching transactions' });
  }
});

// ─── Verify Transaction (Employee) ───────────────────────────
// PATCH /api/transactions/:id/verify
router.patch('/:id/verify', protectEmployee, async (req, res) => {
  try {
    const transaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      {
        status: 'Verified',
        verifiedBy: req.employee.id,
        verifiedAt: Date.now()
      },
      { new: true }
    );

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.status(200).json({
      message: 'Transaction verified successfully',
      transaction
    });

  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({ message: 'Server error verifying transaction' });
  }
});

// ─── Submit to SWIFT (Employee) ───────────────────────────────
// PATCH /api/transactions/:id/submit
router.patch('/:id/submit', protectEmployee, async (req, res) => {
  try {
    const transaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      { status: 'Submitted' },
      { new: true }
    );

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.status(200).json({
      message: 'Transaction submitted to SWIFT',
      transaction
    });

  } catch (error) {
    console.error('Submit error:', error);
    res.status(500).json({ message: 'Server error submitting transaction' });
  }
});

module.exports = router;