import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import User from '../models/User.js';
import Team from '../models/Team.js';
import Task from '../models/Task.js';
import Expense from '../models/Expense.js';
import Attendance from '../models/Attendance.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get directory name safely in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure Multer Storage for Avatars
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB Limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|svg/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only images (jpg, png, gif, svg) are allowed!'));
  }
});

// Helper function to dynamically calculate badges for a user
export const recalculateUserBadges = async (userId) => {
  const user = await User.findById(userId);
  if (!user) return [];

  const earnedBadges = [];

  // 1. "Team Player" badge: Assigned to a squad
  if (user.teamId) {
    earnedBadges.push({
      name: 'Team Player',
      icon: 'users',
      earnedAt: new Date()
    });
  }

  // 2. "First Task" badge: Has completed at least one task
  // Task status may be stored as 'done' or 'Done' (case-insensitive)
  const completedTask = await Task.findOne({
    assigneeId: userId,
    status: { $regex: /^done$/i }
  });
  if (completedTask) {
    earnedBadges.push({
      name: 'First Task',
      icon: 'check-circle',
      earnedAt: new Date()
    });
  }

  // 3. "Event Star" badge: Attended at least 3 events
  const attendCount = await Attendance.countDocuments({ userId });
  if (attendCount >= 3) {
    earnedBadges.push({
      name: 'Event Star',
      icon: 'star',
      earnedAt: new Date()
    });
  }

  // 4. "Budget Keeper" badge: Submitted at least 1 approved expense
  const approvedExpense = await Expense.findOne({
    submittedBy: userId,
    status: { $regex: /^approved$/i }
  });
  if (approvedExpense) {
    earnedBadges.push({
      name: 'Budget Keeper',
      icon: 'dollar-sign',
      earnedAt: new Date()
    });
  }

  user.badges = earnedBadges;
  await user.save();
  return earnedBadges;
};

// Get profile by User ID (or "me")
router.get('/:userId', authMiddleware, async (req, res) => {
  try {
    let targetId = req.params.userId;
    if (targetId === 'me') {
      targetId = req.user.id;
    }

    const userProfile = await User.findById(targetId).select('-passwordHash');
    if (!userProfile) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Populate team details manually
    let teamDetails = null;
    if (userProfile.teamId) {
      teamDetails = await Team.findById(userProfile.teamId);
    }

    // Trigger badge recalculation to ensure they are up to date
    const badges = await recalculateUserBadges(targetId);

    res.json({
      user: {
        id: userProfile._id,
        name: userProfile.name,
        email: userProfile.email,
        role: userProfile.role,
        avatar: userProfile.avatar,
        bio: userProfile.bio || '',
        skills: userProfile.skills || [],
        badges: userProfile.badges || [],
        socialLinks: userProfile.socialLinks || { linkedin: '', github: '', instagram: '' },
        teamRole: userProfile.teamRole || '',
        settings: userProfile.settings || { notificationSound: true, emailAlerts: true, aiPersona: 'helpful' },
        createdAt: userProfile.createdAt
      },
      team: teamDetails
    });
  } catch (error) {
    console.error('Fetch profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Update profile details
router.patch('/me', authMiddleware, async (req, res) => {
  try {
    const { bio, skills, socialLinks, teamRole } = req.body;
    const updateData = {};

    if (bio !== undefined) updateData.bio = bio;
    if (skills !== undefined) updateData.skills = skills;
    if (teamRole !== undefined) updateData.teamRole = teamRole;
    if (socialLinks !== undefined) {
      updateData.socialLinks = {
        linkedin: socialLinks.linkedin || '',
        github: socialLinks.github || '',
        instagram: socialLinks.instagram || ''
      };
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateData },
      { new: true }
    ).select('-passwordHash');

    // Recalculate badges
    await recalculateUserBadges(req.user.id);

    res.json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Update settings
router.patch('/settings/me', authMiddleware, async (req, res) => {
  try {
    const { notificationSound, emailAlerts, aiPersona } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.settings === undefined) {
      user.settings = {};
    }

    if (notificationSound !== undefined) user.settings.notificationSound = notificationSound;
    if (emailAlerts !== undefined) user.settings.emailAlerts = emailAlerts;
    if (aiPersona !== undefined) user.settings.aiPersona = aiPersona;

    await user.save();
    res.json({ message: 'Settings updated successfully', settings: user.settings });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Upload avatar image
router.post('/upload-avatar', authMiddleware, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }

    // Expose static URL
    const avatarUrl = `http://localhost:5000/uploads/${req.file.filename}`;
    
    await User.findByIdAndUpdate(req.user.id, { $set: { avatar: avatarUrl } });

    res.json({ message: 'Avatar uploaded successfully', avatarUrl });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload avatar' });
  }
});

export default router;
