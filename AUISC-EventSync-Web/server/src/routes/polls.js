import express from 'express';
import Poll from '../models/Poll.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { adminOnly } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Create a new poll (Admin only)
router.post('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { question, options, eventId, teamId, expiresInHours } = req.body;
    
    if (!question || !options || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({ error: 'Question and at least 2 options are required' });
    }

    const formattedOptions = options.map(opt => ({
      text: opt,
      votes: []
    }));

    const expiresAt = expiresInHours 
      ? new Date(Date.now() + expiresInHours * 60 * 60 * 1000) 
      : new Date(Date.now() + 24 * 60 * 60 * 1000); // default 24 hours

    const poll = new Poll({
      question,
      options: formattedOptions,
      createdBy: req.user.id,
      eventId: eventId || null,
      teamId: teamId || null,
      expiresAt,
      isActive: true
    });

    await poll.save();

    // Broadcast new poll via WebSockets
    const io = req.app.get('io');
    if (io) {
      io.emit('new_poll', poll);
    }

    res.status(201).json(poll);
  } catch (error) {
    console.error('Create poll error:', error);
    res.status(500).json({ error: 'Failed to create poll' });
  }
});

// Fetch active polls for an event
router.get('/event/:eventId', authMiddleware, async (req, res) => {
  try {
    const polls = await Poll.find({ eventId: req.params.eventId }).sort({ createdAt: -1 });
    res.json(polls);
  } catch (error) {
    console.error('Fetch polls error:', error);
    res.status(500).json({ error: 'Failed to fetch polls' });
  }
});

// Cast a vote in a poll
router.post('/:id/vote', authMiddleware, async (req, res) => {
  try {
    const { optionIndex } = req.body;
    const userId = req.user.id;

    if (optionIndex === undefined || optionIndex < 0) {
      return res.status(400).json({ error: 'Valid option index is required' });
    }

    const poll = await Poll.findById(req.params.id);
    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    // Check if expired
    if (poll.expiresAt && new Date() > new Date(poll.expiresAt)) {
      poll.isActive = false;
      await poll.save();
      return res.status(400).json({ error: 'Poll has expired' });
    }

    // Check if user already voted in this poll (in any option)
    let alreadyVoted = false;
    poll.options.forEach(opt => {
      if (opt.votes.includes(userId)) {
        alreadyVoted = true;
      }
    });

    if (alreadyVoted) {
      return res.status(400).json({ error: 'You have already voted in this poll' });
    }

    if (optionIndex >= poll.options.length) {
      return res.status(400).json({ error: 'Invalid option index' });
    }

    // Add user vote
    poll.options[optionIndex].votes.push(userId);
    await poll.save();

    // Broadcast updated poll status
    const io = req.app.get('io');
    if (io) {
      io.emit('vote_cast', poll);
    }

    res.json(poll);
  } catch (error) {
    console.error('Vote error:', error);
    res.status(500).json({ error: 'Failed to cast vote' });
  }
});

// Close a poll manually (Admin only)
router.post('/:id/close', authMiddleware, adminOnly, async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    poll.isActive = false;
    await poll.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('poll_closed', poll);
    }

    res.json(poll);
  } catch (error) {
    console.error('Close poll error:', error);
    res.status(500).json({ error: 'Failed to close poll' });
  }
});

export default router;
