import express from 'express';
import PhotoAlbum from '../models/PhotoAlbum.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { adminOnly } from '../middleware/roleMiddleware.js';

const router = express.Router();

// 1. Create Photo Album (POST /api/photo-albums)
router.post('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { eventId, name, coverPhotoId } = req.body;
    if (!eventId || !name) {
      return res.status(400).json({ error: 'Event ID and album name are required' });
    }

    const album = new PhotoAlbum({
      eventId,
      name,
      coverPhotoId: coverPhotoId || null,
      createdBy: req.user.id
    });

    await album.save();
    res.status(201).json(album);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'An album with this name already exists for this event' });
    }
    console.error('Create photo album error:', error);
    res.status(500).json({ error: 'Failed to create photo album' });
  }
});

// 2. Get Photo Albums by Event (GET /api/photo-albums/event/:eventId)
router.get('/event/:eventId', authMiddleware, async (req, res) => {
  try {
    const albums = await PhotoAlbum.find({ eventId: req.params.eventId })
      .populate('coverPhotoId')
      .sort({ createdAt: 1 });
    res.json(albums);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch photo albums' });
  }
});

export default router;
