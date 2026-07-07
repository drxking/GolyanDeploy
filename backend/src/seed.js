const User = require('./models/User');
const Application = require('./models/Application');
const connectDB = require('./config/db');

async function seed() {
  await connectDB();

  const adminPassword = await User.hashPassword('admin123');
  await User.findOneAndUpdate(
    { email: 'admin@golyan.com' },
    {
      email: 'admin@golyan.com',
      passwordHash: adminPassword,
      fullName: 'Scholarship Admin',
      mobileNumber: '+977-9800000000',
      role: 'admin',
      isActive: true,
    },
    { upsert: true, new: true }
  );

  const studentPassword = await User.hashPassword('student123');
  const student = await User.findOneAndUpdate(
    { email: 'student@golyan.com' },
    {
      email: 'student@golyan.com',
      passwordHash: studentPassword,
      fullName: 'Bikash Thapa',
      mobileNumber: '+977-9812345678',
      province: 'Karnali',
      district: 'Humla',
      role: 'student',
      isActive: true,
    },
    { upsert: true, new: true }
  );

  await Application.findOneAndUpdate(
    { user: student.id },
    {
      user: student.id,
      educationLevel: 'Master',
      currentInstitution: 'Tribhuvan University',
      gpaPercentage: '3.7',
      familyIncomeRange: '1-3 Lakh',
      district: 'Humla',
      gender: 'Male',
      status: 'under_review',
      completenessPercentage: 85,
      submittedAt: new Date(),
      timeline: [
        { label: 'Application Started', date: new Date('2026-05-15'), done: true },
        { label: 'Documents Uploaded', date: new Date('2026-05-18'), done: true },
        { label: 'Application Submitted', date: new Date('2026-05-19'), done: true },
        { label: 'Under Review', date: new Date(), done: false, active: true },
      ],
    },
    { upsert: true, new: true, runValidators: true }
  );

  console.log('Seed complete');
  console.log('Admin: admin@golyan.com / admin123');
  console.log('Student: student@golyan.com / student123');
  process.exit(0);
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
