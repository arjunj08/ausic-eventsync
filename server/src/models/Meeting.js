import mongoose from 'mongoose';

const MeetingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  scheduledAt: { type: Date, required: true },
  duration: { type: Number, default: 60 }, // in minutes
  meetingLink: { type: String, default: '' },
  platform: { type: String, enum: ['zoom', 'gmeet', 'teams', 'other'], default: 'gmeet' },
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  attendees: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userName: { type: String },
    status: { type: String, enum: ['present', 'absent', 'pending'], default: 'pending' }
  }],
  minutesWriterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  minutes: { type: String, default: '' },
  summary: { type: String, default: '' },
  actionItems: [{
    task: { type: String },
    assignedTo: { type: String },
    dueDate: { type: Date }
  }],
  status: { type: String, enum: ['scheduled', 'ongoing', 'completed'], default: 'scheduled' },
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', default: null },
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Meeting', MeetingSchema);
