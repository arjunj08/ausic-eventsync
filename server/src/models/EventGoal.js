import mongoose from 'mongoose';

const EventGoalSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  targetValue: { type: Number, required: true },
  currentValue: { type: Number, default: 0 },
  unit: { type: String, default: '' },
  deadline: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['not_started', 'in_progress', 'achieved', 'missed'], 
    default: 'in_progress' 
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('EventGoal', EventGoalSchema);
