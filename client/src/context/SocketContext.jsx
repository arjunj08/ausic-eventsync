import React, { createContext, useEffect, useState, useContext } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';
import axios from 'axios';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [activeCall, setActiveCall] = useState(null); // { callId, roomId, initiatedBy, type }
  const [callSignal, setCallSignal] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadDMs, setUnreadDMs] = useState({}); // userId -> count

  // Fetch initial notifications and set unread count
  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await axios.get('/api/notifications');
      setNotifications(res.data);
      const unreadCount = res.data.filter(n => !n.read).length;
      setUnreadNotifCount(unreadCount);
    } catch (err) {
      console.error('Fetch notifications error:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
    } else {
      setNotifications([]);
      setUnreadNotifCount(0);
      setUnreadDMs({});
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const devURL = 'http://localhost:5000';
    const prodURL = 'https://eventsync-backend.onrender.com';
    const socketUrl = import.meta.env.VITE_BACKEND_URL || (import.meta.env.DEV ? devURL : prodURL);
    const newSocket = io(socketUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      // console.log('Socket connected:', newSocket.id);
      newSocket.emit('register-user', user.id);
    });

    // Handle real-time notifications
    newSocket.on('unread-message-notif', (data) => {
      const { senderId, senderName, message } = data;
      // Increment unread DM count
      setUnreadDMs(prev => ({
        ...prev,
        [senderId]: (prev[senderId] || 0) + 1
      }));

      // Add to notifications locally
      const localNotif = {
        _id: `dm_${Date.now()}`,
        type: 'chat_message',
        message: `New message from ${senderName}: "${message}"`,
        read: false,
        createdAt: new Date()
      };
      setNotifications(prev => [localNotif, ...prev]);
      setUnreadNotifCount(c => c + 1);
    });

    // Handle WebRTC incoming call
    newSocket.on('incoming-call', (callData) => {
      // callData: { callId, roomId, initiatedBy, type }
      // Get caller details
      axios.get(`/api/auth/members`).then(res => {
        const caller = res.data.find(m => String(m.id) === String(callData.initiatedBy) || String(m._id) === String(callData.initiatedBy));
        setActiveCall({
          ...callData,
          callerName: caller ? caller.name : 'Club Member',
          callerAvatar: caller ? caller.avatar : ''
        });
      });
    });

    newSocket.on('call-ended', () => {
      setActiveCall(null);
      setCallSignal(null);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  // Mark all notifications as read
  const markAllNotificationsAsRead = async () => {
    try {
      await axios.patch('/api/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadNotifCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  // Mark single notification as read
  const markNotificationAsRead = async (id) => {
    if (id.startsWith('dm_')) {
      // Local DM notification
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
      setUnreadNotifCount(c => Math.max(0, c - 1));
      return;
    }
    try {
      await axios.patch(`/api/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
      setUnreadNotifCount(c => Math.max(0, c - 1));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <SocketContext.Provider value={{
      socket,
      unreadNotifCount,
      activeCall,
      setActiveCall,
      callSignal,
      setCallSignal,
      notifications,
      unreadDMs,
      setUnreadDMs,
      markAllNotificationsAsRead,
      markNotificationAsRead,
      refreshNotifications: fetchNotifications
    }}>
      {children}
    </SocketContext.Provider>
  );
};
