import mongoose from 'mongoose';

const CrossTeamRequestSchema = new mongoose.Schema({
  fromTeamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  toTeamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('CrossTeamRequest', CrossTeamRequestSchema);
