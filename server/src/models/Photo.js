import mongoose from 'mongoose';

const PhotoSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', default: null },
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  url: { type: String, required: true },
  thumbnailUrl: { type: String, default: '' },
  caption: { type: String, default: '' },
  album: { type: String, default: '' },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  tags: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    x: { type: Number },
    y: { type: Number }
  }],
  isFeatured: { type: Boolean, default: false },
  isReported: { type: Boolean, default: false },
  reportedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  fileSize: { type: Number },
  dimensions: {
    width: { type: Number },
    height: { type: Number }
  },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Photo', PhotoSchema);
