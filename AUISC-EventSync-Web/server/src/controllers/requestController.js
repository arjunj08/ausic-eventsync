const Expense = require('../models/Expense');

exports.getAllExpenses = async (req, res) => {
  try {
    const { eventId, teamId, status } = req.query;
    const filter = {};

    if (eventId) filter.eventId = eventId;
    if (teamId) filter.teamId = teamId;
    if (status) filter.status = status;

    const expenses = await Expense.find(filter)
      .populate('submittedBy', 'name email')
      .populate('teamId')
      .populate('eventId');

    res.status(200).json({ success: true, data: expenses });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getExpenseById = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate('submittedBy', 'name email')
      .populate('teamId')
      .populate('eventId');

    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    res.status(200).json({ success: true, data: expense });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.createExpense = async (req, res) => {
  try {
    const { title, amount, category, eventId, teamId, receiptUrl } = req.body;

    if (!title || !amount || !category || !eventId || !teamId) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    const expense = await Expense.create({
      title,
      amount,
      category,
      eventId,
      teamId,
      submittedBy: req.user._id,
      receiptUrl,
      status: 'pending'
    });

    const populatedExpense = await expense
      .populate('submittedBy', 'name email')
      .populate('teamId')
      .populate('eventId');

    res.status(201).json({ success: true, data: populatedExpense });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    if (expense.submittedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this expense' });
    }

    const { title, amount, category, receiptUrl } = req.body;

    if (title) expense.title = title;
    if (amount) expense.amount = amount;
    if (category) expense.category = category;
    if (receiptUrl) expense.receiptUrl = receiptUrl;

    await expense.save();

    const populatedExpense = await Expense.findById(expense._id)
      .populate('submittedBy', 'name email')
      .populate('teamId')
      .populate('eventId');

    res.status(200).json({ success: true, data: populatedExpense });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    if (expense.submittedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this expense' });
    }

    await Expense.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, message: 'Expense deleted successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.approveExpense = async (req, res) => {
  try {
    const expense = await Expense.findByIdAndUpdate(
      req.params.id,
      { status: 'approved' },
      { new: true, runValidators: true }
    ).populate('submittedBy', 'name email').populate('teamId').populate('eventId');

    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    res.status(200).json({ success: true, data: expense });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.rejectExpense = async (req, res) => {
  try {
    const expense = await Expense.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected' },
      { new: true, runValidators: true }
    ).populate('submittedBy', 'name email').populate('teamId').populate('eventId');

    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    res.status(200).json({ success: true, data: expense });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
