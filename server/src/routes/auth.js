import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Team from '../models/Team.js';
import Notification from '../models/Notification.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { sendEmail } from '../services/emailService.js';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};

// Register endpoint
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (role !== 'member' && role !== 'admin') {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    
    // Choose a default purple avatar as per design system secondary accent
    const avatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=7c3aed`;

    const user = new User({
      name,
      email,
      passwordHash,
      role,
      avatar
    });

    await user.save();

    // Notify all admins
    try {
      const admins = await User.find({ role: 'admin' });
      for (const admin of admins) {
        const notif = new Notification({
          userId: admin._id,
          type: 'new_member',
          message: `New member registered: ${user.name} (${user.email}). Assign them to a team!`,
          read: false
        });
        await notif.save();
      }

      // Socket broadcast
      const io = req.app.get('io');
      if (io) {
        io.emit('new-member-registered', {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        });
      }
    } catch (notifErr) {
      console.error('Failed to notify admins of new registration:', notifErr);
    }

    // Create JWT
    const token = jwt.sign({ id: user._id, role: user.role, email: user.email, name: user.name }, JWT_SECRET, {
      expiresIn: '7d'
    });

    res.cookie('token', token, COOKIE_OPTIONS);
    
    // Return user info (omit password)
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        subRole: user.subRole,
        isOnboarded: user.isOnboarded,
        teamId: user.teamId,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      user.twoFactorOtp = otp;
      user.twoFactorOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      await user.save();

      // Dispatch 2FA OTP Email
      await sendEmail(
        user.email,
        'Your 2FA Verification Code',
        '🔐 Two-Factor OTP Code',
        `
          <p>Hi ${user.name},</p>
          <p>Your one-time password (OTP) to sign in to <strong>AUISC EventSync</strong> is:</p>
          <div style="background-color: #1a1a1a; border: 1px solid #222; padding: 15px; border-radius: 8px; margin: 15px 0; text-align: center;">
            <span style="font-size: 28px; font-weight: 800; color: #00BFFF; letter-spacing: 6px;">${otp}</span>
          </div>
          <p>This code will expire in 10 minutes. If you did not attempt to sign in, please secure your account immediately.</p>
        `,
        'Verify OTP',
        'http://localhost:5173/otp-verify'
      );

      return res.json({
        twoFactorRequired: true,
        email: user.email,
        message: 'Two-factor verification code sent to your email.'
      });
    }

    // Create JWT
    const token = jwt.sign({ id: user._id, role: user.role, email: user.email, name: user.name }, JWT_SECRET, {
      expiresIn: '7d'
    });

    res.cookie('token', token, COOKIE_OPTIONS);

    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        subRole: user.subRole,
        isOnboarded: user.isOnboarded,
        teamId: user.teamId,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Logout endpoint
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

// Current User endpoint
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Also include team details if they belong to a team
    let team = null;
    if (user.teamId) {
      team = await Team.findById(user.teamId);
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        subRole: user.subRole,
        isOnboarded: user.isOnboarded,
        teamId: user.teamId,
        avatar: user.avatar,
        createdAt: user.createdAt
      },
      team
    });
  } catch (error) {
    console.error('Fetch me error:', error);
    res.status(500).json({ error: 'Server error fetching user profile' });
  }
});

// Fetch all members list (for dropdowns and team settings)
router.get('/members', authMiddleware, async (req, res) => {
  try {
    const members = await User.find({}).select('name email role avatar teamId');
    res.json(members);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch members list' });
  }
});

// Change Password endpoint
router.post('/change-password', authMiddleware, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Both old and new passwords are required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Incorrect current password' });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to update password' });
  }
});

// Request 2FA Setup OTP (authenticated)
router.post('/request-2fa', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.twoFactorOtp = otp;
    user.twoFactorOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    // Send Setup OTP
    await sendEmail(
      user.email,
      'Your 2FA Setup Verification Code',
      '🔐 Enable Two-Factor Authentication',
      `
        <p>Hi ${user.name},</p>
        <p>You requested to enable Two-Factor Authentication for your <strong>AUISC EventSync</strong> account.</p>
        <p>Your setup verification code is:</p>
        <div style="background-color: #1a1a1a; border: 1px solid #222; padding: 15px; border-radius: 8px; margin: 15px 0; text-align: center;">
          <span style="font-size: 28px; font-weight: 800; color: #00BFFF; letter-spacing: 6px;">${otp}</span>
        </div>
        <p>This code will expire in 10 minutes. Enter this code on the settings page to complete your 2FA setup.</p>
      `,
      'Verify Setup Code',
      'http://localhost:5173/settings'
    );

    res.json({ message: 'Setup code sent to your email.' });
  } catch (error) {
    console.error('Request 2FA error:', error);
    res.status(500).json({ error: 'Failed to request 2FA setup code' });
  }
});

// Enable 2FA (authenticated)
router.patch('/enable-2fa', authMiddleware, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'Verification code is required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.twoFactorOtp !== code || user.twoFactorOtpExpires < Date.now()) {
      return res.status(400).json({ error: 'Invalid or expired setup code' });
    }

    user.twoFactorEnabled = true;
    user.twoFactorOtp = '';
    user.twoFactorOtpExpires = null;
    await user.save();

    res.json({ message: 'Two-Factor Authentication enabled successfully' });
  } catch (error) {
    console.error('Enable 2FA error:', error);
    res.status(500).json({ error: 'Failed to enable 2FA' });
  }
});

// Disable 2FA (authenticated)
router.patch('/disable-2fa', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.twoFactorEnabled = false;
    user.twoFactorOtp = '';
    user.twoFactorOtpExpires = null;
    await user.save();

    res.json({ message: 'Two-Factor Authentication disabled successfully' });
  } catch (error) {
    console.error('Disable 2FA error:', error);
    res.status(500).json({ error: 'Failed to disable 2FA' });
  }
});

// Verify 2FA OTP to complete sign in (unauthenticated)
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: 'Email and verification code are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.twoFactorEnabled) {
      return res.status(400).json({ error: 'Two-factor authentication is not enabled for this user' });
    }

    if (user.twoFactorOtp !== code || user.twoFactorOtpExpires < Date.now()) {
      return res.status(400).json({ error: 'Invalid or expired code' });
    }

    // OTP is valid, clear it
    user.twoFactorOtp = '';
    user.twoFactorOtpExpires = null;
    await user.save();

    // Create JWT
    const token = jwt.sign({ id: user._id, role: user.role, email: user.email, name: user.name }, JWT_SECRET, {
      expiresIn: '7d'
    });

    res.cookie('token', token, COOKIE_OPTIONS);

    res.json({
      message: 'OTP verification successful. Login successful.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        subRole: user.subRole,
        isOnboarded: user.isOnboarded,
        teamId: user.teamId,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'Server error during OTP verification' });
  }
});

// Resend 2FA OTP (unauthenticated)
router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.twoFactorEnabled) {
      return res.status(400).json({ error: 'Two-factor authentication is not enabled for this user' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.twoFactorOtp = otp;
    user.twoFactorOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    // Dispatch 2FA OTP Email
    await sendEmail(
      user.email,
      'Your 2FA Verification Code',
      '🔐 Two-Factor OTP Code',
      `
        <p>Hi ${user.name},</p>
        <p>Your one-time password (OTP) to sign in to <strong>AUISC EventSync</strong> is:</p>
        <div style="background-color: #1a1a1a; border: 1px solid #222; padding: 15px; border-radius: 8px; margin: 15px 0; text-align: center;">
          <span style="font-size: 28px; font-weight: 800; color: #00BFFF; letter-spacing: 6px;">${otp}</span>
        </div>
        <p>This code will expire in 10 minutes. If you did not attempt to sign in, please secure your account immediately.</p>
      `,
      'Verify OTP',
      'http://localhost:5173/otp-verify'
    );

    res.json({ message: 'Two-factor verification code resent to your email.' });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ error: 'Failed to resend verification code' });
  }
});

export default router;
