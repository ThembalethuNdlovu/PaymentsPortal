# SecureBank International Payments Portal

## APDS7311 - Application Development Security
**Student:** Thembalethu Ndlovu  
**Student Number:** ST10099281

---

## Project Overview
A secure international payments portal for a bank, consisting of:
- **Customer Portal** — Register, login, and submit international payments
- **Employee Portal** — View, verify, and submit transactions to SWIFT

---

## Security Features

### Password Security
- Passwords hashed using **bcrypt** with 12 salt rounds
- Never stored in plain text
- Secure comparison using bcrypt.compare()

### Input Whitelisting
- All inputs validated using **RegEx patterns**
- Server-side validation using **express-validator**
- Client-side validation as additional layer

### SSL/HTTPS
- All traffic served over **HTTPS** using self-signed certificate
- TLS encryption for all data in transit

### Protection Against Attacks
| Attack | Protection |
|--------|-----------|
| SQL/NoSQL Injection | express-mongo-sanitize |
| XSS | xss-clean + helmet CSP headers |
| Clickjacking | helmet X-Frame-Options |
| CSRF | JWT tokens + CORS policy |
| DDoS | express-rate-limit |
| Brute Force | express-brute on all login routes |
| MITM | HTTPS/TLS + HSTS headers |
| Session Hijacking | JWT with expiry + HttpOnly |
| HPP | hpp middleware |

### Authentication
- **JWT tokens** with expiry
- Separate tokens for customers and employees
- Role-based access control (RBAC)

### Static Employee Login
- Employees are **pre-seeded** into the database
- No registration process available
- Accounts created via secure seed script

---

## DevSecOps Pipeline

### CircleCI Pipeline
- Triggers automatically on every push to main
- Runs security audit (npm audit)
- Runs SonarQube scan

### SonarQube (SonarCloud)
- Static application testing
- Security hotspot detection
- Code smell analysis
- Quality Gate: **PASSED** ✅

---

## Tech Stack

### Backend
- Node.js + Express
- MongoDB + Mongoose
- bcryptjs, JWT, Helmet, CORS
- express-brute, express-rate-limit
- express-validator, xss-clean, hpp

### Frontend
- React 18
- React Router DOM
- Axios

---

## Running the Project

### Prerequisites
- Node.js 18+
- MongoDB
- Git

### Installation
```bash
# Install server dependencies
npm install

# Install client dependencies
cd client && npm install && cd ..
```

### Seed Employee Accounts
```bash
npm run seed
```

### Run Development Server
```bash
# Run both server and client
npm run dev:full
```

### Employee Credentials
| Username | Password | Role |
|----------|----------|------|
| john_smith | Employee@123 | admin |
| sarah_johnson | Employee@123 | employee |
| michael_brown | Employee@123 | employee |

---

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/auth/register | Customer registration | None |
| POST | /api/auth/login | Customer login | None |
| POST | /api/employee/login | Employee login | None |
| POST | /api/transactions | Create transaction | Customer JWT |
| GET | /api/transactions | Get all transactions | Employee JWT |
| PATCH | /api/transactions/:id/verify | Verify transaction | Employee JWT |
| PATCH | /api/transactions/:id/submit | Submit to SWIFT | Employee JWT |