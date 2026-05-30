const mongoose = require('mongoose');

const callSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: [true, 'Please provide a room ID'],
    unique: true
  },
  initiatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  participants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  status: {
    type: String,
    enum: ['active', 'ended', 'missed'],
    default: 'active'
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  endedAt: {
    type: Date,
    default: null
  }
});

module.exports = mongoose.model('Call', callSchema);
