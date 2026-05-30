import mongoose from 'mongoose';

const AttendanceSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  checkedInAt: { type: Date, default: Date.now },
  method: { type: String, enum: ['manual', 'qr'], default: 'manual' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Attendance', AttendanceSchema);
