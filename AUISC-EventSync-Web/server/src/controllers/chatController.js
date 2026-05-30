const ChatMessage = require('../models/ChatMessage');

exports.sendMessage = async (req, res) => {
  try {
    const { roomId, message } = req.body;

    if (!roomId || !message) {
      return res.status(400).json({ success: false, message: 'Please provide roomId and message' });
    }

    const chatMessage = await ChatMessage.create({
      roomId,
      senderId: req.user._id,
      senderName: req.user.name,
      message
    });

    const populatedMessage = await chatMessage.populate('senderId', 'name email');

    res.status(201).json({ success: true, data: populatedMessage });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { limit = 50, skip = 0 } = req.query;

    const messages = await ChatMessage.find({ roomId })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .populate('senderId', 'name email');

    res.status(200).json({ success: true, data: messages });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const message = await ChatMessage.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    if (message.senderId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this message' });
    }

    await ChatMessage.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, message: 'Message deleted successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
