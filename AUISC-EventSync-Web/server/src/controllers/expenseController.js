const Task = require('../models/Task');
const Team = require('../models/Team');

exports.getAllTasks = async (req, res) => {
  try {
    const { eventId, teamId, status } = req.query;
    const filter = {};

    if (eventId) filter.eventId = eventId;
    if (teamId) filter.teamId = teamId;
    if (status) filter.status = status;

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name email')
      .populate('teamId')
      .populate('eventId');

    res.status(200).json({ success: true, data: tasks });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('teamId')
      .populate('eventId');

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    res.status(200).json({ success: true, data: task });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.createTask = async (req, res) => {
  try {
    const { title, description, assignedTo, teamId, eventId } = req.body;

    if (!title || !teamId || !eventId) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    const task = await Task.create({
      title,
      description,
      assignedTo,
      teamId,
      eventId,
      status: 'pending'
    });

    const populatedTask = await task.populate('assignedTo', 'name email').populate('teamId').populate('eventId');

    res.status(201).json({ success: true, data: populatedTask });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    const { title, description, assignedTo, status } = req.body;

    if (title) task.title = title;
    if (description) task.description = description;
    if (assignedTo) task.assignedTo = assignedTo;
    if (status) task.status = status;

    await task.save();

    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email')
      .populate('teamId')
      .populate('eventId');

    res.status(200).json({ success: true, data: populatedTask });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    await Task.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Please provide a status' });
    }

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).populate('assignedTo', 'name email').populate('teamId').populate('eventId');

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    res.status(200).json({ success: true, data: task });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
