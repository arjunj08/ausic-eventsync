import mongoose from 'mongoose';
import { sendPushNotification } from '../utils/pushNotifier.js';

const NotificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// Post-save hook to send Web Push notifications automatically
NotificationSchema.post('save', async function(doc) {
  try {
    let url = '/alerts';
    if (doc.type === 'task_assigned' || doc.type === 'task_due_soon' || doc.type === 'task_overdue') {
      url = '/tasks';
    } else if (doc.type === 'chat_message' || doc.type === 'dm') {
      url = '/chat';
    } else if (doc.type === 'meeting_scheduled' || doc.type === 'meeting_reminder') {
      url = '/meetings';
    } else if (doc.type === 'expense_approved' || doc.type === 'expense_rejected') {
      url = '/expenses';
    } else if (doc.type === 'event_published' || doc.type === 'event_approved') {
      url = '/events';
    }

    await sendPushNotification(doc.userId, 'AUISC EventSync', doc.message, url);
  } catch (err) {
    console.error('Post-save notification push trigger failed:', err);
  }
});

export default mongoose.model('Notification', NotificationSchema);
