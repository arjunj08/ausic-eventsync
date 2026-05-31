import express from 'express';
import Expense from '../models/Expense.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { adminOnly } from '../middleware/roleMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';
import { sendExpenseUpdateEmail } from '../services/emailService.js';

const router = express.Router();

// Get all expenses (Admin can see all, Members can only see their own)
router.get('/', authMiddleware, async (req, res) => {
  try {
    let query = {};
    if (req.user.role !== 'admin') {
      query.submittedBy = req.user.id;
    }

    const { eventId, teamId, category, fromDate, toDate } = req.query;
    if (eventId) query.eventId = eventId;
    if (teamId) query.teamId = teamId;
    if (category) query.category = category;
    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) query.createdAt.$gte = new Date(fromDate);
      if (toDate) query.createdAt.$lte = new Date(toDate);
    }

    const expenses = await Expense.find(query)
      .populate('submittedBy', 'name email avatar')
      .populate('eventId', 'title')
      .populate('teamId', 'name color')
      .sort({ createdAt: -1 });

    res.json(expenses);
  } catch (error) {
    console.error('Fetch expenses error:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// Submit a new expense (with optional receipt file upload)
router.post('/', authMiddleware, upload.single('receipt'), async (req, res) => {
  try {
    const { title, amount, category, eventId, teamId } = req.body;

    if (!title || !amount || !category || !eventId || !teamId) {
      return res.status(400).json({ error: 'Title, amount, category, eventId, and teamId are required' });
    }

    let receiptUrl = '';
    if (req.file) {
      receiptUrl = `/uploads/${req.file.filename}`;
    }

    const expense = new Expense({
      title,
      amount: Number(amount),
      category,
      eventId,
      teamId,
      submittedBy: req.user.id,
      status: 'pending',
      receiptUrl
    });

    await expense.save();

    // Create notifications for admins
    const admins = await User.find({ role: 'admin' });
    const notifications = admins.map(admin => ({
      userId: admin._id,
      type: 'expense_submitted',
      message: `New expense "${title}" of ₹${amount} submitted by ${req.user.name}.`,
      read: false
    }));
    await Notification.insertMany(notifications);

    res.status(201).json(expense);
  } catch (error) {
    console.error('Submit expense error:', error);
    res.status(500).json({ error: 'Failed to submit expense' });
  }
});

// Approve/Reject expense (Admin only)
router.patch('/:id/status', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    expense.status = status;
    await expense.save();

    // Notify the submitter
    const notif = new Notification({
      userId: expense.submittedBy,
      type: 'expense_updated',
      message: `Your expense "${expense.title}" for ₹${expense.amount} has been ${status}.`,
      read: false
    });
    await notif.save();

    // Send email alert asynchronously
    try {
      const submitter = await User.findById(expense.submittedBy);
      if (submitter) {
        await sendExpenseUpdateEmail(submitter, { itemDescription: expense.title, amount: expense.amount }, status);
      }
    } catch (emailErr) {
      console.error('Failed to send expense update notification email:', emailErr);
    }

    res.json(expense);
  } catch (error) {
    console.error('Approve/Reject expense error:', error);
    res.status(500).json({ error: 'Failed to update expense status' });
  }
});

// Get expense stats summary (custom dashboard aggregates)
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    let query = {};
    if (req.user.role !== 'admin') {
      query.submittedBy = req.user.id;
    }

    const expenses = await Expense.find(query);

    let totalSubmitted = 0;
    let approved = 0;
    let pending = 0;

    expenses.forEach(exp => {
      totalSubmitted += exp.amount;
      if (exp.status === 'approved') {
        approved += exp.amount;
      } else if (exp.status === 'pending') {
        pending += exp.amount;
      }
    });

    res.json({
      totalSubmitted,
      approved,
      pending,
      count: expenses.length
    });
  } catch (error) {
    console.error('Fetch expense stats error:', error);
    res.status(500).json({ error: 'Failed to fetch expense stats' });
  }
});

export default router;
