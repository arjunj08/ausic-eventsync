import express from 'express';
import Team from '../models/Team.js';
import User from '../models/User.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { adminOnly } from '../middleware/roleMiddleware.js';
import { assignUserToTeam, unassignUserFromTeam } from './users.js';

const router = express.Router();

// Get all teams
router.get('/', authMiddleware, async (req, res) => {
  try {
    const teams = await Team.find({})
      .populate('memberIds', 'name email avatar role')
      .populate('eventId', 'title date');
    res.json(teams);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

// Get team by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('memberIds', 'name email avatar role')
      .populate('eventId', 'title date');
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    res.json(team);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch team details' });
  }
});

// Create team (Admin only)
router.post('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { name, color, memberIds, eventId } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Team name is required' });
    }

    const team = new Team({
      name,
      color: color || '#7C3AED',
      memberIds: memberIds || [],
      eventId: eventId || null
    });

    await team.save();

    // If memberIds are provided, update their teamId field
    if (memberIds && memberIds.length > 0) {
      await User.updateMany(
        { _id: { $in: memberIds } },
        { $set: { teamId: team._id } }
      );
    }

    res.status(201).json(team);
  } catch (error) {
    console.error('Create team error:', error);
    res.status(500).json({ error: 'Failed to create team' });
  }
});

// Add member to team
router.patch('/:id/members/add', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { memberId } = req.body;
    if (!memberId) {
      return res.status(400).json({ error: 'Member ID is required' });
    }

    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    if (team.memberIds.includes(memberId)) {
      return res.status(400).json({ error: 'User is already a member of this team' });
    }

    team.memberIds.push(memberId);
    await team.save();

    // Update user
    await User.findByIdAndUpdate(memberId, { $set: { teamId: team._id } });

    res.json(team);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add member to team' });
  }
});

// Remove member from team
router.patch('/:id/members/remove', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { memberId } = req.body;
    if (!memberId) {
      return res.status(400).json({ error: 'Member ID is required' });
    }

    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    team.memberIds = team.memberIds.filter(id => String(id) !== String(memberId));
    await team.save();

    // Update user
    await User.findByIdAndUpdate(memberId, { $set: { teamId: null } });

    res.json(team);
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove member from team' });
  }
});

// Delete team (Admin only)
router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const team = await Team.findByIdAndDelete(req.params.id);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Clear teamId from users
    await User.updateMany({ teamId: req.params.id }, { $set: { teamId: null } });

    res.json({ message: 'Team deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete team' });
  }
});

// Add member to team (POST /api/teams/:teamId/add-member)
router.post('/:teamId/add-member', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    const user = await assignUserToTeam(userId, req.params.teamId, req);
    res.json({ message: 'Member added to team successfully', user });
  } catch (error) {
    console.error('Add team member error:', error);
    res.status(500).json({ error: error.message || 'Failed to add member to team' });
  }
});

// Remove member from team (DELETE /api/teams/:teamId/remove-member/:userId)
router.delete('/:teamId/remove-member/:userId', authMiddleware, adminOnly, async (req, res) => {
  try {
    const user = await unassignUserFromTeam(req.params.userId, req);
    res.json({ message: 'Member removed from team successfully', user });
  } catch (error) {
    console.error('Remove team member error:', error);
    res.status(500).json({ error: error.message || 'Failed to remove member from team' });
  }
});

export default router;
