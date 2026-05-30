const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['task-assigned', 'expense-approved', 'team-invite', 'event-update', 'chat-message', 'request-update', 'other'],
    required: true
  },
  message: {
    type: String,
    required: [true, 'Please provide a notification message'],
    maxlength: [300, 'Message cannot exceed 300 characters']
  },
  read: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

notificationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
