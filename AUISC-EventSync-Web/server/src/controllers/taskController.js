import Task from '../models/Task.js';

export const createTask = async (req, res) => {
  try {
    const { title, description, assignedTo, teamId, priority, dueDate } = req.body;
    const task = new Task({ title, description, assignedTo, teamId, priority, dueDate });
    await task.save();
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find().populate('assignedTo', 'name email').populate('teamId', 'name');
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getTasksByTeam = async (req, res) => {
  try {
    const tasks = await Task.find({ teamId: req.params.teamId }).populate('assignedTo', 'name email');
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getTasksByUser = async (req, res) => {
  try {
    const tasks = await Task.find({ assignedTo: req.userId }).populate('teamId', 'name');
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const task = await Task.findByIdAndUpdate(req.params.id, { status, updatedAt: Date.now() }, { new: true });
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateTask = async (req, res) => {
  try {
    const { title, description, priority, dueDate } = req.body;
    const task = await Task.findByIdAndUpdate(req.params.id, { title, description, priority, dueDate, updatedAt: Date.now() }, { new: true });
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteTask = async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
