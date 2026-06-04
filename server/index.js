const https = require('https');
const fs = require('fs');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
require('dotenv').config({ path: './server/.env' });

const app = express();

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// ─── Security Middleware ───────────────────────────────────────
// Helmet sets secure HTTP headers
app.use(helmet());

// Prevent XSS attacks
app.use(xss());

// Prevent NoSQL injection
app.use(mongoSanitize());

// Prevent HTTP parameter pollution
app.use(hpp());

// Compress responses
app.use(compression());

// Logger
app.use(morgan('dev'));

// Body parser
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ─── CORS ─────────────────────────────────────────────────────
app.use(cors({
  origin: 'https://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ─── Rate Limiting ────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again after 15 minutes'
});
app.use('/api', limiter);

// Stricter limit for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many login attempts, please try again after 15 minutes'
});
app.use('/api/auth', authLimiter);

// ─── Routes ───────────────────────────────────────────────────
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/employee', require('./routes/employeeRoutes'));
app.use('/api/transactions', require('./routes/transactionRoutes'));

// ─── Health Check ─────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// ─── MongoDB Connection ───────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// ─── HTTPS Server ─────────────────────────────────────────────
const SSL_KEY = fs.readFileSync('./server/config/key.pem');
const SSL_CERT = fs.readFileSync('./server/config/cert.pem');

const httpsServer = https.createServer(
  { key: SSL_KEY, cert: SSL_CERT },
  app
);

const PORT = process.env.PORT || 5000;
httpsServer.listen(PORT, () => {
  console.log(`✅ Secure server running on https://localhost:${PORT}`);
});