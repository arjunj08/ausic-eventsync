import express from 'express';
import Event from '../models/Event.js';
import User from '../models/User.js';
import Team from '../models/Team.js';
import Expense from '../models/Expense.js';
import Attendance from '../models/Attendance.js';
import Meeting from '../models/Meeting.js';
import Notification from '../models/Notification.js';
import AuditLog from '../models/AuditLog.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { logActivity } from '../utils/auditLogger.js';

const router = express.Router();

// Middleware: allow faculty role or admin role
const facultyOrAdmin = (req, res, next) => {
  if (req.user.role === 'faculty' || req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Access denied. Faculty or Admin only.' });
  }
};

// 1. Faculty Dashboard overview (GET /api/faculty/dashboard)
router.get('/dashboard', authMiddleware, facultyOrAdmin, async (req, res) => {
  try {
    const totalMembers = await User.countDocuments({ role: 'member' });
    const activeTeams = await Team.countDocuments({});
    
    const now = new Date();
    const upcomingEvents = await Event.countDocuments({ date: { $gte: now }, status: 'published' });

    // Recent activity feed (last 15 audit logs)
    const recentActivity = await AuditLog.find({})
      .sort({ createdAt: -1 })
      .limit(15);

    // Read-only lists
    const events = await Event.find({}).populate('createdBy', 'name').sort({ date: 1 });
    const teams = await Team.find({}).populate('memberIds', 'name email avatar subRole');
    const expenses = await Expense.find({}).populate('submittedBy', 'name').populate('eventId', 'title');
    const attendance = await Attendance.find({}).populate('userId', 'name').populate('eventId', 'title');
    const meetings = await Meeting.find({}).sort({ scheduledAt: -1 });

    res.json({
      stats: {
        totalMembers,
        activeTeams,
        upcomingEvents
      },
      recentActivity,
      events,
      teams,
      expenses,
      attendance,
      meetings
    });
  } catch (error) {
    console.error('Faculty dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to retrieve faculty dashboard data' });
  }
});

// 2. Pending Approval Events (GET /api/faculty/pending-events)
router.get('/pending-events', authMiddleware, facultyOrAdmin, async (req, res) => {
  try {
    const events = await Event.find({ status: 'pending_approval' })
      .populate('createdBy', 'name email avatar')
      .populate('teamIds', 'name color')
      .sort({ date: 1 });
    res.json(events);
  } catch (error) {
    console.error('Fetch pending events error:', error);
    res.status(500).json({ error: 'Failed to fetch pending events' });
  }
});

// 3. Approve Event (PATCH /api/faculty/events/:id/approve)
router.patch('/events/:id/approve', authMiddleware, facultyOrAdmin, async (req, res) => {
  try {
    const { comment } = req.body;
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    event.status = 'published';
    await event.save();

    // Link assigned teams to this event
    if (event.teamIds && event.teamIds.length > 0) {
      await Team.updateMany(
        { _id: { $in: event.teamIds } },
        { $set: { eventId: event._id } }
      );
    }

    // Notify uploader and admins
    const admins = await User.find({ role: 'admin' });
    const uploader = await User.findById(event.createdBy);
    const notificationList = [...admins];
    if (uploader && !notificationList.some(a => String(a._id) === String(uploader._id))) {
      notificationList.push(uploader);
    }

    const io = req.app.get('io');
    for (const recipient of notificationList) {
      const notif = new Notification({
        userId: recipient._id,
        type: 'event_approved',
        message: `✅ Event approved by faculty: "${event.title}". ${comment ? `Note: "${comment}"` : ''}`,
        read: false
      });
      await notif.save();
      if (io) {
        io.to(String(recipient._id)).emit('new_notification', notif);
      }
    }

    // Notify all members of a new published event
    const members = await User.find({ role: 'member' });
    const memberNotifications = members.map(m => ({
      userId: m._id,
      type: 'event_published',
      message: `🎉 A new event "${event.title}" has been published! Join the teams and check tasks.`,
      read: false
    }));
    await Notification.insertMany(memberNotifications);

    await logActivity(req, req.user.id, req.user.name, req.user.role, 'approve_event', 'event', `Approved event: "${event.title}"`, { eventId: event._id, comment });

    res.json({ message: 'Event approved and published successfully', event });
  } catch (error) {
    console.error('Approve event error:', error);
    res.status(500).json({ error: 'Failed to approve event' });
  }
});

// 4. Request Changes on Event (PATCH /api/faculty/events/:id/request-changes)
router.patch('/events/:id/request-changes', authMiddleware, facultyOrAdmin, async (req, res) => {
  try {
    const { comment } = req.body;
    if (!comment) {
      return res.status(400).json({ error: 'Feedback comment is required to request changes' });
    }

    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    event.status = 'changes_requested';
    await event.save();

    // Notify admins and uploader
    const admins = await User.find({ role: 'admin' });
    const uploader = await User.findById(event.createdBy);
    const notificationList = [...admins];
    if (uploader && !notificationList.some(a => String(a._id) === String(uploader._id))) {
      notificationList.push(uploader);
    }

    const io = req.app.get('io');
    for (const recipient of notificationList) {
      const notif = new Notification({
        userId: recipient._id,
        type: 'event_changes_requested',
        message: `🔄 Changes requested on event "${event.title}" by faculty: "${comment}"`,
        read: false
      });
      await notif.save();
      if (io) {
        io.to(String(recipient._id)).emit('new_notification', notif);
      }
    }

    await logActivity(req, req.user.id, req.user.name, req.user.role, 'request_changes_event', 'event', `Requested changes on event: "${event.title}"`, { eventId: event._id, comment });

    res.json({ message: 'Changes requested and feedback sent successfully', event });
  } catch (error) {
    console.error('Request changes error:', error);
    res.status(500).json({ error: 'Failed to submit changes request' });
  }
});

export default router;
