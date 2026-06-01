import express from 'express';
import TaskTemplate from '../models/TaskTemplate.js';
import Event from '../models/Event.js';
import Team from '../models/Team.js';
import Task from '../models/Task.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { adminOnly } from '../middleware/roleMiddleware.js';
import { logActivity } from '../utils/auditLogger.js';

const router = express.Router();

// Built-in Default Templates
const defaultTemplates = [
  {
    name: "Cultural Night",
    eventType: "cultural",
    description: "Standard tasks for organizing a club cultural night event.",
    tasks: [
      { title: "Select Theme & Venue Decor", description: "Design a dark neon purple theme blueprint.", teamType: "Design Squad", priority: "high", dueDaysBeforeEvent: 15 },
      { title: "Arrange Audio/Video Systems", description: "Coordinate speakers, stage lighting and mic stands.", teamType: "Logistics Team", priority: "high", dueDaysBeforeEvent: 10 },
      { title: "Design Promotional Posters", description: "Create social media stories and main banners.", teamType: "Media Team", priority: "medium", dueDaysBeforeEvent: 12 },
      { title: "Coordinate Performance Schedules", description: "Collect audio files and order track entries.", teamType: "Logistics Team", priority: "medium", dueDaysBeforeEvent: 7 },
      { title: "Launch Public RSVPs Page", description: "Deploy events rsvp links.", teamType: "Dev Force", priority: "high", dueDaysBeforeEvent: 14 }
    ]
  },
  {
    name: "Tech Fest",
    eventType: "tech_fest",
    description: "Standard tasks for running large scale tech fest competitions.",
    tasks: [
      { title: "Develop Registration Portal", description: "Build React forms with QR scanners.", teamType: "Dev Force", priority: "high", dueDaysBeforeEvent: 20 },
      { title: "Invite External Speakers", description: "Draft tech panels agenda and speaker certificates.", teamType: "Logistics Team", priority: "high", dueDaysBeforeEvent: 15 },
      { title: "Publish Tech Problems Sheet", description: "Upload coding task challenges.", teamType: "Dev Force", priority: "high", dueDaysBeforeEvent: 5 },
      { title: "Design Winner Certificates", description: "Draft certificate vector templates.", teamType: "Design Squad", priority: "low", dueDaysBeforeEvent: 4 },
      { title: "Promote Hackathon Sponsors", description: "Share sponsor logos on social media sheets.", teamType: "Media Team", priority: "medium", dueDaysBeforeEvent: 10 }
    ]
  },
  {
    name: "Workshop",
    eventType: "workshop",
    description: "Standard checklist for interactive technical workshops.",
    tasks: [
      { title: "Prepare Slide Deck Outline", description: "Draft presentation notes and sample files.", teamType: "Dev Force", priority: "medium", dueDaysBeforeEvent: 8 },
      { title: "Create Registration Form", description: "Verify attendee list spreadsheet.", teamType: "Logistics Team", priority: "medium", dueDaysBeforeEvent: 10 },
      { title: "Distribute Feedback Forms", description: "Generate QR codes for post-event surveys.", teamType: "Design Squad", priority: "low", dueDaysBeforeEvent: 1 }
    ]
  },
  {
    name: "Hackathon",
    eventType: "hackathon",
    description: "Standard checklist for a 24-hour hackathon coding sprint.",
    tasks: [
      { title: "Setup Local Server Infrastructure", description: "Deploy local mirrors and routers.", teamType: "Dev Force", priority: "high", dueDaysBeforeEvent: 5 },
      { title: "Arrange Midnight Snacks", description: "Order pizza, energy drinks and refreshments.", teamType: "Logistics Team", priority: "medium", dueDaysBeforeEvent: 3 },
      { title: "Draft Rulebook Guidelines", description: "Publish evaluation rubrics for judges.", teamType: "Logistics Team", priority: "high", dueDaysBeforeEvent: 6 }
    ]
  }
];

// Helper: Seed default templates if database is empty
const checkDefaultTemplates = async (userId) => {
  const count = await TaskTemplate.countDocuments({});
  if (count === 0) {
    for (const t of defaultTemplates) {
      const template = new TaskTemplate({
        ...t,
        createdBy: userId,
        isGlobal: true
      });
      await template.save();
    }
  }
};

// 1. Get all Task Templates (GET /api/task-templates)
router.get('/', authMiddleware, async (req, res) => {
  try {
    await checkDefaultTemplates(req.user.id);
    const templates = await TaskTemplate.find({}).populate('createdBy', 'name');
    res.json(templates);
  } catch (error) {
    console.error('Fetch templates error:', error);
    res.status(500).json({ error: 'Failed to fetch task templates' });
  }
});

// 2. Create Task Template (POST /api/task-templates)
router.post('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { name, description, tasks, eventType, isGlobal } = req.body;
    if (!name || !eventType || !tasks || !Array.isArray(tasks)) {
      return res.status(400).json({ error: 'Name, event type, and tasks array are required' });
    }

    const template = new TaskTemplate({
      name,
      description: description || '',
      tasks,
      eventType,
      isGlobal: isGlobal !== undefined ? isGlobal : true,
      createdBy: req.user.id
    });

    await template.save();

    await logActivity(req, req.user.id, req.user.name, req.user.role, 'create_task_template', 'system', `Created task template: "${name}"`, { templateId: template._id });

    res.status(201).json(template);
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({ error: 'Failed to create task template' });
  }
});

// 3. Edit Task Template (PATCH /api/task-templates/:id)
router.patch('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { name, description, tasks, eventType, isGlobal } = req.body;
    const template = await TaskTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ error: 'Task template not found' });
    }

    if (name) template.name = name;
    if (description !== undefined) template.description = description;
    if (tasks) template.tasks = tasks;
    if (eventType) template.eventType = eventType;
    if (isGlobal !== undefined) template.isGlobal = isGlobal;

    await template.save();

    await logActivity(req, req.user.id, req.user.name, req.user.role, 'update_task_template', 'system', `Updated task template: "${template.name}"`, { templateId: template._id });

    res.json(template);
  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({ error: 'Failed to update task template' });
  }
});

// 4. Delete Task Template (DELETE /api/task-templates/:id)
router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const template = await TaskTemplate.findByIdAndDelete(req.params.id);
    if (!template) {
      return res.status(404).json({ error: 'Task template not found' });
    }

    await logActivity(req, req.user.id, req.user.name, req.user.role, 'delete_task_template', 'system', `Deleted task template: "${template.name}"`, { templateId: req.params.id });

    res.json({ message: 'Task template deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete task template' });
  }
});

// 5. Apply Task Template to Event (POST /api/task-templates/:id/apply/:eventId)
router.post('/:id/apply/:eventId', authMiddleware, adminOnly, async (req, res) => {
  try {
    const template = await TaskTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ error: 'Task template not found' });
    }

    const event = await Event.findById(req.eventId || req.params.eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const createdTasks = [];
    for (const t of template.tasks) {
      // Find team mapping
      let team = await Team.findOne({ name: t.teamType });
      if (!team) {
        // Fallback: look for a team whose name contains the search type, or use first team, or create it
        team = await Team.findOne({ name: new RegExp(t.teamType.split(' ')[0], 'i') });
        if (!team) {
          // Create team if completely missing
          team = new Team({
            name: t.teamType,
            color: '#00BFFF',
            memberIds: []
          });
          await team.save();
        }
      }

      // Calculate relative due date
      const dueDate = new Date(event.date.getTime() - t.dueDaysBeforeEvent * 24 * 60 * 60 * 1000);

      const taskDoc = new Task({
        title: t.title,
        description: t.description || '',
        status: 'todo',
        assignedTo: null,
        teamId: team._id,
        eventId: event._id,
        dueDate: dueDate
      });

      await taskDoc.save();
      createdTasks.push(taskDoc);
    }

    // Link template teams to this event if they are not already linked
    const teamIdsToLink = createdTasks.map(t => String(t.teamId));
    const uniqueTeamIdsToLink = [...new Set(teamIdsToLink)];
    
    for (const tId of uniqueTeamIdsToLink) {
      if (!event.teamIds.includes(tId)) {
        event.teamIds.push(tId);
      }
    }
    await event.save();

    await logActivity(req, req.user.id, req.user.name, req.user.role, 'apply_task_template', 'event', `Applied task template "${template.name}" to event "${event.title}". Created ${createdTasks.length} tasks.`, { templateId: template._id, eventId: event._id, count: createdTasks.length });

    res.status(201).json({
      message: `Successfully applied template. Created ${createdTasks.length} tasks.`,
      tasks: createdTasks
    });
  } catch (error) {
    console.error('Apply template error:', error);
    res.status(500).json({ error: 'Failed to apply task template to event' });
  }
});

export default router;
