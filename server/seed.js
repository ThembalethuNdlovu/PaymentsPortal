const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Employee = require('./models/Employee');
require('dotenv').config({ path: './server/.env' });

const employees = [
  {
    fullName: 'John Smith',
    username: 'john_smith',
    password: 'Employee@123',
    role: 'admin'
  },
  {
    fullName: 'Sarah Johnson',
    username: 'sarah_johnson',
    password: 'Employee@123',
    role: 'employee'
  },
  {
    fullName: 'Michael Brown',
    username: 'michael_brown',
    password: 'Employee@123',
    role: 'employee'
  }
];

const seedEmployees = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');

    // Clear existing employees
    await Employee.deleteMany({});
    console.log('🗑️  Cleared existing employees');

    // Create employees - passwords will be hashed by the model
    for (const emp of employees) {
      const employee = new Employee(emp);
      await employee.save();
      console.log(`✅ Created employee: ${emp.username}`);
    }

    console.log('');
    console.log('✅ Seeding complete! Employee accounts:');
    console.log('─────────────────────────────────────');
    employees.forEach(emp => {
      console.log(`👤 Username : ${emp.username}`);
      console.log(`🔑 Password : ${emp.password}`);
      console.log(`🎭 Role     : ${emp.role}`);
      console.log('─────────────────────────────────────');
    });

    process.exit(0);

  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedEmployees();