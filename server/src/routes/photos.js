import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import cloudinary from 'cloudinary';
import Photo from '../models/Photo.js';
import PhotoAlbum from '../models/PhotoAlbum.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { adminOnly } from '../middleware/roleMiddleware.js';
import { logActivity } from '../utils/auditLogger.js';

const router = express.Router();

// Multer disk upload setup
const uploadDir = 'uploads';
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Configure Cloudinary if credentials are provided in env
const cloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET;
if (cloudinaryConfigured) {
  cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

// Helper: Handle upload to local file or Cloudinary
const uploadImageFile = async (file) => {
  if (cloudinaryConfigured) {
    try {
      const result = await cloudinary.v2.uploader.upload(file.path, {
        folder: 'eventsync'
      });
      // Delete temporary local file
      fs.unlink(file.path, (err) => {
        if (err) console.error('Failed to delete temp file:', err);
      });
      return {
        url: result.secure_url,
        thumbnailUrl: result.eager ? result.eager[0].secure_url : result.secure_url
      };
    } catch (err) {
      console.error('Cloudinary upload failed, falling back to local storage:', err);
    }
  }
  return {
    url: `/uploads/${file.filename}`,
    thumbnailUrl: `/uploads/${file.filename}`
  };
};

// 1. Single Photo Upload (POST /api/photos/upload)
router.post('/upload', authMiddleware, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { eventId, teamId, caption, album } = req.body;
    const { url, thumbnailUrl } = await uploadImageFile(req.file);

    const photo = new Photo({
      eventId: eventId || null,
      teamId: teamId || null,
      uploadedBy: req.user.id,
      url,
      thumbnailUrl,
      caption: caption || '',
      album: album || '',
      fileSize: req.file.size
    });

    await photo.save();

    await logActivity(req, req.user.id, req.user.name, req.user.role, 'upload_photo', 'event', `Uploaded photo: ${url}`, { photoId: photo._id, eventId, teamId });

    res.status(201).json(photo);
  } catch (error) {
    console.error('Photo upload error:', error);
    res.status(500).json({ error: 'Failed to upload photo' });
  }
});

// 2. Bulk Photo Upload (POST /api/photos/bulk-upload)
router.post('/bulk-upload', authMiddleware, upload.array('photos', 50), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const { eventId, teamId, album } = req.body;
    const uploadedPhotos = [];

    for (const file of req.files) {
      const { url, thumbnailUrl } = await uploadImageFile(file);
      const photo = new Photo({
        eventId: eventId || null,
        teamId: teamId || null,
        uploadedBy: req.user.id,
        url,
        thumbnailUrl,
        caption: '',
        album: album || '',
        fileSize: file.size
      });
      await photo.save();
      uploadedPhotos.push(photo);
    }

    await logActivity(req, req.user.id, req.user.name, req.user.role, 'bulk_upload_photos', 'event', `Uploaded ${uploadedPhotos.length} photos in bulk.`, { eventId, teamId });

    res.status(201).json(uploadedPhotos);
  } catch (error) {
    console.error('Bulk photo upload error:', error);
    res.status(500).json({ error: 'Failed to bulk upload photos' });
  }
});

// 3. Get photos by Event ID (GET /api/photos/event/:eventId)
router.get('/event/:eventId', authMiddleware, async (req, res) => {
  try {
    const photos = await Photo.find({ eventId: req.params.eventId })
      .populate('uploadedBy', 'name avatar')
      .populate('likes', 'name')
      .populate('tags.userId', 'name avatar')
      .sort({ createdAt: -1 });
    res.json(photos);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch event photos' });
  }
});

// 4. Get photos by Event and Album Name (GET /api/photos/event/:eventId/album/:albumName)
router.get('/event/:eventId/album/:albumName', authMiddleware, async (req, res) => {
  try {
    const photos = await Photo.find({ eventId: req.params.eventId, album: req.params.albumName })
      .populate('uploadedBy', 'name avatar')
      .sort({ createdAt: -1 });
    res.json(photos);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch photos in album' });
  }
});

// 5. Toggle Like on Photo (POST /api/photos/:id/like)
router.post('/:id/like', authMiddleware, async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.id);
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    const likeIdx = photo.likes.indexOf(req.user.id);
    if (likeIdx > -1) {
      photo.likes.splice(likeIdx, 1);
    } else {
      photo.likes.push(req.user.id);
    }

    await photo.save();
    res.json(photo);
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle photo like' });
  }
});

// 6. Tag Member in Photo (POST /api/photos/:id/tag)
router.post('/:id/tag', authMiddleware, async (req, res) => {
  try {
    const { userId, x, y } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'User ID to tag is required' });
    }

    const photo = await Photo.findById(req.params.id).populate('eventId', 'title');
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    // Add tag
    photo.tags.push({ userId, x, y });
    await photo.save();

    // Notify tagged member
    const taggedUser = await User.findById(userId);
    if (taggedUser) {
      const eventName = photo.eventId ? photo.eventId.title : 'a photo gallery';
      const notif = new Notification({
        userId: taggedUser._id,
        type: 'photo_tagged',
        message: `You were tagged in a photo at ${eventName} 📸`,
        read: false
      });
      await notif.save();
      const io = req.app.get('io');
      if (io) {
        io.to(String(taggedUser._id)).emit('new_notification', notif);
      }
    }

    res.json(photo);
  } catch (error) {
    console.error('Tag photo error:', error);
    res.status(500).json({ error: 'Failed to tag user in photo' });
  }
});

// 7. Delete Photo (DELETE /api/photos/:id)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.id);
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    // Verify ownership or admin role
    if (String(photo.uploadedBy) !== String(req.user.id) && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized to delete this photo' });
    }

    // Try to delete local file if it exists and URL is local
    if (photo.url.startsWith('/uploads/')) {
      const filePath = path.join(process.cwd(), photo.url.substring(1));
      if (fs.existsSync(filePath)) {
        fs.unlink(filePath, (err) => {
          if (err) console.error('Failed to delete file from disk:', err);
        });
      }
    }

    await Photo.findByIdAndDelete(req.params.id);

    await logActivity(req, req.user.id, req.user.name, req.user.role, 'delete_photo', 'event', `Deleted photo: ${photo.url}`, { photoId: photo._id });

    res.json({ message: 'Photo deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete photo' });
  }
});

// 8. Report Inappropriate Photo (POST /api/photos/:id/report)
router.post('/:id/report', authMiddleware, async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.id);
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    photo.isReported = true;
    if (!photo.reportedBy.includes(req.user.id)) {
      photo.reportedBy.push(req.user.id);
    }
    await photo.save();

    // Notify admins of reported photo
    const admins = await User.find({ role: 'admin' });
    const io = req.app.get('io');
    for (const admin of admins) {
      const notif = new Notification({
        userId: admin._id,
        type: 'photo_reported',
        message: `⚠️ Reported photo flagged for admin review.`,
        read: false
      });
      await notif.save();
      if (io) {
        io.to(String(admin._id)).emit('new_notification', notif);
      }
    }

    res.json({ message: 'Photo reported successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to report photo' });
  }
});

// 9. Get photos where User is tagged (GET /api/photos/my-tags/:userId)
router.get('/my-tags/:userId', authMiddleware, async (req, res) => {
  try {
    const photos = await Photo.find({ 'tags.userId': req.params.userId })
      .populate('uploadedBy', 'name avatar')
      .sort({ createdAt: -1 });
    res.json(photos);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tagged photos' });
  }
});

// 10. Mark Photo as Featured (PATCH /api/photos/:id/feature)
router.patch('/:id/feature', authMiddleware, adminOnly, async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.id);
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    // Reset other featured photos of this event first
    if (photo.eventId) {
      await Photo.updateMany({ eventId: photo.eventId }, { $set: { isFeatured: false } });
    }

    photo.isFeatured = true;
    await photo.save();

    res.json(photo);
  } catch (error) {
    res.status(500).json({ error: 'Failed to feature photo' });
  }
});

// 11. Download All Photos as ZIP (GET /api/photos/download-all/:eventId)
router.get('/download-all/:eventId', authMiddleware, async (req, res) => {
  try {
    const photos = await Photo.find({ eventId: req.params.eventId });
    if (!photos || photos.length === 0) {
      return res.status(404).json({ error: 'No photos found for this event' });
    }

    const zip = new JSZip();
    for (const photo of photos) {
      if (photo.url.startsWith('/uploads/')) {
        const filePath = path.join(process.cwd(), photo.url.substring(1));
        if (fs.existsSync(filePath)) {
          const fileData = fs.readFileSync(filePath);
          const fileName = path.basename(filePath);
          zip.file(fileName, fileData);
        }
      }
    }

    const content = await zip.generateAsync({ type: 'nodebuffer' });
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename=event-${req.params.eventId}-gallery.zip`);
    res.send(content);
  } catch (error) {
    console.error('Failed to create photos ZIP archive:', error);
    res.status(500).json({ error: 'Failed to generate ZIP archive' });
  }
});

// 12. Get Reported Photos Queue (GET /api/photos/reported/queue)
router.get('/reported/queue', authMiddleware, adminOnly, async (req, res) => {
  try {
    const photos = await Photo.find({ isReported: true })
      .populate('uploadedBy', 'name email avatar')
      .sort({ createdAt: -1 });
    res.json(photos);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reported photos queue' });
  }
});

// 13. Get Team photos (GET /api/photos/team/:teamId)
router.get('/team/:teamId', authMiddleware, async (req, res) => {
  try {
    const photos = await Photo.find({ teamId: req.params.teamId })
      .populate('uploadedBy', 'name avatar')
      .sort({ createdAt: -1 });
    res.json(photos);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch team photos' });
  }
});

export default router;
