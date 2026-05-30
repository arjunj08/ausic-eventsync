require('dotenv').config();
const mongoose = require('mongoose');

const User = require('./src/models/User');
const Event = require('./src/models/Event');
const Team = require('./src/models/Team');
const Task = require('./src/models/Task');
const Expense = require('./src/models/Expense');
const Notification = require('./src/models/Notification');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/auisc-eventsync';

async function seedDatabase() {
  try {
    mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('Connected to MongoDB');

    await User.deleteMany({});
    await Event.deleteMany({});
    await Team.deleteMany({});
    await Task.deleteMany({});
    await Expense.deleteMany({});
    await Notification.deleteMany({});

    console.log('Cleared existing data');

    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@auisc.com',
      passwordHash: 'admin123',
      role: 'admin'
    });

    const member1 = await User.create({
      name: 'Alice Johnson',
      email: 'member1@auisc.com',
      passwordHash: 'password123',
      role: 'member'
    });

    const member2 = await User.create({
      name: 'Bob Smith',
      email: 'member2@auisc.com',
      passwordHash: 'password123',
      role: 'member'
    });

    const member3 = await User.create({
      name: 'Carol White',
      email: 'member3@auisc.com',
      passwordHash: 'password123',
      role: 'member'
    });

    const member4 = await User.create({
      name: 'David Brown',
      email: 'member4@auisc.com',
      passwordHash: 'password123',
      role: 'member'
    });

    console.log('Created 5 users');

    const event1 = await Event.create({
      title: 'Tech Summit 2026',
      description: 'Annual technology summit featuring keynotes from industry leaders and hands-on workshops.',
      date: new Date('2026-06-15'),
      imageUrl: 'https://via.placeholder.com/300x200?text=Tech+Summit',
      status: 'planning',
      createdBy: adminUser._id
    });

    const event2 = await Event.create({
      title: 'AUISC Cultural Night',
      description: 'Celebrate our diverse cultures with food, music, and performances from around the world.',
      date: new Date('2026-07-20'),
      imageUrl: 'https://via.placeholder.com/300x200?text=Cultural+Night',
      status: 'planning',
      createdBy: adminUser._id
    });

    const event3 = await Event.create({
      title: 'Hackathon 3.0',
      description: 'Build innovative solutions in 48 hours. Compete for prizes and showcase your skills.',
      date: new Date('2026-08-10'),
      imageUrl: 'https://via.placeholder.com/300x200?text=Hackathon',
      status: 'planning',
      createdBy: adminUser._id
    });

    console.log('Created 3 events');

    const team1 = await Team.create({
      name: 'Design Squad',
      color: 'blue',
      eventId: event1._id,
      memberIds: [adminUser._id, member1._id, member2._id]
    });

    const team2 = await Team.create({
      name: 'Dev Force',
      color: 'orange',
      eventId: event1._id,
      memberIds: [adminUser._id, member3._id, member4._id]
    });

    const team3 = await Team.create({
      name: 'Media Team',
      color: 'purple',
      eventId: event2._id,
      memberIds: [member1._id, member2._id, member3._id]
    });

    event1.teamIds = [team1._id, team2._id];
    await event1.save();

    event2.teamIds = [team3._id];
    await event2.save();

    console.log('Created 3 teams');

    const task1 = await Task.create({
      title: 'Design UI mockups',
      description: 'Create high-fidelity mockups for the summit website',
      status: 'in-progress',
      assignedTo: member1._id,
      teamId: team1._id,
      eventId: event1._id
    });

    const task2 = await Task.create({
      title: 'Setup backend API',
      description: 'Implement REST API endpoints for event management',
      status: 'pending',
      assignedTo: member3._id,
      teamId: team2._id,
      eventId: event1._id
    });

    const task3 = await Task.create({
      title: 'Organize vendor list',
      description: 'Compile and contact all food and beverage vendors',
      status: 'completed',
      assignedTo: member2._id,
      teamId: team3._id,
      eventId: event2._id
    });

    const task4 = await Task.create({
      title: 'Plan performance schedule',
      description: 'Schedule all cultural performances for the night',
      status: 'pending',
      assignedTo: member1._id,
      teamId: team3._id,
      eventId: event2._id
    });

    const task5 = await Task.create({
      title: 'Set up prize pool',
      description: 'Arrange sponsors and finalize prize awards',
      status: 'blocked',
      assignedTo: member4._id,
      teamId: team2._id,
      eventId: event3._id
    });

    console.log('Created 5 tasks');

    const expense1 = await Expense.create({
      title: 'Catering for summit',
      amount: 5000,
      category: 'food',
      eventId: event1._id,
      teamId: team1._id,
      submittedBy: member1._id,
      status: 'approved',
      receiptUrl: 'https://via.placeholder.com/200x150?text=Receipt'
    });

    const expense2 = await Expense.create({
      title: 'Sound system rental',
      amount: 3000,
      category: 'equipment',
      eventId: event2._id,
      teamId: team3._id,
      submittedBy: member2._id,
      status: 'pending',
      receiptUrl: 'https://via.placeholder.com/200x150?text=Receipt'
    });

    console.log('Created 2 expenses');

    const notification1 = await Notification.create({
      userId: member1._id,
      type: 'task-assigned',
      message: 'You have been assigned: Design UI mockups',
      read: false
    });

    const notification2 = await Notification.create({
      userId: member3._id,
      type: 'task-assigned',
      message: 'You have been assigned: Setup backend API',
      read: false
    });

    const notification3 = await Notification.create({
      userId: adminUser._id,
      type: 'expense-approved',
      message: 'Expense "Catering for summit" has been approved',
      read: true
    });

    console.log('Created 3 notifications');

    console.log('\n=== SEED DATA CREATED SUCCESSFULLY ===\n');
    console.log('Admin User:');
    console.log('  Email: admin@auisc.com');
    console.log('  Password: admin123\n');

    console.log('Member Users:');
    console.log('  member1@auisc.com - Alice Johnson');
    console.log('  member2@auisc.com - Bob Smith');
    console.log('  member3@auisc.com - Carol White');
    console.log('  member4@auisc.com - David Brown\n');

    console.log('Events:');
    console.log('  1. Tech Summit 2026 (Jun 15, 2026)');
    console.log('  2. AUISC Cultural Night (Jul 20, 2026)');
    console.log('  3. Hackathon 3.0 (Aug 10, 2026)\n');

    console.log('Teams:');
    console.log('  1. Design Squad (blue) - Tech Summit 2026');
    console.log('  2. Dev Force (orange) - Tech Summit 2026');
    console.log('  3. Media Team (purple) - Cultural Night\n');

    console.log('Sample Tasks, Expenses, and Notifications created.');

    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    mongoose.connection.close();
    process.exit(1);
  }
}

seedDatabase();
