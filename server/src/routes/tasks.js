import express from 'express';
import Task from '../models/Task.js';
import RecurringTaskTemplate from '../models/RecurringTaskTemplate.js';
import User from '../models/User.js';
import Team from '../models/Team.js';
import Notification from '../models/Notification.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { adminOnly } from '../middleware/roleMiddleware.js';
import { sendTaskAssignedEmail } from '../services/emailService.js';

const router = express.Router();

// Get all tasks (filterable by teamId, eventId, assignedTo)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { teamId, eventId, assignedTo } = req.query;
    let query = {};
    if (teamId) query.teamId = teamId;
    if (eventId) query.eventId = eventId;
    if (assignedTo) query.assignedTo = assignedTo;

    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email avatar')
      .populate('teamId', 'name color')
      .populate('eventId', 'title date')
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    console.error('Fetch tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// Get current user's tasks
router.get('/my-tasks', authMiddleware, async (req, res) => {
  try {
    const tasks = await Task.find({ assignedTo: req.user.id })
      .populate('teamId', 'name color')
      .populate('eventId', 'title date')
      .sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch your tasks' });
  }
});

// Create task (Admin only)
router.post('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { title, description, teamId, eventId, assignedTo, dueDate } = req.body;
    
    if (!title || !description || !teamId || !eventId) {
      return res.status(400).json({ error: 'Title, description, teamId, and eventId are required' });
    }

    const task = new Task({
      title,
      description,
      teamId,
      eventId,
      assignedTo: assignedTo || null,
      dueDate: dueDate || null,
      status: 'todo'
    });

    await task.save();

    // Notify assigned user if applicable
    if (assignedTo) {
      const notif = new Notification({
        userId: assignedTo,
        type: 'task_assigned',
        message: `You have been assigned a new task: "${title}".`,
        read: false
      });
      await notif.save();

      // Send email alert asynchronously
      try {
        const assignedUser = await User.findById(assignedTo);
        if (assignedUser) {
          await sendTaskAssignedEmail(assignedUser, task);
        }
      } catch (emailErr) {
        console.error('Failed to send task assignment email:', emailErr);
      }
    }

    res.status(201).json(task);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Update task details (Admin only)
router.put('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { title, description, teamId, eventId, assignedTo, status, dueDate } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const prevAssigned = task.assignedTo;

    if (title) task.title = title;
    if (description) task.description = description;
    if (teamId) task.teamId = teamId;
    if (eventId) task.eventId = eventId;
    if (assignedTo !== undefined) task.assignedTo = assignedTo || null;
    if (status) task.status = status;
    if (dueDate !== undefined) task.dueDate = dueDate || null;

    await task.save();

    // If assignment changed, notify the new user
    if (assignedTo && String(assignedTo) !== String(prevAssigned)) {
      const notif = new Notification({
        userId: assignedTo,
        type: 'task_assigned',
        message: `You have been assigned a new task: "${task.title}".`,
        read: false
      });
      await notif.save();

      // Send email alert asynchronously
      try {
        const assignedUser = await User.findById(assignedTo);
        if (assignedUser) {
          await sendTaskAssignedEmail(assignedUser, task);
        }
      } catch (emailErr) {
        console.error('Failed to send task update assignment email:', emailErr);
      }
    }

    res.json(task);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Update task status (Member can update their own, or admin can update any)
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !['todo', 'in_progress', 'done'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Authorization: User must be assigned to task, belong to the team, or be an admin
    const userObj = await User.findById(req.user.id);
    const isAssigned = task.assignedTo && String(task.assignedTo) === String(req.user.id);
    const inTeam = userObj.teamId && String(userObj.teamId) === String(task.teamId);
    const isAdmin = req.user.role === 'admin';

    if (!isAssigned && !inTeam && !isAdmin) {
      return res.status(403).json({ error: 'You are not authorized to update this task status' });
    }

    task.status = status;
    await task.save();
    res.json(task);
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// Delete task (Admin only)
router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// --- RECURRING TASK ENDPOINTS ---

// Get all recurring templates
router.get('/recurring/templates', authMiddleware, async (req, res) => {
  try {
    const templates = await RecurringTaskTemplate.find({})
      .populate('teamId', 'name color')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// Create recurring template
router.post('/recurring/templates', authMiddleware, async (req, res) => {
  try {
    const { title, description, frequency, teamId } = req.body;
    if (!title || !description || !frequency || !teamId) {
      return res.status(400).json({ error: 'All template fields are required' });
    }

    const template = new RecurringTaskTemplate({
      title,
      description,
      frequency,
      teamId,
      createdBy: req.user.id,
      isActive: true
    });

    await template.save();
    
    // Automatically trigger generation immediately for this template
    await generateTaskFromTemplate(template);

    res.status(201).json(template);
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

// Toggle template status
router.patch('/recurring/templates/:id/toggle', authMiddleware, async (req, res) => {
  try {
    const template = await RecurringTaskTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    template.isActive = !template.isActive;
    await template.save();
    res.json(template);
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle template' });
  }
});

// Trigger generation manually (Admins or automatically on page load)
router.post('/recurring/trigger', authMiddleware, async (req, res) => {
  try {
    const templates = await RecurringTaskTemplate.find({ isActive: true });
    let count = 0;
    for (let template of templates) {
      const generated = await generateTaskFromTemplate(template);
      if (generated) count++;
    }
    res.json({ message: `Cron cycle run. Generated ${count} tasks.` });
  } catch (error) {
    res.status(500).json({ error: 'Failed to run trigger' });
  }
});

// Helper function to generate tasks from recurring template
async function generateTaskFromTemplate(template) {
  // Check if a task from this template was already generated in the current cycle
  // Frequency checks:
  const now = new Date();
  let dateLimit = new Date();

  if (template.frequency === 'daily') {
    dateLimit.setHours(0, 0, 0, 0); // start of today
  } else if (template.frequency === 'weekly') {
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // start of this week (Monday)
    dateLimit.setDate(diff);
    dateLimit.setHours(0, 0, 0, 0);
  } else if (template.frequency === 'monthly') {
    dateLimit.setDate(1); // start of this month
    dateLimit.setHours(0, 0, 0, 0);
  }

  // Look for tasks created after dateLimit matching this title & team
  const existing = await Task.findOne({
    title: `[Recurring] ${template.title}`,
    teamId: template.teamId,
    createdAt: { $gte: dateLimit }
  });

  if (existing) {
    return false; // already generated in this cycle
  }

  // Find the event associated with the team
  const team = await Team.findById(template.teamId);
  if (!team || !team.eventId) {
    return false; // No active event for team, skip task generation
  }

  const newTask = new Task({
    title: `[Recurring] ${template.title}`,
    description: template.description,
    status: 'todo',
    teamId: template.teamId,
    eventId: team.eventId,
    assignedTo: null // unassigned initially
  });

  await newTask.save();
  return true;
}

export default router;
