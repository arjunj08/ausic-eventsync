const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  sendMessage,
  getMessages,
  deleteMessage
} = require('../controllers/chatController');

router.post('/', protect, sendMessage);
router.get('/:roomId', protect, getMessages);
router.delete('/:id', protect, deleteMessage);

module.exports = router;
