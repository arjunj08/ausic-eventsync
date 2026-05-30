import Message from '../models/Message.js';

export const sendTeamMessage = async (req, res) => {
  try {
    const { teamId, text } = req.body;
    const message = new Message({ senderId: req.userId, teamId, text, isTeamMessage: true });
    await message.save();
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const sendDirectMessage = async (req, res) => {
  try {
    const { recipientId, text } = req.body;
    const message = new Message({ senderId: req.userId, recipientId, text, isTeamMessage: false });
    await message.save();
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getTeamMessages = async (req, res) => {
  try {
    const messages = await Message.find({ teamId: req.params.teamId, isTeamMessage: true })
      .populate('senderId', 'name avatar')
      .sort({ createdAt: -1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getDirectMessages = async (req, res) => {
  try {
    const messages = await Message.find({
      isTeamMessage: false,
      $or: [
        { senderId: req.userId, recipientId: req.params.userId },
        { senderId: req.params.userId, recipientId: req.userId }
      ]
    }).populate('senderId', 'name avatar').sort({ createdAt: -1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
