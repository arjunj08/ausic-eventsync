import mongoose from 'mongoose';

const TaskTemplateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  tasks: [{
    title: { type: String, required: true },
    description: { type: String, default: '' },
    teamType: { type: String, required: true }, // e.g. "Dev Force", "Design Squad", "Media Team"
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    dueDaysBeforeEvent: { type: Number, required: true }
  }],
  eventType: { type: String, required: true }, // e.g. "cultural", "tech_fest", "workshop", "hackathon"
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isGlobal: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('TaskTemplate', TaskTemplateSchema);
