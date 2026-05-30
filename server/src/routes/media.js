import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Media from '../models/Media.js';
import Event from '../models/Event.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Custom storage engine for gallery uploads
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'gallery-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|gif|mp4|mov|quicktime/;
  const mimetype = filetypes.test(file.mimetype);
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Only JPEG, PNG, GIF, MP4, or MOV media files are allowed!'));
};

const galleryUpload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: fileFilter
}).array('files', 10); // Accept up to 10 files at once

// 1. Upload multiple media files
router.post('/upload', authMiddleware, (req, res) => {
  galleryUpload(req, res, async (err) => {
    if (err) {
      console.error('Multer gallery upload error:', err);
      return res.status(400).json({ error: err.message || 'File upload failed' });
    }

    try {
      const { eventId, caption } = req.body;
      if (!eventId) {
        return res.status(400).json({ error: 'Event ID is required' });
      }

      const event = await Event.findById(eventId);
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No media files uploaded' });
      }

      const mediaEntries = [];
      for (const file of req.files) {
        const fileType = file.mimetype.startsWith('video/') ? 'video' : 'image';
        const fileUrl = `/uploads/${file.filename}`;

        const media = new Media({
          eventId,
          uploadedBy: req.user.id,
          fileName: file.originalname,
          fileUrl,
          fileType,
          caption: caption || ''
        });

        await media.save();
        mediaEntries.push(media);
      }

      // Live update notification triggers
      const io = req.app.get('io');
      if (io) {
        io.emit(`event_${eventId}_gallery_add`, mediaEntries);
      }

      res.status(201).json({
        message: `Successfully uploaded ${mediaEntries.length} media item(s)`,
        media: mediaEntries
      });
    } catch (error) {
      console.error('Save media error:', error);
      res.status(500).json({ error: 'Failed to save media records' });
    }
  });
});

// 2. Fetch gallery items for an event
router.get('/event/:eventId', authMiddleware, async (req, res) => {
  try {
    const { eventId } = req.params;
    const gallery = await Media.find({ eventId })
      .populate('uploadedBy', 'name avatar')
      .sort({ createdAt: -1 });

    res.json(gallery);
  } catch (error) {
    console.error('Fetch gallery items error:', error);
    res.status(500).json({ error: 'Failed to fetch media gallery' });
  }
});

// 3. Toggle media like
router.patch('/:id/like', authMiddleware, async (req, res) => {
  try {
    const media = await Media.findById(req.params.id);
    if (!media) {
      return res.status(404).json({ error: 'Media not found' });
    }

    const userId = req.user.id;
    const likeIndex = media.likes.indexOf(userId);

    if (likeIndex > -1) {
      // Unlike it
      media.likes.splice(likeIndex, 1);
    } else {
      // Like it
      media.likes.push(userId);
    }

    await media.save();

    const io = req.app.get('io');
    if (io) {
      io.emit(`event_${media.eventId}_media_update`, media);
    }

    res.json(media);
  } catch (error) {
    console.error('Like media error:', error);
    res.status(500).json({ error: 'Failed to toggle media like' });
  }
});

// 4. Delete a media item (Owner or Admin)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const media = await Media.findById(req.params.id);
    if (!media) {
      return res.status(404).json({ error: 'Media item not found' });
    }

    const isOwner = String(media.uploadedBy) === String(req.user.id);
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: 'Unauthorized to delete this media item' });
    }

    // Remove from physical uploads storage
    const absolutePath = path.join(process.cwd(), media.fileUrl);
    fs.unlink(absolutePath, (err) => {
      if (err) console.error('Failed to delete physical file:', err);
    });

    await Media.findByIdAndDelete(req.params.id);

    const io = req.app.get('io');
    if (io) {
      io.emit(`event_${media.eventId}_media_deleted`, { id: media._id });
    }

    res.json({ message: 'Media item deleted successfully' });
  } catch (error) {
    console.error('Delete media error:', error);
    res.status(500).json({ error: 'Failed to delete media item' });
  }
});

export default router;
