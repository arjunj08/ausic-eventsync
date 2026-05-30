import express from 'express';
import Announcement from '../models/Announcement.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { adminOnly } from '../middleware/roleMiddleware.js';

const router = express.Router();

// 1. Create announcement banner (Admin only)
router.post('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { title, message, type, expiresAt } = req.body;
    if (!title || !message || !expiresAt) {
      return res.status(400).json({ error: 'Title, message, and expiry date are required' });
    }

    const announcement = new Announcement({
      title,
      message,
      type: type || 'info',
      expiresAt: new Date(expiresAt),
      createdBy: req.user.id
    });

    await announcement.save();

    // Broadcast new banner to all connected users in real time
    const io = req.app.get('io');
    if (io) {
      io.emit('new_announcement', announcement);
    }

    res.status(201).json(announcement);
  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({ error: 'Failed to create announcement' });
  }
});

// 2. Get active, non-expired announcements that the user has not dismissed
router.get('/active', authMiddleware, async (req, res) => {
  try {
    const now = new Date();
    const activeBanners = await Announcement.find({
      isActive: true,
      expiresAt: { $gt: now },
      dismissedBy: { $ne: req.user.id }
    }).sort({ createdAt: -1 });

    res.json(activeBanners);
  } catch (error) {
    console.error('Fetch announcements error:', error);
    res.status(500).json({ error: 'Failed to fetch active announcements' });
  }
});

// 3. Dismiss an announcement
router.patch('/:id/dismiss', authMiddleware, async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    if (!announcement.dismissedBy.includes(req.user.id)) {
      announcement.dismissedBy.push(req.user.id);
      await announcement.save();
    }

    res.json({ message: 'Announcement dismissed' });
  } catch (error) {
    console.error('Dismiss announcement error:', error);
    res.status(500).json({ error: 'Failed to dismiss announcement' });
  }
});

export default router;
