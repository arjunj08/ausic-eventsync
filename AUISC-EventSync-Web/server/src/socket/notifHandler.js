export default function registerNotifHandler(io, socket, activeUsers) {
  // Map userId to socket.id when user registers from frontend
  socket.on('register-user', (userId) => {
    if (userId) {
      activeUsers.set(String(userId), socket.id);
      // console.log(`Registered user ${userId} on socket ${socket.id}`);
    }
  });

  // Handle clean disconnection
  socket.on('disconnect', () => {
    for (let [userId, socketId] of activeUsers.entries()) {
      if (socketId === socket.id) {
        activeUsers.delete(userId);
        // console.log(`Disconnected user ${userId} / socket ${socket.id}`);
        break;
      }
    }
  });
}
