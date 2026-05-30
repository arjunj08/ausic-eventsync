import ChatMessage from '../models/ChatMessage.js';

export default function registerChatHandler(io, socket, activeUsers) {
  // Join a chat room (team room or direct message room)
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    // console.log(`Socket ${socket.id} joined room ${roomId}`);
  });

  // Leave a chat room
  socket.on('leave-room', (roomId) => {
    socket.leave(roomId);
    // console.log(`Socket ${socket.id} left room ${roomId}`);
  });

  // Sending a chat message
  socket.on('send-message', async (data) => {
    try {
      const { roomId, senderId, senderName, message } = data;
      if (!roomId || !senderId || !message) return;

      const chatMsg = new ChatMessage({
        roomId,
        senderId,
        senderName,
        message
      });

      await chatMsg.save();

      // Broadcast to everyone in the room
      io.to(roomId).emit('new-message', chatMsg);

      // Check if it's a DM room (format: user1Id_user2Id)
      if (roomId.includes('_')) {
        const recipientId = roomId.split('_').find(id => id !== String(senderId));
        if (recipientId) {
          const recipientSocketId = activeUsers.get(recipientId);
          if (recipientSocketId) {
            // Send unread message notification to recipient if they are not in room
            io.to(recipientSocketId).emit('unread-message-notif', {
              senderId,
              senderName,
              message: message.substring(0, 50)
            });
          }
        }
      }
    } catch (err) {
      console.error('Error saving chat message:', err);
    }
  });
}
