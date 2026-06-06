const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config({ path: './server/.env' });
process.env.NODE_ENV = 'test';

const app = express();
app.use(express.json());

const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
app.use(mongoSanitize());
app.use(xss());

// ─── Routes ───────────────────────────────────────────────────
app.use('/api/auth', require('../routes/authRoutes'));
app.use('/api/employee', require('../routes/employeeRoutes'));
app.use('/api/transactions', require('../routes/transactionRoutes'));

// ─── Test Setup ───────────────────────────────────────────────
beforeAll(async () => {
  await mongoose.connect(
    process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/paymentsportal_test'
  );
  const User = require('../models/User');
  const Employee = require('../models/Employee');
  const Transaction = require('../models/Transaction');
  await User.deleteMany({});
  await Employee.deleteMany({});
  await Transaction.deleteMany({});
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

// ─── Customer Auth Tests ──────────────────────────────────────
describe('Customer Authentication', () => {

  describe('POST /api/auth/register', () => {

    it('should register a new customer successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'TestUser One',
          idNumber: '9001015800085',
          accountNumber: '12345678901',
          password: 'Test@1234'
        });
      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.fullName).toBe('TestUser One');
    });

    it('should not register with invalid ID number', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'TestUser Two',
          idNumber: '123',
          accountNumber: '12345678902',
          password: 'Test@1234'
        });
      expect(res.statusCode).toBe(400);
    });

    it('should not register with weak password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'TestUser Three',
          idNumber: '9001015800086',
          accountNumber: '12345678903',
          password: 'weakpassword'
        });
      expect(res.statusCode).toBe(400);
    });

    it('should not register duplicate account number', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'TestUser Four',
          idNumber: '9001015800087',
          accountNumber: '12345678901',
          password: 'Test@1234'
        });
      expect(res.statusCode).toBe(400);
    });

  });

  describe('POST /api/auth/login', () => {

    it('should login successfully with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'TestUserOne',
          accountNumber: '12345678901',
          password: 'Test@1234'
        });
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('token');
    });

    it('should not login with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'TestUserOne',
          accountNumber: '12345678901',
          password: 'WrongPass@1234'
        });
      expect(res.statusCode).toBe(401);
    });

    it('should not login with non existent account', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'TestUserOne',
          accountNumber: '99999999999',
          password: 'Test@1234'
        });
      expect(res.statusCode).toBe(401);
    });

  });

});

// ─── Employee Auth Tests ──────────────────────────────────────
describe('Employee Authentication', () => {

  beforeAll(async () => {
    const Employee = require('../models/Employee');
    await Employee.deleteMany({});
    const employee = new Employee({
      fullName: 'Test Employee',
      username: 'test_employee',
      password: 'Employee@123',
      role: 'employee'
    });
    await employee.save();
  });

  it('should login employee with correct credentials', async () => {
    const res = await request(app)
      .post('/api/employee/login')
      .send({
        username: 'test_employee',
        password: 'Employee@123'
      });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.employee.role).toBe('employee');
  });

  it('should not login with wrong password', async () => {
    const res = await request(app)
      .post('/api/employee/login')
      .send({
        username: 'test_employee',
        password: 'WrongPass@123'
      });
    expect(res.statusCode).toBe(401);
  });

  it('should not login non existent employee', async () => {
    const res = await request(app)
      .post('/api/employee/login')
      .send({
        username: 'fake_employee',
        password: 'Employee@123'
      });
    expect(res.statusCode).toBe(401);
  });

});

// ─── Transaction Tests ────────────────────────────────────────
describe('Transaction Routes', () => {

  let customerToken;

  beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  const User = require('../models/User');
  await User.deleteMany({ accountNumber: '11111111111' });

  const registerRes = await request(app)
    .post('/api/auth/register')
    .send({
      fullName: 'Payment Tester',
      idNumber: '8001015800085',
      accountNumber: '11111111111',
      password: 'Test@1234'
    });

  console.log('Register response:', registerRes.statusCode, registerRes.body);
  customerToken = registerRes.body.token;
  console.log('Customer token:', customerToken ? 'received' : 'missing');
});

  it('should create transaction with valid data', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        amount: 500,
        currency: 'USD',
        provider: 'SWIFT',
        recipientName: 'Jane Smith',
        recipientBank: 'Standard Bank',
        recipientAccountNumber: '98765432101',
        swiftCode: 'SBZAZAJJ'
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.transaction.status).toBe('Pending');
  });

  it('should not create transaction without token', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .send({
        amount: 500,
        currency: 'USD',
        provider: 'SWIFT',
        recipientName: 'Jane Smith',
        recipientBank: 'Standard Bank',
        recipientAccountNumber: '98765432101',
        swiftCode: 'SBZAZAJJ'
      });
    expect(res.statusCode).toBe(401);
  });

  it('should not create transaction with invalid SWIFT code', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        amount: 500,
        currency: 'USD',
        provider: 'SWIFT',
        recipientName: 'Jane Smith',
        recipientBank: 'Standard Bank',
        recipientAccountNumber: '98765432101',
        swiftCode: 'INVALID'
      });
    expect(res.statusCode).toBe(400);
  });

  it('should not create transaction with negative amount', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        amount: -100,
        currency: 'USD',
        provider: 'SWIFT',
        recipientName: 'Jane Smith',
        recipientBank: 'Standard Bank',
        recipientAccountNumber: '98765432101',
        swiftCode: 'SBZAZAJJ'
      });
    expect(res.statusCode).toBe(400);
  });

  it('should get all transactions as employee', async () => {
    const employeeRes = await request(app)
      .post('/api/employee/login')
      .send({
        username: 'test_employee',
        password: 'Employee@123'
      });
    const employeeToken = employeeRes.body.token;

    const res = await request(app)
      .get('/api/transactions')
      .set('Authorization', `Bearer ${employeeToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('transactions');
  });

});