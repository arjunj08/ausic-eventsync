const Notification = require('../models/Notification');

module.exports = (io, socket) => {
  socket.on('subscribe-notifications', (userId) => {
    socket.join(`user-${userId}`);
  });

  socket.on('unsubscribe-notifications', (userId) => {
    socket.leave(`user-${userId}`);
  });
};

const broadcastNotification = (io, userId, notification) => {
  io.to(`user-${userId}`).emit('new-notification', notification);
};

module.exports.broadcastNotification = broadcastNotification;
