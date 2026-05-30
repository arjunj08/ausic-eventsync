import mongoose from 'mongoose';

const CallSchema = new mongoose.Schema({
  roomId: { type: String, required: true },
  initiatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  status: { type: String, default: 'ended' }, // ringing, connected, ended, missed
  startedAt: { type: Date, default: Date.now },
  endedAt: { type: Date, default: null }
});

export default mongoose.model('Call', CallSchema);
