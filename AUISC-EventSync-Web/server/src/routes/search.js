import express from 'express';
import Event from '../models/Event.js';
import Task from '../models/Task.js';
import User from '../models/User.js';
import Meeting from '../models/Meeting.js';
import Expense from '../models/Expense.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Search across all models (Ctrl+K Endpoint)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const queryStr = req.query.q || '';
    if (!queryStr || queryStr.trim().length < 2) {
      return res.json({ events: [], tasks: [], members: [], meetings: [], expenses: [] });
    }

    const regex = new RegExp(queryStr.trim(), 'i');

    // Run parallel queries across schemas
    const [events, tasks, users, meetings, allExpenses] = await Promise.all([
      Event.find({ title: regex }).limit(10).select('title date description status'),
      Task.find({ $or: [{ title: regex }, { description: regex }] }).limit(15).populate('teamId', 'name color').select('title description status dueDate teamId assignedTo'),
      User.find({ $or: [{ name: regex }, { email: regex }] }).limit(10).select('name email role subRole avatar teamId'),
      Meeting.find({ $or: [{ title: regex }, { description: regex }] }).limit(10).select('title description scheduledAt platform status meetingLink'),
      Expense.find({ itemDescription: regex }).populate('submittedBy', 'name').select('itemDescription amount status submittedBy')
    ]);

    // Apply security filter to expenses: Normal members can only search their own submitted expenses
    let filteredExpenses = allExpenses;
    if (req.user.role !== 'admin') {
      filteredExpenses = allExpenses.filter(exp => 
        exp.submittedBy && String(exp.submittedBy._id || exp.submittedBy) === String(req.user.id)
      );
    }

    res.json({
      events,
      tasks,
      members: users,
      meetings,
      expenses: filteredExpenses
    });
  } catch (error) {
    console.error('Spotlight search query error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

export default router;
