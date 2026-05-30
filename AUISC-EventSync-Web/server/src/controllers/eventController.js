const Event = require('../models/Event');
const Team = require('../models/Team');
const Task = require('../models/Task');
const Expense = require('../models/Expense');

exports.getAllEvents = async (req, res) => {
  try {
    const events = await Event.find().populate('createdBy', 'name email').populate('teamIds');
    res.status(200).json({ success: true, data: events });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('teamIds');

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    res.status(200).json({ success: true, data: event });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.createEvent = async (req, res) => {
  try {
    const { title, description, date, imageUrl } = req.body;

    if (!title || !description || !date) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    const event = await Event.create({
      title,
      description,
      date,
      imageUrl,
      createdBy: req.user._id,
      status: 'planning'
    });

    const populatedEvent = await event.populate('createdBy', 'name email');

    res.status(201).json({ success: true, data: populatedEvent });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (event.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this event' });
    }

    const { title, description, date, imageUrl, status } = req.body;

    if (title) event.title = title;
    if (description) event.description = description;
    if (date) event.date = date;
    if (imageUrl) event.imageUrl = imageUrl;
    if (status) event.status = status;

    await event.save();

    const populatedEvent = await Event.findById(event._id)
      .populate('createdBy', 'name email')
      .populate('teamIds');

    res.status(200).json({ success: true, data: populatedEvent });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (event.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this event' });
    }

    await Event.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.publishEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (event.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to publish this event' });
    }

    event.status = 'published';
    await event.save();

    const populatedEvent = await Event.findById(event._id)
      .populate('createdBy', 'name email')
      .populate('teamIds');

    res.status(200).json({ success: true, data: populatedEvent });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
