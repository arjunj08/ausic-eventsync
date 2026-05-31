import express from 'express';
import Event from '../models/Event.js';
import Team from '../models/Team.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import PublicRSVP from '../models/PublicRSVP.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { adminOnly } from '../middleware/roleMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Get all events
// Members see only published, admins see all.
router.get('/', authMiddleware, async (req, res) => {
  try {
    let query = {};
    if (req.user.role !== 'admin') {
      query.status = 'published';
    }
    
    const events = await Event.find(query)
      .populate('teamIds')
      .populate('createdBy', 'name email avatar')
      .sort({ date: 1 });
      
    res.json(events);
  } catch (error) {
    console.error('Fetch events error:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Get a single event by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('teamIds')
      .populate('createdBy', 'name email avatar');

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (event.status !== 'published' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Fetch details of members in the assigned teams
    let teamsWithMembers = [];
    for (let team of event.teamIds) {
      const fullTeam = await Team.findById(team._id).populate('memberIds', 'name email avatar role');
      teamsWithMembers.push(fullTeam);
    }

    res.json({ event, teams: teamsWithMembers });
  } catch (error) {
    console.error('Fetch single event error:', error);
    res.status(500).json({ error: 'Failed to fetch event details' });
  }
});

// Create event (Admin only)
router.post('/', authMiddleware, adminOnly, upload.single('image'), async (req, res) => {
  try {
    const { title, description, date, teamIds, status, tags, category } = req.body;
    
    if (!title || !description || !date) {
      return res.status(400).json({ error: 'Title, description, and date are required' });
    }

    let parsedTeamIds = [];
    if (teamIds) {
      parsedTeamIds = typeof teamIds === 'string' ? JSON.parse(teamIds) : teamIds;
    }

    let parsedTags = [];
    if (tags) {
      parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
    }

    let imageUrl = '';
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    } else {
      // Standard cool Tech Banner or Cultural Banner depending on title keyword
      imageUrl = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800';
    }

    const event = new Event({
      title,
      description,
      date: new Date(date),
      imageUrl,
      status: status || 'draft',
      teamIds: parsedTeamIds,
      tags: parsedTags,
      category: category || 'Other',
      createdBy: req.user.id
    });

    await event.save();

    // If published, notify users and link teams to the event
    if (event.status === 'published') {
      await Team.updateMany(
        { _id: { $in: parsedTeamIds } },
        { $set: { eventId: event._id } }
      );

      // Create notification for all members
      const users = await User.find({ role: 'member' });
      const notifications = users.map(user => ({
        userId: user._id,
        type: 'event_published',
        message: `A new event "${event.title}" has been published! Join the teams and check tasks.`,
        read: false
      }));
      await Notification.insertMany(notifications);
    }

    res.status(201).json(event);
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// Update event (Admin only)
router.put('/:id', authMiddleware, adminOnly, upload.single('image'), async (req, res) => {
  try {
    const { title, description, date, teamIds, status, tags, category } = req.body;
    const eventId = req.params.id;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    let parsedTeamIds = event.teamIds;
    if (teamIds) {
      parsedTeamIds = typeof teamIds === 'string' ? JSON.parse(teamIds) : teamIds;
    }

    let parsedTags = event.tags;
    if (tags) {
      parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
    }

    if (title) event.title = title;
    if (description) event.description = description;
    if (date) event.date = new Date(date);
    if (parsedTeamIds) event.teamIds = parsedTeamIds;
    if (tags !== undefined) event.tags = parsedTags;
    if (category) event.category = category;
    if (status) {
      const oldStatus = event.status;
      event.status = status;
      
      // If newly published, notify and associate teams
      if (oldStatus !== 'published' && status === 'published') {
        await Team.updateMany(
          { _id: { $in: parsedTeamIds } },
          { $set: { eventId: event._id } }
        );

        // Notify
        const users = await User.find({ role: 'member' });
        const notifications = users.map(user => ({
          userId: user._id,
          type: 'event_published',
          message: `A new event "${event.title}" has been published!`,
          read: false
        }));
        await Notification.insertMany(notifications);
      }
    }

    if (req.file) {
      event.imageUrl = `/uploads/${req.file.filename}`;
    }

    await event.save();
    res.json(event);
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// Delete event (Admin only)
router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    // Clear eventId from teams
    await Team.updateMany({ eventId: req.params.id }, { $set: { eventId: null } });

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

// 5. Get public details for an event (No auth required)
router.get('/public/:eventId', async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    if (event.status !== 'published') {
      return res.status(403).json({ error: 'Event is not published yet' });
    }
    const rsvpCount = await PublicRSVP.countDocuments({ eventId: event._id });
    res.json({ event, rsvpCount });
  } catch (error) {
    console.error('Fetch public event error:', error);
    res.status(500).json({ error: 'Failed to fetch public event details' });
  }
});

// 6. Submit RSVP for a public event (No auth required)
router.post('/:id/rsvp', async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check if duplicate RSVP for this email
    const duplicate = await PublicRSVP.findOne({ eventId: event._id, email });
    if (duplicate) {
      return res.status(400).json({ error: 'You have already RSVPed for this event.' });
    }

    const rsvp = new PublicRSVP({
      eventId: event._id,
      name,
      email
    });
    await rsvp.save();

    const rsvpCount = await PublicRSVP.countDocuments({ eventId: event._id });

    // Notify event channel admins of new RSVP via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.emit(`event_${event._id}_new_rsvp`, { rsvp, rsvpCount });
    }

    res.status(201).json({ message: 'RSVP saved successfully', rsvp, rsvpCount });
  } catch (error) {
    console.error('Submit RSVP error:', error);
    res.status(500).json({ error: 'Failed to save RSVP' });
  }
});

// 7. Get public RSVPs list (Admin only)
router.get('/:id/rsvps', authMiddleware, adminOnly, async (req, res) => {
  try {
    const rsvps = await PublicRSVP.find({ eventId: req.params.id }).sort({ createdAt: -1 });
    res.json(rsvps);
  } catch (error) {
    console.error('Fetch RSVPs error:', error);
    res.status(500).json({ error: 'Failed to fetch RSVPs list' });
  }
});

export default router;
