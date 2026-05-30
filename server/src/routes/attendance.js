import express from 'express';
import Attendance from '../models/Attendance.js';
import Event from '../models/Event.js';
import User from '../models/User.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { adminOnly } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Register user check-in
router.post('/checkin', authMiddleware, async (req, res) => {
  try {
    const { eventId, method } = req.body;
    if (!eventId) {
      return res.status(400).json({ error: 'Event ID is required' });
    }

    // Verify event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check if user is already checked in
    const existing = await Attendance.findOne({ eventId, userId: req.user.id });
    if (existing) {
      return res.status(400).json({ error: 'Already checked in for this event' });
    }

    const attendance = new Attendance({
      eventId,
      userId: req.user.id,
      userName: req.user.name,
      method: method || 'manual',
      checkedInAt: new Date()
    });

    await attendance.save();
    res.status(201).json(attendance);
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ error: 'Failed to record check-in' });
  }
});

// Retrieve attendance log for an event (Admin only or authorized members)
router.get('/event/:eventId', authMiddleware, async (req, res) => {
  try {
    const { eventId } = req.params;
    
    // Fetch all check-ins for the event
    const logs = await Attendance.find({ eventId }).populate('userId', 'name email avatar teamId');
    
    // Fetch total number of members to compute stats
    const totalUsers = await User.countDocuments({ role: 'member' });
    const attendedCount = logs.length;
    const stats = {
      totalMembers: totalUsers,
      attendedCount,
      rate: totalUsers > 0 ? Math.round((attendedCount / totalUsers) * 100) : 0
    };

    res.json({ logs, stats });
  } catch (error) {
    console.error('Fetch event attendance error:', error);
    res.status(500).json({ error: 'Failed to fetch attendance logs' });
  }
});

// Check-in history of a specific member
router.get('/member/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Ensure normal members can only view their own history
    if (req.user.role !== 'admin' && String(req.user.id) !== String(userId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const logs = await Attendance.find({ userId }).populate('eventId', 'title date location');
    res.json(logs);
  } catch (error) {
    console.error('Fetch member attendance error:', error);
    res.status(500).json({ error: 'Failed to fetch member attendance history' });
  }
});

export default router;
