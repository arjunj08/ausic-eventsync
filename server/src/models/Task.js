import mongoose from 'mongoose';

const TaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ['todo', 'in_progress', 'done'], default: 'todo' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  dueDate: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Task', TaskSchema);
