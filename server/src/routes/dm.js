import express from 'express';
import DMConversation from '../models/DMConversation.js';
import DMMessage from '../models/DMMessage.js';
import User from '../models/User.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// 1. Create or retrieve DM conversation (POST /api/dm/conversations)
router.post('/conversations', authMiddleware, async (req, res) => {
  try {
    const { recipientId } = req.body;
    if (!recipientId) {
      return res.status(400).json({ error: 'Recipient user ID is required' });
    }

    if (String(req.user.id) === String(recipientId)) {
      return res.status(400).json({ error: 'Cannot start conversation with yourself' });
    }

    // Check if conversation already exists
    let conversation = await DMConversation.findOne({
      participants: { $all: [req.user.id, recipientId] }
    });

    if (!conversation) {
      conversation = new DMConversation({
        participants: [req.user.id, recipientId]
      });
      await conversation.save();
    }

    res.status(201).json(conversation);
  } catch (error) {
    console.error('Create DM conversation error:', error);
    res.status(500).json({ error: 'Failed to create direct chat conversation' });
  }
});

// 2. Fetch conversations for current user (GET /api/dm/conversations)
router.get('/conversations', authMiddleware, async (req, res) => {
  try {
    const conversations = await DMConversation.find({
      participants: req.user.id
    })
      .populate('participants', 'name email avatar status')
      .sort({ lastMessageAt: -1 });

    // Format output: return recipient details directly as a key
    const formatted = conversations.map(c => {
      const recipient = c.participants.find(p => String(p._id) !== String(req.user.id));
      return {
        id: c._id,
        recipient: recipient || { name: 'Deleted User', avatar: '' },
        lastMessage: c.lastMessage,
        lastMessageAt: c.lastMessageAt
      };
    });

    res.json(formatted);
  } catch (error) {
    console.error('Fetch DM conversations error:', error);
    res.status(500).json({ error: 'Failed to fetch conversations list' });
  }
});

// 3. Get messages of conversation (GET /api/dm/conversations/:id/messages)
router.get('/conversations/:id/messages', authMiddleware, async (req, res) => {
  try {
    const conversation = await DMConversation.findById(req.params.id);
    if (!conversation || !conversation.participants.includes(req.user.id)) {
      return res.status(403).json({ error: 'Access denied to this conversation' });
    }

    const messages = await DMMessage.find({ conversationId: req.params.id })
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages thread' });
  }
});

// 4. Send message in conversation (POST /api/dm/conversations/:id/messages)
router.post('/conversations/:id/messages', authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Message content text is required' });
    }

    const conversation = await DMConversation.findById(req.params.id);
    if (!conversation || !conversation.participants.includes(req.user.id)) {
      return res.status(403).json({ error: 'Access denied to this conversation' });
    }

    const messageDoc = new DMMessage({
      conversationId: conversation._id,
      senderId: req.user.id,
      senderName: req.user.name,
      text: text.trim()
    });

    await messageDoc.save();

    // Update conversation last message details
    conversation.lastMessage = text.trim();
    conversation.lastMessageAt = new Date();
    await conversation.save();

    // Emit via Socket.io
    const io = req.app.get('io');
    if (io) {
      // Emit to room (requires participants to join the conversation._id room)
      io.to(String(conversation._id)).emit('dm_message', messageDoc);

      // Notify the recipient with unread message details
      const recipientId = conversation.participants.find(p => String(p) !== String(req.user.id));
      const activeUsers = req.app.get('activeUsers');
      if (recipientId && activeUsers) {
        const socketId = activeUsers.get(String(recipientId));
        if (socketId) {
          io.to(socketId).emit('unread-message-notif', {
            senderId: req.user.id,
            senderName: req.user.name,
            message: text.trim().substring(0, 50)
          });
        }
      }
    }

    res.status(201).json(messageDoc);
  } catch (error) {
    console.error('Send DM error:', error);
    res.status(500).json({ error: 'Failed to send direct message' });
  }
});

// 5. Mark messages in conversation as read (PATCH /api/dm/conversations/:id/read)
router.patch('/conversations/:id/read', authMiddleware, async (req, res) => {
  try {
    const conversation = await DMConversation.findById(req.params.id);
    if (!conversation || !conversation.participants.includes(req.user.id)) {
      return res.status(403).json({ error: 'Access denied to this conversation' });
    }

    // Mark all incoming messages as read
    await DMMessage.updateMany(
      { conversationId: req.params.id, senderId: { $ne: req.user.id }, isRead: false },
      { $set: { isRead: true } }
    );

    // Notify other user via sockets so read receipts check ticks update
    const io = req.app.get('io');
    if (io) {
      io.to(String(conversation._id)).emit('dm_messages_read', {
        conversationId: conversation._id,
        readBy: req.user.id
      });
    }

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

export default router;
