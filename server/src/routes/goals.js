import express from 'express';
import EventGoal from '../models/EventGoal.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import Team from '../models/Team.js';
import Event from '../models/Event.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { adminOnly } from '../middleware/roleMiddleware.js';
import { logActivity } from '../utils/auditLogger.js';

const router = express.Router();

// 1. Add Event Goal (POST /api/goals)
router.post('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { eventId, title, description, targetValue, unit, deadline } = req.body;
    if (!eventId || !title || !targetValue || !deadline) {
      return res.status(400).json({ error: 'Event ID, title, target value, and deadline date are required' });
    }

    const goal = new EventGoal({
      eventId,
      title,
      description: description || '',
      targetValue,
      currentValue: 0,
      unit: unit || '',
      deadline: new Date(deadline),
      status: 'in_progress',
      createdBy: req.user.id
    });

    await goal.save();

    await logActivity(req, req.user.id, req.user.name, req.user.role, 'create_event_goal', 'event', `Created event goal: "${title}"`, { goalId: goal._id, eventId });

    res.status(201).json(goal);
  } catch (error) {
    console.error('Create goal error:', error);
    res.status(500).json({ error: 'Failed to create event goal' });
  }
});

// 2. Get Goals by Event (GET /api/goals/event/:eventId)
router.get('/event/:eventId', authMiddleware, async (req, res) => {
  try {
    const goals = await EventGoal.find({ eventId: req.params.eventId })
      .populate('createdBy', 'name')
      .sort({ createdAt: 1 });
    res.json(goals);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch event goals' });
  }
});

// 3. Edit Event Goal (PATCH /api/goals/:id)
router.patch('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { title, description, targetValue, unit, deadline, status } = req.body;
    const goal = await EventGoal.findById(req.params.id);
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    if (title) goal.title = title;
    if (description !== undefined) goal.description = description;
    if (targetValue) goal.targetValue = targetValue;
    if (unit !== undefined) goal.unit = unit;
    if (deadline) goal.deadline = new Date(deadline);
    if (status) goal.status = status;

    await goal.save();
    res.json(goal);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update goal specifications' });
  }
});

// 4. Update Goal Progress (PATCH /api/goals/:id/update-progress)
router.patch('/:id/update-progress', authMiddleware, async (req, res) => {
  try {
    const { value } = req.body; // absolute value to set progress to
    if (value === undefined || isNaN(value)) {
      return res.status(400).json({ error: 'Valid progress value is required' });
    }

    const goal = await EventGoal.findById(req.params.id);
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    const event = await Event.findById(goal.eventId);
    const oldStatus = goal.status;
    goal.currentValue = Number(value);

    // Auto check achievement status
    if (goal.currentValue >= goal.targetValue) {
      goal.status = 'achieved';
    } else {
      goal.status = 'in_progress';
    }

    await goal.save();

    // Trigger congratulations confetti/broadcast on first achievement
    if (goal.status === 'achieved' && oldStatus !== 'achieved') {
      const io = req.app.get('io');
      if (io) {
        // Broadcast achievement to all team members assigned to this event
        io.emit('goal-achieved-celebration', {
          goalId: goal._id,
          eventId: goal.eventId,
          title: goal.title,
          message: `🎯 Milestone achieved! "${goal.title}" target of ${goal.targetValue} ${goal.unit} has been reached!`
        });
      }

      // Create notification alerts for members in teams assigned to the event
      if (event) {
        const teams = await Team.find({ _id: { $in: event.teamIds } });
        const memberIds = [...new Set(teams.flatMap(t => t.memberIds))];

        const notifications = memberIds.map(mId => ({
          userId: mId,
          type: 'goal_achieved',
          message: `🎯 Milestone achieved: "${goal.title}" (${goal.targetValue} ${goal.unit}) has been reached for event ${event.title}!`,
          read: false
        }));

        if (notifications.length > 0) {
          await Notification.insertMany(notifications);
        }
      }
    }

    res.json(goal);
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({ error: 'Failed to update goal progress values' });
  }
});

export default router;
