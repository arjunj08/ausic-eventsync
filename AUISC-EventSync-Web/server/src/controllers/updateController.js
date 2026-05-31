import Update from '../models/Update.js';

export const postUpdate = async (req, res) => {
  try {
    const { teamId, text } = req.body;
    const update = new Update({ teamId, authorId: req.userId, text });
    await update.save();
    res.status(201).json(update);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getTeamUpdates = async (req, res) => {
  try {
    const updates = await Update.find({ teamId: req.params.teamId })
      .populate('authorId', 'name avatar')
      .sort({ createdAt: -1 });
    res.json(updates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteUpdate = async (req, res) => {
  try {
    await Update.findByIdAndDelete(req.params.id);
    res.json({ message: 'Update deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
