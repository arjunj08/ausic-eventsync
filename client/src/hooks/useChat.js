import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { SocketContext } from '../context/SocketContext';
import { AuthContext } from '../context/AuthContext';

export const useChat = (roomId) => {
  const { socket } = useContext(SocketContext);
  const { user } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch messages from backend
  const fetchMessages = async () => {
    if (!roomId) return;
    try {
      setLoading(true);
      const res = await axios.get(`/api/chat/messages/${roomId}`);
      setMessages(res.data);
    } catch (err) {
      console.error('Fetch messages error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();

    if (!socket || !roomId) return;

    // Join room on socket connection
    socket.emit('join-room', roomId);

    // Listen for new messages
    const handleNewMessage = (msg) => {
      if (msg.roomId === roomId) {
        setMessages(prev => [...prev, msg]);
      }
    };

    socket.on('new-message', handleNewMessage);

    return () => {
      socket.emit('leave-room', roomId);
      socket.off('new-message', handleNewMessage);
    };
  }, [roomId, socket]);

  // Send message function
  const sendMessage = (text) => {
    if (!socket || !roomId || !user || !text.trim()) return;

    const messageData = {
      roomId,
      senderId: user.id,
      senderName: user.name,
      message: text
    };

    socket.emit('send-message', messageData);
  };

  return {
    messages,
    sendMessage,
    loading
  };
};
