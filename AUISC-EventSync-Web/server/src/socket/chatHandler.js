const ChatMessage = require('../models/ChatMessage');

module.exports = (io, socket) => {
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    socket.emit('room-joined', { roomId });
  });

  socket.on('leave-room', (roomId) => {
    socket.leave(roomId);
  });

  socket.on('send-message', async (data) => {
    try {
      const { roomId, senderId, senderName, message } = data;

      const chatMessage = await ChatMessage.create({
        roomId,
        senderId,
        senderName,
        message
      });

      io.to(roomId).emit('new-message', chatMessage);
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });

  socket.on('typing', (data) => {
    const { roomId, senderName } = data;
    socket.broadcast.to(roomId).emit('user-typing', { senderName });
  });

  socket.on('stop-typing', (data) => {
    const { roomId } = data;
    socket.broadcast.to(roomId).emit('user-stop-typing');
  });
};
