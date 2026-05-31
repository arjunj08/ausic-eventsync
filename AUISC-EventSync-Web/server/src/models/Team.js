import mongoose from 'mongoose';

const TeamSchema = new mongoose.Schema({
  name: { type: String, required: true },
  color: { type: String, default: '#7C3AED' }, // default purple
  memberIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', default: null },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Team', TeamSchema);
