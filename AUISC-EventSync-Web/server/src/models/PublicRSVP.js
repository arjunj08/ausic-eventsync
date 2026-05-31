import mongoose from 'mongoose';

const PublicRSVPSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('PublicRSVP', PublicRSVPSchema);
