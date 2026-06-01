import Call from '../models/Call.js';

export default function registerCallHandler(io, socket, activeUsers) {
  // Start a call
  socket.on('initiate-call', async (data) => {
    try {
      const { roomId, initiatedBy, participants, type } = data; // type: video or voice
      
      const call = new Call({
        roomId,
        initiatedBy,
        participants,
        status: 'ringing',
        startedAt: new Date()
      });

      await call.save();

      // Dynamically join the initiator's socket to the call room
      socket.join(roomId);

      // Emit call-initiated to the caller socket to provide the database Call ID
      socket.emit('call-initiated', {
        callId: call._id,
        roomId,
        initiatedBy,
        type
      });

      // Emit incoming-call to all other participants
      participants.forEach(pId => {
        if (String(pId) !== String(initiatedBy)) {
          const socketId = activeUsers.get(String(pId));
          if (socketId) {
            io.to(socketId).emit('incoming-call', {
              callId: call._id,
              roomId,
              initiatedBy,
              type
            });
          }
        }
      });
    } catch (err) {
      console.error('Call initiation error:', err);
    }
  });

  // Accept Call
  socket.on('accept-call', async (data) => {
    try {
      const { callId, roomId, userId } = data;
      
      // Join the receiver's socket to the call room
      socket.join(roomId);

      await Call.findByIdAndUpdate(callId, {
        $set: { status: 'connected' }
      });

      // Broadcast call-accepted to the room (tells the initiator to start WebRTC handshake)
      socket.to(roomId).emit('call-accepted', { userId });
    } catch (err) {
      console.error('Accept call error:', err);
    }
  });

  // Decline/Reject Call
  socket.on('decline-call', async (data) => {
    try {
      const { callId, roomId, userId } = data;
      
      await Call.findByIdAndUpdate(callId, {
        $set: { status: 'missed', endedAt: new Date() }
      });

      // Broadcast call-declined to the room
      socket.to(roomId).emit('call-declined', { userId });

      // Leave the call room
      socket.leave(roomId);
    } catch (err) {
      console.error('Decline call error:', err);
    }
  });

  // End Call
  socket.on('end-call', async (data) => {
    try {
      const { callId, roomId } = data;
      
      await Call.findByIdAndUpdate(callId, {
        $set: { status: 'ended', endedAt: new Date() }
      });

      // Broadcast call-ended to the room
      io.to(roomId).emit('call-ended');

      // Leave the call room
      socket.leave(roomId);
    } catch (err) {
      console.error('End call error:', err);
    }
  });

  // WebRTC SDP and ICE signaling relay
  // We relay signaling messages (offer, answer, candidates) to the room
  socket.on('webrtc-signal', (data) => {
    const { roomId, signal } = data;
    // Relay to other clients in the room
    socket.to(roomId).emit('webrtc-signal', { signal, senderSocketId: socket.id });
  });
}
