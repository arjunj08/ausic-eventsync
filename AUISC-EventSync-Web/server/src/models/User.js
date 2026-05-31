import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['member', 'admin'], default: 'member' },
  subRole: { type: String, enum: ['team_lead', 'treasurer', 'coordinator', 'member'], default: 'member' },
  isOnboarded: { type: Boolean, default: false },
  yearOfStudy: { type: String, default: '' },
  department: { type: String, default: '' },
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
  avatar: { type: String, default: '' },
  bio: { type: String, default: '' },
  skills: [{ type: String }],
  badges: [{
    name: { type: String },
    icon: { type: String },
    earnedAt: { type: Date, default: Date.now }
  }],
  socialLinks: {
    linkedin: { type: String, default: '' },
    github: { type: String, default: '' },
    instagram: { type: String, default: '' }
  },
  teamRole: { type: String, default: '' }, // e.g. "Squad Developer", "Media Lead"
  settings: {
    notificationSound: { type: Boolean, default: true },
    emailAlerts: { type: Boolean, default: true },
    aiPersona: { type: String, default: 'helpful' } // helpful, technical, direct
  },
  emailNotifications: {
    taskAssigned: { type: Boolean, default: true },
    meetingScheduled: { type: Boolean, default: true },
    expenseUpdate: { type: Boolean, default: true },
    weeklyDigest: { type: Boolean, default: true }
  },
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorOtp: { type: String, default: '' },
  twoFactorOtpExpires: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('User', UserSchema);
