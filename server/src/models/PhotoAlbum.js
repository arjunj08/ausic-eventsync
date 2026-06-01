import mongoose from 'mongoose';

const PhotoAlbumSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  name: { type: String, required: true },
  coverPhotoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Photo', default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

PhotoAlbumSchema.index({ eventId: 1, name: 1 }, { unique: true });

export default mongoose.model('PhotoAlbum', PhotoAlbumSchema);
