import Event from '../models/Event.js';

export const createEvent = async (req, res) => {
  try {
    const { title, description, banner, startDate, endDate } = req.body;
    const event = new Event({ title, description, banner, startDate, endDate, createdBy: req.userId });
    await event.save();
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getEvents = async (req, res) => {
  try {
    const events = await Event.find().populate('teams').populate('createdBy', 'name email');
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).populate('teams').populate('createdBy', 'name email');
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateEvent = async (req, res) => {
  try {
    const { title, description, banner, published, startDate, endDate } = req.body;
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { title, description, banner, published, startDate, endDate, updatedAt: Date.now() },
      { new: true }
    );
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteEvent = async (req, res) => {
  try {
    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const publishEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, { published: true, updatedAt: Date.now() }, { new: true });
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
