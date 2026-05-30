import mongoose from 'mongoose';

const EventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: Date, required: true },
  imageUrl: { type: String, default: '' },
  status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  teamIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Event', EventSchema);
