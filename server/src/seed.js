import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB } from './config/database.js';
import User from './models/User.js';
import Event from './models/Event.js';
import Team from './models/Team.js';
import Task from './models/Task.js';
import Notification from './models/Notification.js';
import Expense from './models/Expense.js';
import ChatMessage from './models/ChatMessage.js';
import CrossTeamRequest from './models/CrossTeamRequest.js';

const seedDatabase = async () => {
  try {
    await connectDB();

    console.log('Clearing existing database collections...');
    await User.deleteMany({});
    await Event.deleteMany({});
    await Team.deleteMany({});
    await Task.deleteMany({});
    await Notification.deleteMany({});
    await Expense.deleteMany({});
    await ChatMessage.deleteMany({});
    await CrossTeamRequest.deleteMany({});

    console.log('Hashing passwords...');
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Create User ObjectIds for reference
    const adminId = new mongoose.Types.ObjectId();
    const member1Id = new mongoose.Types.ObjectId();
    const member2Id = new mongoose.Types.ObjectId();
    const member3Id = new mongoose.Types.ObjectId();
    const member4Id = new mongoose.Types.ObjectId();

    // Create Team ObjectIds for reference
    const team1Id = new mongoose.Types.ObjectId();
    const team2Id = new mongoose.Types.ObjectId();
    const team3Id = new mongoose.Types.ObjectId();

    // Create Event ObjectIds for reference
    const event1Id = new mongoose.Types.ObjectId();
    const event2Id = new mongoose.Types.ObjectId();
    const event3Id = new mongoose.Types.ObjectId();

    console.log('Seeding Users...');
    const users = [
      {
        _id: adminId,
        name: 'Admin User',
        email: 'admin@auisc.com',
        passwordHash: hashedPassword,
        role: 'admin',
        teamId: null,
        avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Admin&backgroundColor=00BFFF'
      },
      {
        _id: member1Id,
        name: 'Sarah Chen',
        email: 'member1@auisc.com',
        passwordHash: hashedPassword,
        role: 'member',
        teamId: team1Id,
        avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Sarah&backgroundColor=7c3aed'
      },
      {
        _id: member2Id,
        name: 'David Kim',
        email: 'member2@auisc.com',
        passwordHash: hashedPassword,
        role: 'member',
        teamId: team1Id,
        avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=David&backgroundColor=7c3aed'
      },
      {
        _id: member3Id,
        name: 'Elena Rostova',
        email: 'member3@auisc.com',
        passwordHash: hashedPassword,
        role: 'member',
        teamId: team2Id,
        avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Elena&backgroundColor=7c3aed'
      },
      {
        _id: member4Id,
        name: 'Marcus Vance',
        email: 'member4@auisc.com',
        passwordHash: hashedPassword,
        role: 'member',
        teamId: team2Id,
        avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=Marcus&backgroundColor=7c3aed'
      }
    ];

    await User.insertMany(users);
    console.log('Seeded users successfully.');

    console.log('Seeding Teams...');
    const teams = [
      {
        _id: team1Id,
        name: 'Design Squad',
        color: '#7C3AED', // Purple
        memberIds: [member1Id, member2Id],
        eventId: event1Id
      },
      {
        _id: team2Id,
        name: 'Dev Force',
        color: '#00BFFF', // Cyan/Electric Blue
        memberIds: [member3Id, member4Id],
        eventId: event1Id
      },
      {
        _id: team3Id,
        name: 'Media Team',
        color: '#FF6B00', // Orange
        memberIds: [member2Id, member4Id],
        eventId: event2Id
      }
    ];

    await Team.insertMany(teams);
    console.log('Seeded teams successfully.');

    console.log('Seeding Events...');
    const events = [
      {
        _id: event1Id,
        title: 'Tech Summit 2026',
        description: 'The premier student tech symposium featuring tech displays, paper presentations, and guest speakers from elite companies.',
        date: new Date('2026-06-15T10:00:00Z'),
        imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
        status: 'published',
        teamIds: [team1Id, team2Id],
        createdBy: adminId
      },
      {
        _id: event2Id,
        title: 'AUISC Cultural Night',
        description: 'An evening of fine arts, music performances, and traditional dances curated by Anurag University ISC club.',
        date: new Date('2026-07-20T18:00:00Z'),
        imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800',
        status: 'published',
        teamIds: [team1Id, team3Id],
        createdBy: adminId
      },
      {
        _id: event3Id,
        title: 'Hackathon 3.0',
        description: 'A 36-hour sprint where students build innovative software solutions to real-world problems.',
        date: new Date('2026-08-10T09:00:00Z'),
        imageUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800',
        status: 'draft',
        teamIds: [team2Id, team3Id],
        createdBy: adminId
      }
    ];

    await Event.insertMany(events);
    console.log('Seeded events successfully.');

    console.log('Seeding Tasks...');
    const tasks = [
      {
        title: 'Design Poster Mockups',
        description: 'Create beautiful, sleek, modern dark-themed poster assets for Tech Summit 2026 promotions.',
        status: 'done',
        assignedTo: member1Id,
        teamId: team1Id,
        eventId: event1Id,
        createdAt: new Date('2026-05-20T10:00:00Z')
      },
      {
        title: 'Setup Express Server Routing',
        description: 'Configure basic Express architecture and API routers for the new AUISC EventSync backend.',
        status: 'in_progress',
        assignedTo: member3Id,
        teamId: team2Id,
        eventId: event1Id,
        createdAt: new Date('2026-05-21T10:00:00Z')
      },
      {
        title: 'Prepare Cultural Night Slide Deck',
        description: 'Establish the layout, program schedules, and details in a Google Slides presentation for VIP hosts.',
        status: 'todo',
        assignedTo: member2Id,
        teamId: team1Id,
        eventId: event2Id,
        createdAt: new Date('2026-05-22T10:00:00Z')
      },
      {
        title: 'Configure Video Call Signaling',
        description: 'Write Socket.io handlers to route WebRTC SDP offers, answers, and ICE candidates between peers.',
        status: 'todo',
        assignedTo: member4Id,
        teamId: team2Id,
        eventId: event1Id,
        createdAt: new Date('2026-05-23T10:00:00Z')
      },
      {
        title: 'Edit Event Promos Video',
        description: 'Stitch teasers and club footage into a professional promo for Instagram Reels and YouTube shorts.',
        status: 'in_progress',
        assignedTo: member2Id,
        teamId: team3Id,
        eventId: event2Id,
        createdAt: new Date('2026-05-24T10:00:00Z')
      }
    ];

    await Task.insertMany(tasks);
    console.log('Seeded tasks successfully.');

    console.log('Seeding Notifications...');
    const notifications = [
      {
        userId: member1Id,
        type: 'system',
        message: 'Welcome to AUISC EventSync! Check your team chat room to start collaborating.',
        read: false,
        createdAt: new Date('2026-05-28T12:00:00Z')
      },
      {
        userId: member3Id,
        type: 'task_assigned',
        message: 'You have been assigned the task: "Setup Express Server Routing".',
        read: false,
        createdAt: new Date('2026-05-29T09:30:00Z')
      },
      {
        userId: member4Id,
        type: 'event_published',
        message: 'The event "Tech Summit 2026" has been published! Teams have been assigned.',
        read: true,
        createdAt: new Date('2026-05-29T10:00:00Z')
      }
    ];

    await Notification.insertMany(notifications);
    console.log('Seeded notifications successfully.');

    console.log('Seeding Expenses...');
    const expenses = [
      {
        title: 'Cable adapters and extension box',
        amount: 1500,
        category: 'Hardware',
        eventId: event1Id,
        teamId: team2Id,
        submittedBy: member3Id,
        status: 'approved',
        receiptUrl: '',
        createdAt: new Date('2026-05-26T11:00:00Z')
      },
      {
        title: 'Posters and Standees Printing',
        amount: 4200,
        category: 'Marketing',
        eventId: event2Id,
        teamId: team1Id,
        submittedBy: member1Id,
        status: 'pending',
        receiptUrl: '',
        createdAt: new Date('2026-05-27T15:00:00Z')
      }
    ];

    await Expense.insertMany(expenses);
    console.log('Seeded expenses successfully.');

    console.log('Database seeding completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Database seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();
