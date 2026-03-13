require('dotenv').config();
const mongoose = require('mongoose');

const URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/neoconnect';

async function seed() {
  await mongoose.connect(URI);
  console.log('Connected');

  const User = require('./models/User');
  const Case = require('./models/Case');
  const Poll = require('./models/Poll');

  await User.deleteMany({});
  await Case.deleteMany({});
  await Poll.deleteMany({});
  console.log('Cleared old data');

  const users = await User.create([
    { name: 'Admin User',       email: 'admin@neoconnect.com',        password: 'admin123',    role: 'Admin',        department: 'IT' },
    { name: 'Sarah Mokoena',    email: 'secretariat@neoconnect.com',  password: 'password123', role: 'Secretariat',  department: 'HR' },
    { name: 'James Dlamini',    email: 'manager@neoconnect.com',      password: 'password123', role: 'Case Manager', department: 'Operations' },
    { name: 'Lindiwe Khumalo',  email: 'staff@neoconnect.com',        password: 'password123', role: 'Staff',        department: 'Engineering' },
    { name: 'Thabo Nkosi',      email: 'staff2@neoconnect.com',       password: 'password123', role: 'Staff',        department: 'Finance' },
  ]);

  const [admin, secretariat, manager, staff, staff2] = users;

  await Case.create([
    {
      category: 'Safety', department: 'Engineering', location: 'Head Office',
      severity: 'High', description: 'Broken fire exit door on floor 3 — reported multiple times but still not fixed. Serious safety hazard.',
      isAnonymous: false, submittedBy: staff._id, assignedTo: manager._id,
      status: 'In Progress',
      notes: [{ text: 'Contacted facilities. Inspection booked for Friday.', addedBy: manager._id }]
    },
    {
      category: 'HR', department: 'Finance', location: 'Head Office',
      severity: 'Medium', description: 'Leave policy is applied inconsistently across departments. Some managers approve differently from others.',
      isAnonymous: true, submittedBy: staff2._id, status: 'New'
    },
    {
      category: 'Facilities', department: 'IT', location: 'Branch A',
      severity: 'Low', description: 'Air conditioning in the server room has been making loud noises for two weeks.',
      isAnonymous: false, submittedBy: staff._id, assignedTo: manager._id,
      status: 'Resolved', resolvedAt: new Date(), isPublic: true,
      actionTaken: 'HVAC technician replaced the fan belt.',
      whatChanged: 'AC now operates normally and has been serviced for the next 6 months.',
      notes: [
        { text: 'Logged with facilities. Technician booked.', addedBy: manager._id },
        { text: 'Issue resolved — AC working perfectly.', addedBy: manager._id }
      ]
    },
    {
      category: 'Policy', department: 'Engineering', location: 'Remote',
      severity: 'Medium', description: 'No clear remote work policy. Staff unsure about availability expectations on remote days.',
      isAnonymous: false, submittedBy: staff._id,
      status: 'Escalated', escalated: true, escalatedAt: new Date(),
      notes: [{ text: 'Auto-escalated: No response from Case Manager within 7 working days.', isSystem: true }]
    },
    {
      category: 'Safety', department: 'Engineering', location: 'Head Office',
      severity: 'Medium', description: 'Fire safety training for Q3 new hires has not been scheduled. All new employees are without safety briefings.',
      isAnonymous: false, submittedBy: staff._id, status: 'New'
    },
    {
      category: 'Safety', department: 'Engineering', location: 'Head Office',
      severity: 'High', description: 'Exposed electrical cables in the open-plan workspace creating trip hazards. Multiple staff have raised this.',
      isAnonymous: false, submittedBy: staff._id, assignedTo: manager._id, status: 'Assigned'
    },
  ]);

  await Poll.create([
    {
      question: 'Should we introduce flexible working hours (7am–7pm core band)?',
      options: [
        { text: 'Yes, strongly support', votes: [staff._id] },
        { text: 'Yes, with conditions', votes: [staff2._id] },
        { text: 'No, prefer current hours', votes: [] },
        { text: 'Need more info first', votes: [] }
      ],
      createdBy: secretariat._id, isActive: true
    },
    {
      question: 'How would you rate the current canteen food quality?',
      options: [
        { text: 'Excellent', votes: [] },
        { text: 'Good', votes: [staff._id] },
        { text: 'Average', votes: [staff2._id] },
        { text: 'Poor', votes: [] }
      ],
      createdBy: secretariat._id, isActive: false
    }
  ]);

  console.log('\n✅ Seed done!\n');
  console.log('Demo accounts:');
  console.log('  admin@neoconnect.com        / admin123');
  console.log('  secretariat@neoconnect.com  / password123');
  console.log('  manager@neoconnect.com      / password123');
  console.log('  staff@neoconnect.com        / password123');
  console.log('  staff2@neoconnect.com       / password123\n');

  await mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });