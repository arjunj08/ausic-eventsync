import express from 'express';
import Comment from '../models/Comment.js';
import Event from '../models/Event.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// 1. Post a comment or reply
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { eventId, text, parentId } = req.body;
    if (!eventId || !text) {
      return res.status(400).json({ error: 'Event ID and comment text are required' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const comment = new Comment({
      eventId,
      authorId: req.user.id,
      authorName: req.user.name,
      authorAvatar: req.user.avatar || '',
      text,
      parentId: parentId || null
    });

    await comment.save();

    // Retrieve full comment data (populated if needed, or simply return)
    const io = req.app.get('io');
    if (io) {
      // Emit comment update to the event's real-time discussion room
      io.emit(`event_${eventId}_new_comment`, comment);
    }

    // Async task: Notify assigned team members (except author)
    try {
      if (event.teamIds && event.teamIds.length > 0) {
        const members = await User.find({
          teamId: { $in: event.teamIds },
          _id: { $ne: req.user.id }
        });

        const notifications = members.map(m => ({
          userId: m._id,
          type: 'new_comment',
          message: `💬 ${req.user.name} commented in event "${event.title}": "${text.substring(0, 30)}..."`,
          read: false
        }));

        if (notifications.length > 0) {
          await Notification.insertMany(notifications);
          if (io) {
            members.forEach((m, idx) => {
              io.to(String(m._id)).emit('new_notification', notifications[idx]);
            });
          }
        }
      }
    } catch (notifErr) {
      console.error('Failed to notify team of comment:', notifErr);
    }

    res.status(201).json(comment);
  } catch (error) {
    console.error('Post comment error:', error);
    res.status(500).json({ error: 'Failed to post comment' });
  }
});

// 2. Get discussions for an event
router.get('/event/:eventId', authMiddleware, async (req, res) => {
  try {
    const { eventId } = req.params;
    // Get all non-deleted comments for the event, sort pinned first, then newest
    const comments = await Comment.find({ eventId, isDeleted: false })
      .sort({ isPinned: -1, createdAt: -1 });

    res.json(comments);
  } catch (error) {
    console.error('Fetch comments error:', error);
    res.status(500).json({ error: 'Failed to fetch discussions' });
  }
});

// 3. Pin a comment (Admin only)
router.patch('/:id/pin', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized. Only admins can pin comments.' });
    }

    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    comment.isPinned = !comment.isPinned;
    await comment.save();

    const io = req.app.get('io');
    if (io) {
      io.emit(`event_${comment.eventId}_comment_update`, comment);
    }

    res.json(comment);
  } catch (error) {
    console.error('Pin comment error:', error);
    res.status(500).json({ error: 'Failed to pin comment' });
  }
});

// 4. React to a comment with an emoji
router.patch('/:id/react', authMiddleware, async (req, res) => {
  try {
    const { emoji } = req.body;
    if (!emoji) {
      return res.status(400).json({ error: 'Emoji reaction is required' });
    }

    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Toggle reaction
    const userId = req.user.id;
    let reactObj = comment.reactions.find(r => r.emoji === emoji);

    if (reactObj) {
      const index = reactObj.userIds.indexOf(userId);
      if (index > -1) {
        // User already reacted, remove user from list
        reactObj.userIds.splice(index, 1);
        // If no user left for this emoji, remove the emoji reaction object entirely
        if (reactObj.userIds.length === 0) {
          comment.reactions = comment.reactions.filter(r => r.emoji !== emoji);
        }
      } else {
        reactObj.userIds.push(userId);
      }
    } else {
      comment.reactions.push({
        emoji,
        userIds: [userId]
      });
    }

    await comment.save();

    const io = req.app.get('io');
    if (io) {
      io.emit(`event_${comment.eventId}_comment_update`, comment);
    }

    res.json(comment);
  } catch (error) {
    console.error('React comment error:', error);
    res.status(500).json({ error: 'Failed to react to comment' });
  }
});

// 5. Delete a comment (Author or Admin)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Authorization check
    const isAuthor = String(comment.authorId) === String(req.user.id);
    const isAdmin = req.user.role === 'admin';

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ error: 'Unauthorized to delete this comment' });
    }

    // Soft delete to preserve thread replies hierarchy visual integrity
    comment.isDeleted = true;
    await comment.save();

    const io = req.app.get('io');
    if (io) {
      io.emit(`event_${comment.eventId}_comment_deleted`, { id: comment._id });
    }

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

export default router;
