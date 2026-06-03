const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  customerName: {
    type: String,
    required: true,
    match: [/^[a-zA-Z\s]{2,50}$/, 'Invalid customer name']
  },
  accountNumber: {
    type: String,
    required: true,
    match: [/^\d{10,12}$/, 'Account number must be 10 to 12 digits']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than 0']
  },
  currency: {
    type: String,
    required: [true, 'Currency is required'],
    enum: ['USD', 'EUR', 'GBP', 'ZAR', 'JPY', 'AUD', 'CAD'],
    match: [/^[A-Z]{3}$/, 'Currency must be a valid 3 letter code']
  },
  provider: {
    type: String,
    required: [true, 'Provider is required'],
    enum: ['SWIFT'],
    default: 'SWIFT'
  },
  recipientName: {
    type: String,
    required: [true, 'Recipient name is required'],
    match: [/^[a-zA-Z\s]{2,50}$/, 'Invalid recipient name']
  },
  recipientBank: {
    type: String,
    required: [true, 'Recipient bank is required'],
    match: [/^[a-zA-Z\s]{2,100}$/, 'Invalid bank name']
  },
  recipientAccountNumber: {
    type: String,
    required: [true, 'Recipient account number is required'],
    match: [/^\d{10,12}$/, 'Recipient account number must be 10 to 12 digits']
  },
  swiftCode: {
    type: String,
    required: [true, 'SWIFT code is required'],
    match: [/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/, 'Invalid SWIFT code format']
  },
  status: {
    type: String,
    enum: ['Pending', 'Verified', 'Submitted'],
    default: 'Pending'
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  verifiedAt: {
    type: Date,
    default: null
  }
});

module.exports = mongoose.model('Transaction', TransactionSchema);