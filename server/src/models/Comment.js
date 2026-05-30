import mongoose from 'mongoose';

const CommentSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  authorName: { type: String, required: true },
  authorAvatar: { type: String, default: '' },
  text: { type: String, required: true },
  isPinned: { type: Boolean, default: false },
  reactions: [{
    emoji: { type: String, required: true },
    userIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  }],
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
  isDeleted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.model('Comment', CommentSchema);
