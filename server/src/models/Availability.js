import mongoose from 'mongoose';

const AvailabilitySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  weekOf: { type: Date, required: true }, // Monday date of the week
  slots: [{
    date: { type: Date, required: true },
    startTime: { type: String, required: true }, // e.g. "08:00"
    endTime: { type: String, required: true },   // e.g. "09:00"
    isAvailable: { type: Boolean, default: true }
  }]
});

export default mongoose.model('Availability', AvailabilitySchema);
