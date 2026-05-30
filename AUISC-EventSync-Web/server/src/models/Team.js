const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a team name'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  color: {
    type: String,
    required: [true, 'Please provide a team color'],
    enum: ['blue', 'orange', 'purple', 'green', 'red', 'pink', 'yellow']
  },
  memberIds: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Team', teamSchema);
