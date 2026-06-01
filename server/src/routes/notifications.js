import express from 'express';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { getPublicKey, sendPushNotification } from '../utils/pushNotifier.js';

const router = express.Router();

// Get user's notifications
router.get('/', authMiddleware, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark single notification as read
router.patch('/:id/read', authMiddleware, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { $set: { read: true } },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// Mark all notifications as read
router.patch('/read-all', authMiddleware, async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.id, read: false },
      { $set: { read: true } }
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
});

// 4. Get VAPID Public Key (GET /api/notifications/vapid-key)
router.get('/vapid-key', authMiddleware, (req, res) => {
  res.json({ publicKey: getPublicKey() });
});

// 5. Subscribe to Push Notifications (POST /api/notifications/subscribe)
router.post('/subscribe', authMiddleware, async (req, res) => {
  try {
    const { subscription } = req.body;
    if (!subscription) {
      return res.status(400).json({ error: 'Push subscription object is required' });
    }

    await User.findByIdAndUpdate(req.user.id, { $set: { pushSubscription: subscription } });
    res.json({ message: 'Subscribed to push notifications successfully' });
  } catch (error) {
    console.error('Subscribe push error:', error);
    res.status(500).json({ error: 'Failed to save push subscription' });
  }
});

// 6. Unsubscribe from Push (DELETE /api/notifications/unsubscribe)
router.delete('/unsubscribe', authMiddleware, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { $set: { pushSubscription: null } });
    res.json({ message: 'Unsubscribed from push notifications successfully' });
  } catch (error) {
    console.error('Unsubscribe push error:', error);
    res.status(500).json({ error: 'Failed to remove push subscription' });
  }
});

// 7. Send Push Notification Test (POST /api/notifications/send-push)
router.post('/send-push', authMiddleware, async (req, res) => {
  try {
    const { title, body, url } = req.body;
    const success = await sendPushNotification(req.user.id, title || 'Test Title', body || 'Test Body', url || '/');
    if (success) {
      res.json({ message: 'Push notification sent successfully' });
    } else {
      res.status(400).json({ error: 'Failed to send push notification. Verify browser permission.' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Push test endpoint error' });
  }
});

export default router;
