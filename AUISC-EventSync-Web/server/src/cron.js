import cron from 'node-cron';
import Task from './models/Task.js';
import Meeting from './models/Meeting.js';
import User from './models/User.js';
import Notification from './models/Notification.js';
import Event from './models/Event.js';
import { 
  sendTaskAssignedEmail, 
  sendMeetingReminderEmail, 
  sendWeeklyDigestEmail 
} from './services/emailService.js';

// Helper to check if user has already been notified of this specific trigger
const hasBeenNotifiedRecently = async (userId, type, searchPhrase, hoursWindow = 24) => {
  const windowLimit = new Date(Date.now() - hoursWindow * 60 * 60 * 1000);
  const existing = await Notification.findOne({
    userId,
    type,
    message: new RegExp(searchPhrase, 'i'),
    createdAt: { $gte: windowLimit }
  });
  return !!existing;
};

// Scheduler Initialization
export const initScheduler = (io) => {
  console.log('⏰ Background Cron Scheduler Initialized.');

  // 1. Hourly Check: Tasks Due Soon (within 24 hours) & Overdue Warnings
  cron.schedule('0 * * * *', async () => {
    // console.log('⏳ Running hourly task deadline check...');
    try {
      const now = new Date();
      const in24Hours = new Date(Date.now() + 24 * 60 * 60 * 1000);

      // Tasks due soon (within 24h)
      const dueSoonTasks = await Task.find({
        status: { $ne: 'done' },
        dueDate: { $gte: now, $lte: in24Hours }
      }).populate('assignedTo');

      for (const task of dueSoonTasks) {
        if (!task.assignedTo) continue;

        const userId = task.assignedTo._id;
        const taskTitle = task.title;

        // Prevent spam: check if notified in last 24 hours
        const notified = await hasBeenNotifiedRecently(userId, 'task_due_soon', taskTitle, 24);
        if (!notified) {
          const diffMs = new Date(task.dueDate) - now;
          const diffHours = Math.max(1, Math.round(diffMs / (1000 * 60 * 60)));

          const notif = new Notification({
            userId,
            type: 'task_due_soon',
            message: `⏰ Task due soon: "${taskTitle}" is due in ${diffHours} hours.`,
            read: false
          });
          await notif.save();

          // Sockets emit
          if (io) {
            io.to(String(userId)).emit('new_notification', notif);
          }

          // Dispatch Email alert
          try {
            await sendTaskAssignedEmail(task.assignedTo, task);
          } catch (mailErr) {
            console.error('Failed to send task reminder email:', mailErr);
          }
        }
      }

      // Overdue Tasks Check (dueDate in the past and status is not done)
      const overdueTasks = await Task.find({
        status: { $ne: 'done' },
        dueDate: { $lt: now }
      }).populate('assignedTo');

      for (const task of overdueTasks) {
        if (!task.assignedTo) continue;

        const userId = task.assignedTo._id;
        const taskTitle = task.title;

        // Prevent spam: only alert once every 24 hours for overdue
        const notified = await hasBeenNotifiedRecently(userId, 'task_overdue', taskTitle, 24);
        if (!notified) {
          const notif = new Notification({
            userId,
            type: 'task_overdue',
            message: `🚨 OVERDUE ALERT: "${taskTitle}" has passed its deadline! Please complete it.`,
            read: false
          });
          await notif.save();

          if (io) {
            io.to(String(userId)).emit('new_notification', notif);
          }
        }
      }
    } catch (err) {
      console.error('Error in task deadline check cron:', err);
    }
  });

  // 2. Hourly Check: Meetings Starting Soon (in 1 hour)
  cron.schedule('0 * * * *', async () => {
    // console.log('⏳ Running hourly meeting starting check...');
    try {
      const now = new Date();
      const in1Hour = new Date(Date.now() + 60 * 60 * 1000);

      const soonMeetings = await Meeting.find({
        status: 'scheduled',
        scheduledAt: { $gte: now, $lte: in1Hour }
      });

      for (const meeting of soonMeetings) {
        // Send reminders to all attendees
        for (const att of meeting.attendees) {
          const userId = att.userId;
          
          // Avoid spam
          const notified = await hasBeenNotifiedRecently(userId, 'meeting_reminder', meeting.title, 2);
          if (!notified) {
            const notif = new Notification({
              userId,
              type: 'meeting_reminder',
              message: `⏰ Meeting starting soon: "${meeting.title}" begins in 1 hour.`,
              read: false
            });
            await notif.save();

            if (io) {
              io.to(String(userId)).emit('new_notification', notif);
            }

            // Email reminder
            try {
              const user = await User.findById(userId);
              if (user && user.emailNotifications?.meetingScheduled !== false) {
                await sendMeetingReminderEmail(user, meeting);
              }
            } catch (mailErr) {
              console.error('Failed to send email reminder for meeting:', mailErr);
            }
          }
        }
      }
    } catch (err) {
      console.error('Error in meeting scheduler cron:', err);
    }
  });

  // 3. Weekly Digest Check: Every Monday at 9:00 AM
  // Cron schedule format: minute hour day-of-month month day-of-week
  cron.schedule('0 9 * * 1', async () => {
    console.log('⏳ Generating and dispatching weekly digest summaries...');
    try {
      const now = new Date();
      const users = await User.find({ isOnboarded: true });

      for (const user of users) {
        if (user.emailNotifications?.weeklyDigest === false) continue;

        // Fetch pending tasks
        const pendingTasks = await Task.find({
          assignedTo: user._id,
          status: { $ne: 'done' }
        }).limit(10);

        // Fetch upcoming events
        const upcomingEvents = await Event.find({
          status: 'published',
          date: { $gte: now }
        }).limit(5);

        // Fetch unread notifications count
        const unreadCount = await Notification.countDocuments({
          userId: user._id,
          read: false
        });

        // Send digest email
        try {
          await sendWeeklyDigestEmail(user, pendingTasks, upcomingEvents, unreadCount);
        } catch (mailErr) {
          console.error(`Failed to dispatch weekly digest to ${user.email}:`, mailErr);
        }
      }
    } catch (err) {
      console.error('Error running weekly digest cron:', err);
    }
  });
};
