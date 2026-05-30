import express from 'express';
import Meeting from '../models/Meeting.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { adminOnly } from '../middleware/roleMiddleware.js';
import { sendMeetingScheduledEmail } from '../services/emailService.js';

const router = express.Router();

// 1. Schedule a Meeting
router.post('/', authMiddleware, async (req, res) => {
  try {
    // Permission check: Admin or Coordinator subRole only
    const userProfile = await User.findById(req.user.id);
    const isAuthorized = req.user.role === 'admin' || userProfile?.subRole === 'coordinator';
    if (!isAuthorized) {
      return res.status(403).json({ error: 'Only admins or coordinators can schedule meetings' });
    }

    const { 
      title, description, scheduledAt, duration, meetingLink, 
      platform, minutesWriterId, attendees: attendeeIds, eventId, teamId 
    } = req.body;

    if (!title || !scheduledAt) {
      return res.status(400).json({ error: 'Title and date/time are required' });
    }

    // Resolve attendees info from IDs
    const resolvedAttendees = [];
    if (attendeeIds && Array.isArray(attendeeIds)) {
      const users = await User.find({ _id: { $in: attendeeIds } });
      users.forEach(u => {
        resolvedAttendees.push({
          userId: u._id,
          userName: u.name,
          status: 'pending'
        });
      });
    }

    const meeting = new Meeting({
      title,
      description,
      scheduledAt,
      duration: duration || 60,
      meetingLink: meetingLink || '',
      platform: platform || 'gmeet',
      organizer: req.user.id,
      attendees: resolvedAttendees,
      minutesWriterId: minutesWriterId || null,
      eventId: eventId || null,
      teamId: teamId || null,
      status: 'scheduled'
    });

    await meeting.save();

    // Notify all attendees via DB Notification & Sockets & Emails
    const io = req.app.get('io');
    for (const attendee of resolvedAttendees) {
      const notif = new Notification({
        userId: attendee.userId,
        type: 'meeting_scheduled',
        message: `Meeting Scheduled: "${title}" by organizer ${req.user.name}.`,
        read: false
      });
      await notif.save();

      // Trigger socket alert if online
      if (io) {
        io.to(String(attendee.userId)).emit('new_notification', notif);
      }

      // Dispatch Email
      try {
        const fullUser = await User.findById(attendee.userId);
        if (fullUser) {
          await sendMeetingScheduledEmail(fullUser, meeting);
        }
      } catch (err) {
        console.error(`Failed to send meeting scheduled email to ${attendee.userName}:`, err);
      }
    }

    res.status(201).json(meeting);
  } catch (error) {
    console.error('Schedule meeting error:', error);
    res.status(500).json({ error: 'Failed to schedule meeting' });
  }
});

// 2. Fetch Meetings List (Secured by invite participation)
router.get('/', authMiddleware, async (req, res) => {
  try {
    let query = {};

    // Normal members only see meetings where they are invitees, organizers, or minutes writers
    if (req.user.role !== 'admin') {
      query = {
        $or: [
          { organizer: req.user.id },
          { minutesWriterId: req.user.id },
          { 'attendees.userId': req.user.id }
        ]
      };
    }

    const meetings = await Meeting.find(query)
      .populate('organizer', 'name avatar')
      .populate('minutesWriterId', 'name avatar')
      .populate('eventId', 'title')
      .populate('teamId', 'name color')
      .sort({ scheduledAt: -1 });

    res.json(meetings);
  } catch (error) {
    console.error('Fetch meetings error:', error);
    res.status(500).json({ error: 'Failed to fetch meetings' });
  }
});

// 3. Get Meeting Details
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id)
      .populate('organizer', 'name email avatar')
      .populate('minutesWriterId', 'name email avatar')
      .populate('eventId', 'title')
      .populate('teamId', 'name color');

    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    // Verify access rights
    if (req.user.role !== 'admin') {
      const isOrganizer = String(meeting.organizer._id || meeting.organizer) === String(req.user.id);
      const isWriter = meeting.minutesWriterId && String(meeting.minutesWriterId._id || meeting.minutesWriterId) === String(req.user.id);
      const isAttendee = meeting.attendees.some(att => String(att.userId) === String(req.user.id));

      if (!isOrganizer && !isWriter && !isAttendee) {
        return res.status(403).json({ error: 'Access denied. You are not invited to this meeting.' });
      }
    }

    res.json(meeting);
  } catch (error) {
    console.error('Fetch meeting details error:', error);
    res.status(500).json({ error: 'Failed to fetch meeting details' });
  }
});

// 4. Start Scheduled Meeting (Ongoing alert trigger)
router.patch('/:id/start', authMiddleware, async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    // Verify organizer permission
    if (req.user.role !== 'admin' && String(meeting.organizer) !== String(req.user.id)) {
      return res.status(403).json({ error: 'Only the organizer or admin can start the meeting' });
    }

    meeting.status = 'ongoing';
    await meeting.save();

    // Broadcast toast invite through Socket.io and DB notifications
    const io = req.app.get('io');
    if (io) {
      // Loop over invitees and push live modal trigger alert
      meeting.attendees.forEach(async (att) => {
        io.to(String(att.userId)).emit('meeting_started_alert', {
          meetingId: meeting._id,
          title: meeting.title,
          meetingLink: meeting.meetingLink,
          platform: meeting.platform
        });

        // Save DB notification
        const notif = new Notification({
          userId: att.userId,
          type: 'meeting_ongoing',
          message: `🎯 Meeting Started! "${meeting.title}" is ongoing. Join now.`,
          read: false
        });
        await notif.save();
        io.to(String(att.userId)).emit('new_notification', notif);
      });
    }

    res.json(meeting);
  } catch (error) {
    console.error('Start meeting error:', error);
    res.status(500).json({ error: 'Failed to start meeting' });
  }
});

// 5. Save Attendees Attendance Checklist (Admin only)
router.patch('/:id/attendance', authMiddleware, async (req, res) => {
  try {
    const { attendees } = req.body; // Array of { userId, status: 'present' | 'absent' }
    if (!attendees || !Array.isArray(attendees)) {
      return res.status(400).json({ error: 'Attendees status list is required' });
    }

    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    // Authorization: Only admin can record attendance
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can mark meeting attendance' });
    }

    // Update attendance state
    attendees.forEach(update => {
      const match = meeting.attendees.find(att => String(att.userId) === String(update.userId));
      if (match) {
        match.status = update.status;
      }
    });

    await meeting.save();
    res.json(meeting);
  } catch (error) {
    console.error('Mark attendance error:', error);
    res.status(500).json({ error: 'Failed to save attendance checklist' });
  }
});

// 6. Write or Append Minutes of Meeting (Designated Minutes writer or admin/organizer only)
router.patch('/:id/minutes', authMiddleware, async (req, res) => {
  try {
    const { minutesContent } = req.body;
    if (minutesContent === undefined) {
      return res.status(400).json({ error: 'Minutes content is required' });
    }

    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    // Check lock state
    if (meeting.status === 'completed') {
      // If completed, only admin can unlock or overwrite
      if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Meeting is completed. Minutes are locked.' });
      }
    }

    // Authorization: Is admin, organizer, or designated minutes writer
    const isOrganizer = String(meeting.organizer) === String(req.user.id);
    const isWriter = meeting.minutesWriterId && String(meeting.minutesWriterId) === String(req.user.id);
    const isAdmin = req.user.role === 'admin';

    if (!isOrganizer && !isWriter && !isAdmin) {
      return res.status(403).json({ error: 'You are not authorized to write minutes for this meeting' });
    }

    // Format new entries with time headers
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const appendedText = `\n[${timeStr}] ${minutesContent}\n`;
    
    meeting.minutes = meeting.minutes ? (meeting.minutes + appendedText) : appendedText.trim();
    await meeting.save();

    res.json(meeting);
  } catch (error) {
    console.error('Append minutes error:', error);
    res.status(500).json({ error: 'Failed to append minutes' });
  }
});

// 7. Complete Meeting and Lock Minutes (Organizer or Admin)
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status, summary, actionItems, keyDecisions, nextSteps } = req.body; // status: 'completed' | 'scheduled'
    const meeting = await Meeting.findById(req.params.id);
    
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    if (req.user.role !== 'admin' && String(meeting.organizer) !== String(req.user.id)) {
      return res.status(403).json({ error: 'Only the organizer or admin can complete the meeting' });
    }

    if (status) meeting.status = status;
    if (summary) meeting.summary = summary;
    if (actionItems) meeting.actionItems = actionItems;

    await meeting.save();
    res.json(meeting);
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Failed to update meeting status' });
  }
});

// 8. Update Agenda Builder details (Organizer or Admin)
router.patch('/:id/agenda', authMiddleware, async (req, res) => {
  try {
    const { agenda } = req.body; // Array of { title, description, duration, presenter, status, order }
    if (!agenda || !Array.isArray(agenda)) {
      return res.status(400).json({ error: 'Agenda list must be an array' });
    }

    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    // Permission check
    if (req.user.role !== 'admin' && String(meeting.organizer) !== String(req.user.id)) {
      return res.status(403).json({ error: 'Only the organizer or admin can modify the agenda' });
    }

    meeting.agenda = agenda;
    await meeting.save();

    const io = req.app.get('io');
    if (io) {
      io.emit(`meeting_${meeting._id}_agenda_update`, meeting.agenda);
    }

    res.json(meeting);
  } catch (error) {
    console.error('Update agenda error:', error);
    res.status(500).json({ error: 'Failed to update agenda' });
  }
});

// 9. Update specific agenda item status / timer tick during meeting (Organizer or Admin)
router.patch('/:id/agenda/:itemId/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body; // 'pending' | 'current' | 'done'
    if (!status || !['pending', 'current', 'done'].includes(status)) {
      return res.status(400).json({ error: 'Invalid agenda item status' });
    }

    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    // Permission check
    if (req.user.role !== 'admin' && String(meeting.organizer) !== String(req.user.id)) {
      return res.status(403).json({ error: 'Only the organizer or admin can update agenda statuses' });
    }

    const item = meeting.agenda.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({ error: 'Agenda item not found' });
    }

    item.status = status;
    
    // If setting one item to 'current', make sure all others set to 'current' are set to pending/done
    if (status === 'current') {
      meeting.agenda.forEach(i => {
        if (String(i._id) !== String(item._id) && i.status === 'current') {
          i.status = 'pending';
        }
      });
    }

    await meeting.save();

    const io = req.app.get('io');
    if (io) {
      io.emit(`meeting_${meeting._id}_agenda_update`, meeting.agenda);
      io.emit(`meeting_${meeting._id}_agenda_status_change`, {
        itemId: item._id,
        status: item.status,
        item
      });
    }

    res.json(meeting);
  } catch (error) {
    console.error('Update agenda item status error:', error);
    res.status(500).json({ error: 'Failed to update agenda item status' });
  }
});

export default router;
