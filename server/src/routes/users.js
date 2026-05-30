import express from 'express';
import User from '../models/User.js';
import Team from '../models/Team.js';
import Notification from '../models/Notification.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { adminOnly } from '../middleware/roleMiddleware.js';

const router = express.Router();

// 1. Get current onboarding details
router.get('/onboarding', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('isOnboarded name email yearOfStudy department skills bio');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve onboarding details' });
  }
});

// 2. Complete onboarding flow (basic details + skills tags + automatic squad assignment)
router.patch('/onboarding/complete', authMiddleware, async (req, res) => {
  try {
    const { bio, yearOfStudy, department, skills } = req.body;
    
    if (!yearOfStudy || !department || !skills || !Array.isArray(skills) || skills.length === 0) {
      return res.status(400).json({ error: 'Year, department, and at least one skill are required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.bio = bio || '';
    user.yearOfStudy = yearOfStudy;
    user.department = department;
    user.skills = skills;
    user.isOnboarded = true;

    // Automatic squad team allocation rules based on skills
    const skillsStr = skills.map(s => s.toLowerCase()).join(' ');
    let targetTeamName = 'Logistics Team';
    let targetColor = '#E74C3C'; // Red theme for logistics

    if (skillsStr.includes('design') || skillsStr.includes('photography') || skillsStr.includes('video') || skillsStr.includes('art')) {
      targetTeamName = 'Design Squad';
      targetColor = '#8F5CFF'; // Purple theme for design
    } else if (skillsStr.includes('development') || skillsStr.includes('coding') || skillsStr.includes('programming') || skillsStr.includes('software')) {
      targetTeamName = 'Dev Force';
      targetColor = '#00BFFF'; // Cyan theme for tech dev
    } else if (skillsStr.includes('marketing') || skillsStr.includes('social') || skillsStr.includes('content') || skillsStr.includes('writing')) {
      targetTeamName = 'Media Team';
      targetColor = '#2ECC71'; // Green theme for media
    } else if (skillsStr.includes('finance') || skillsStr.includes('accounting') || skillsStr.includes('budget')) {
      targetTeamName = 'Finance Team';
      targetColor = '#F1C40F'; // Yellow theme for budget
    }

    // Look up or create team on the fly
    let team = await Team.findOne({ name: targetTeamName });
    if (!team) {
      team = new Team({
        name: targetTeamName,
        color: targetColor,
        memberIds: [user._id]
      });
      await team.save();
    } else {
      // Add member to team if not already present
      if (!team.memberIds.includes(user._id)) {
        team.memberIds.push(user._id);
        await team.save();
      }
    }

    user.teamId = team._id;
    await user.save();

    // Create a welcoming notification
    const welcomeNotif = new Notification({
      userId: user._id,
      type: 'onboarding_welcome',
      message: `🎉 Welcome to AUISC EventSync! You have been auto-assigned to "${targetTeamName}" based on your skills.`,
      read: false
    });
    await welcomeNotif.save();

    // Notify all admins of user onboarding completion
    try {
      const admins = await User.find({ role: 'admin' });
      const io = req.app.get('io');
      for (const admin of admins) {
        const notif = new Notification({
          userId: admin._id,
          type: 'member_onboarded',
          message: `👤 ${user.name} has finished onboarding and joined "${targetTeamName}".`,
          read: false
        });
        await notif.save();
        if (io) {
          io.to(String(admin._id)).emit('new_notification', notif);
        }
      }
    } catch (err) {
      console.error('Failed to notify admins of onboarding:', err);
    }

    res.json({
      message: 'Onboarding completed successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        subRole: user.subRole,
        teamId: user.teamId,
        avatar: user.avatar,
        isOnboarded: user.isOnboarded
      },
      team
    });
  } catch (error) {
    console.error('Complete onboarding error:', error);
    res.status(500).json({ error: 'Failed to complete onboarding' });
  }
});

// 3. Update User subrole (Admin only)
router.patch('/:id/subrole', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { subRole } = req.body;
    if (!subRole || !['team_lead', 'treasurer', 'coordinator', 'member'].includes(subRole)) {
      return res.status(400).json({ error: 'Valid subrole is required' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.subRole = subRole;
    await user.save();

    // Send notification to the user
    const notif = new Notification({
      userId: user._id,
      type: 'subrole_promoted',
      message: `🛡️ Your subrole has been updated to "${subRole.replace('_', ' ').toUpperCase()}" by admin.`,
      read: false
    });
    await notif.save();

    const io = req.app.get('io');
    if (io) {
      io.to(String(user._id)).emit('new_notification', notif);
    }

    res.json({ message: 'Subrole updated successfully', user });
  } catch (error) {
    console.error('Update subrole error:', error);
    res.status(500).json({ error: 'Failed to update subrole' });
  }
});

export default router;
