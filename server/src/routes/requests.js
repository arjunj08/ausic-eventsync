import express from 'express';
import CrossTeamRequest from '../models/CrossTeamRequest.js';
import Team from '../models/Team.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get requests for the user's team or requests created by user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    let query = {};
    
    // If not admin, restrict to requests related to user's team
    if (req.user.role !== 'admin' && user.teamId) {
      query = {
        $or: [
          { fromTeamId: user.teamId },
          { toTeamId: user.teamId }
        ]
      };
    } else if (req.user.role !== 'admin') {
      query = { createdBy: req.user.id };
    }

    const requests = await CrossTeamRequest.find(query)
      .populate('fromTeamId', 'name color')
      .populate('toTeamId', 'name color')
      .populate('createdBy', 'name email avatar')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error('Fetch requests error:', error);
    res.status(500).json({ error: 'Failed to fetch cross-team requests' });
  }
});

// Create a new request
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { toTeamId, message } = req.body;
    
    if (!toTeamId || !message) {
      return res.status(400).json({ error: 'Target team and message are required' });
    }

    // Get the sender's team
    const sender = await User.findById(req.user.id);
    if (!sender.teamId) {
      return res.status(400).json({ error: 'You must belong to a team to create cross-team requests' });
    }

    if (String(sender.teamId) === String(toTeamId)) {
      return res.status(400).json({ error: 'Cannot send a collaboration request to your own team' });
    }

    const request = new CrossTeamRequest({
      fromTeamId: sender.teamId,
      toTeamId,
      message,
      status: 'pending',
      createdBy: req.user.id
    });

    await request.save();

    // Create notifications for all members of the target team
    const targetTeam = await Team.findById(toTeamId);
    if (targetTeam) {
      const targetTeamMembers = await User.find({ teamId: toTeamId });
      const senderTeam = await Team.findById(sender.teamId);
      const notifications = targetTeamMembers.map(member => ({
        userId: member._id,
        type: 'cross_team_request',
        message: `New cross-team request received from "${senderTeam.name}": "${message}"`,
        read: false
      }));
      await Notification.insertMany(notifications);
    }

    res.status(201).json(request);
  } catch (error) {
    console.error('Create request error:', error);
    res.status(500).json({ error: 'Failed to create cross-team request' });
  }
});

// Update request status (Accept/Reject)
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const request = await CrossTeamRequest.findById(req.params.id)
      .populate('fromTeamId', 'name')
      .populate('toTeamId', 'name');
      
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Validate that the user belongs to the receiving team (toTeamId) or is an admin
    const user = await User.findById(req.user.id);
    const isAdmin = req.user.role === 'admin';
    const isRecipientTeam = user.teamId && String(user.teamId) === String(request.toTeamId._id);

    if (!isAdmin && !isRecipientTeam) {
      return res.status(403).json({ error: 'Only members of the receiving team or admins can accept/reject this request' });
    }

    request.status = status;
    await request.save();

    // Notify the creator of the request
    const notif = new Notification({
      userId: request.createdBy,
      type: 'request_updated',
      message: `Your cross-team request to "${request.toTeamId.name}" has been ${status}.`,
      read: false
    });
    await notif.save();

    res.json(request);
  } catch (error) {
    console.error('Update request status error:', error);
    res.status(500).json({ error: 'Failed to update request status' });
  }
});

export default router;
