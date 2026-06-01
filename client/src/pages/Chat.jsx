import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import { 
  Phone, 
  Video, 
  Send, 
  Loader2, 
  MessageSquare, 
  Shield, 
  User, 
  Plus, 
  Search, 
  Check, 
  CheckCheck,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function Chat() {
  const { user } = useContext(AuthContext);
  const { socket, unreadDMs, setUnreadDMs, setActiveCall } = useContext(SocketContext);

  const [teams, setTeams] = useState([]);
  const [conversations, setConversations] = useState([]); // List of active DMs from DB
  const [selectedRoom, setSelectedRoom] = useState(null); // { id, name, type, color, avatar, recipientId }
  const [messages, setMessages] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [inputText, setInputText] = useState('');
  
  // Search Modal States
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [allMembers, setAllMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Online status list
  const [onlineUserIds, setOnlineUserIds] = useState([]);

  const messagesEndRef = useRef(null);

  // Fetch rooms, active DMs and online users
  const fetchSidebarData = async () => {
    try {
      setLoadingRooms(true);
      const [roomsRes, dmRes, onlineRes] = await Promise.all([
        axios.get('/api/chat/rooms'),
        axios.get('/api/dm/conversations'),
        axios.get('/api/users/status/online')
      ]);
      
      setTeams(roomsRes.data.teams);
      setConversations(dmRes.data);
      setOnlineUserIds(onlineRes.data);

      // Select the first team channel by default on load
      if (!selectedRoom && roomsRes.data.teams.length > 0) {
        handleSelectRoom({
          id: roomsRes.data.teams[0].id,
          name: roomsRes.data.teams[0].name,
          type: 'team',
          color: roomsRes.data.teams[0].color
        });
      }
    } catch (err) {
      console.error('Error fetching sidebar data:', err);
    } finally {
      setLoadingRooms(false);
    }
  };

  // Poll online status every 15s
  useEffect(() => {
    fetchSidebarData();

    const interval = setInterval(async () => {
      try {
        const res = await axios.get('/api/users/status/online');
        setOnlineUserIds(res.data);
      } catch (e) {
        console.error('Failed to poll online status:', e);
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [user]);

  // Fetch messages thread for selected channel/conversation
  const fetchMessages = async (room) => {
    if (!room) return;
    try {
      setLoadingMessages(true);
      if (room.type === 'team') {
        const res = await axios.get(`/api/chat/messages/${room.id}`);
        setMessages(res.data);
      } else {
        // Direct messages
        const res = await axios.get(`/api/dm/conversations/${room.id}/messages`);
        setMessages(res.data);
        
        // Mark read in DB
        await axios.patch(`/api/dm/conversations/${room.id}/read`);
        
        // Clear unread badge in Context state
        if (room.recipientId) {
          setUnreadDMs(prev => ({
            ...prev,
            [room.recipientId]: 0
          }));
        }
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Handle switching rooms
  const handleSelectRoom = (room) => {
    setSelectedRoom(room);
    fetchMessages(room);
  };

  // Handle real-time messaging Socket events
  useEffect(() => {
    if (!socket || !selectedRoom) return;

    // Join the current room namespace
    socket.emit('join-room', selectedRoom.id);

    // 1. Team channel message listener
    const handleNewTeamMessage = (msg) => {
      if (selectedRoom.type === 'team' && msg.roomId === selectedRoom.id) {
        setMessages(prev => [...prev, msg]);
      }
    };

    // 2. Direct message listener
    const handleNewDM = async (msg) => {
      if (selectedRoom.type === 'direct' && msg.conversationId === selectedRoom.id) {
        // Format to local render state representation
        const formattedMsg = {
          _id: msg._id,
          senderId: msg.senderId,
          senderName: msg.senderName,
          message: msg.text,
          isRead: msg.isRead,
          timestamp: msg.createdAt
        };
        setMessages(prev => [...prev, formattedMsg]);

        // If message is from the other user, mark as read instantly
        if (String(msg.senderId) !== String(user.id)) {
          try {
            await axios.patch(`/api/dm/conversations/${selectedRoom.id}/read`);
          } catch (e) {
            console.error('Failed to mark incoming DM as read:', e);
          }
        }
      }
    };

    // 3. Realtime read receipt update listener
    const handleDMReadReceipt = (data) => {
      if (selectedRoom.type === 'direct' && data.conversationId === selectedRoom.id) {
        // If the other user read our messages, update ticks
        setMessages(prev => 
          prev.map(m => String(m.senderId) === String(user.id) ? { ...m, isRead: true } : m)
        );
      }
    };

    socket.on('new-message', handleNewTeamMessage);
    socket.on('dm_message', handleNewDM);
    socket.on('dm_messages_read', handleDMReadReceipt);

    return () => {
      socket.emit('leave-room', selectedRoom.id);
      socket.off('new-message', handleNewTeamMessage);
      socket.off('dm_message', handleNewDM);
      socket.off('dm_messages_read', handleDMReadReceipt);
    };
  }, [socket, selectedRoom, user]);

  // Sending message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    try {
      if (selectedRoom.type === 'team') {
        const messageData = {
          roomId: selectedRoom.id,
          senderId: user.id,
          senderName: user.name,
          message: inputText.trim()
        };
        socket.emit('send-message', messageData);
      } else {
        // Direct message via POST route
        const res = await axios.post(`/api/dm/conversations/${selectedRoom.id}/messages`, {
          text: inputText.trim()
        });
        
        // Append locally
        const localMsg = {
          _id: res.data._id,
          senderId: res.data.senderId,
          senderName: res.data.senderName,
          message: res.data.text,
          isRead: res.data.isRead,
          timestamp: res.data.createdAt
        };
        setMessages(prev => [...prev, localMsg]);

        // Trigger DM sidebar reload to update lastMessage text preview
        const dmRes = await axios.get('/api/dm/conversations');
        setConversations(dmRes.data);
      }
      setInputText('');
    } catch (err) {
      toast.error('Failed to send message.');
    }
  };

  // Open Search Members Modal
  const openSearchModal = async () => {
    setShowSearchModal(true);
    setLoadingMembers(true);
    try {
      const res = await axios.get('/api/auth/members');
      setAllMembers(res.data);
    } catch (e) {
      toast.error('Failed to fetch squad member roster.');
    } finally {
      setLoadingMembers(false);
    }
  };

  // Start/Get DM conversation
  const startDMConversation = async (targetUser) => {
    try {
      const res = await axios.post('/api/dm/conversations', {
        recipientId: targetUser._id || targetUser.id
      });
      
      const newRoom = {
        id: res.data._id,
        name: targetUser.name,
        type: 'direct',
        avatar: targetUser.avatar,
        recipientId: targetUser._id || targetUser.id
      };

      // Select DM Room
      setSelectedRoom(newRoom);
      fetchMessages(newRoom);
      
      // Close modal and refresh sidebar conversations
      setShowSearchModal(false);
      setSearchQuery('');
      
      const conversationsRes = await axios.get('/api/dm/conversations');
      setConversations(conversationsRes.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to initialize direct chat.');
    }
  };

  // Trigger outbound WebRTC Call modal overlays
  const handleInitiateCall = (callType) => {
    if (!selectedRoom || !socket) return;
    
    let participants = [];
    if (selectedRoom.type === 'direct') {
      participants = [user.id, selectedRoom.recipientId];
      triggerCall(participants, callType);
    } else {
      // Fetch full squad coordinators list to include as call participants
      axios.get(`/api/teams/${selectedRoom.id}`).then(res => {
        participants = res.data.memberIds ? res.data.memberIds.map(m => m._id) : [];
        if (!participants.includes(user.id)) participants.push(user.id);
        
        triggerCall(participants, callType);
      }).catch(() => {
        participants = [user.id];
        triggerCall(participants, callType);
      });
    }
  };

  const triggerCall = (participants, callType) => {
    const callData = {
      roomId: selectedRoom.id,
      initiatedBy: user.id,
      participants,
      type: callType
    };
    
    socket.emit('initiate-call', callData);
    
    // Set active call state locally for ringing dial screen overlays
    setActiveCall({
      ...callData,
      callId: `call_${Date.now()}`,
      callerName: selectedRoom.name,
      callerAvatar: selectedRoom.avatar || ''
    });
  };

  // Scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedRoom]);

  // Filter members list based on query search input
  const filteredMembers = allMembers.filter(m => {
    if (String(m._id || m.id) === String(user.id)) return false;
    return m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
           m.email.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="pb-16 px-4 max-w-7xl mx-auto pt-20 h-[88vh] flex flex-col md:flex-row gap-4">
      
      {/* Sidebar List (Left Panel) */}
      <div className="w-full md:w-80 bg-[#111111] border border-gray-850 rounded-2xl flex flex-col h-full overflow-hidden shadow-lg">
        <div className="p-4 border-b border-gray-850 bg-[#1a1a1a]">
          <h2 className="font-extrabold text-white text-lg">Collaboration Hub</h2>
          <p className="text-gray-400 text-xs mt-0.5">Select a channel or direct chat</p>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-4 no-scrollbar">
          
          {/* Teams list */}
          <div>
            <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2 mb-2">Team Channels</h4>
            <div className="space-y-1">
              {loadingRooms ? (
                <div className="p-3 text-center text-xs text-gray-600">Loading channels...</div>
              ) : teams.length === 0 ? (
                <div className="p-3 text-xs text-gray-600 italic">No assigned squads.</div>
              ) : (
                teams.map(t => (
                  <button
                    key={t.id}
                    onClick={() => handleSelectRoom({ ...t, type: 'team' })}
                    className={`w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                      selectedRoom && selectedRoom.id === t.id && selectedRoom.type === 'team'
                        ? 'bg-[#00BFFF]/10 border border-[#00BFFF]/20 text-white'
                        : 'text-gray-400 hover:bg-gray-850 hover:text-white border border-transparent'
                    }`}
                  >
                    <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: t.color }}></span>
                    <span className="text-xs font-bold truncate">{t.name}</span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* DMs List */}
          <div>
            <div className="flex justify-between items-center px-2 mb-2">
              <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Direct Messages</h4>
              <button 
                onClick={openSearchModal}
                className="text-gray-400 hover:text-white hover:bg-gray-800 p-0.5 rounded transition-colors"
                title="New Direct Message"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            
            <div className="space-y-1">
              {loadingRooms ? (
                <div className="p-3 text-center text-xs text-gray-600">Loading DMs...</div>
              ) : conversations.length === 0 ? (
                <div className="p-3 text-xs text-gray-600 italic">No active direct messages.</div>
              ) : (
                conversations.map(conv => {
                  const isSelected = selectedRoom && selectedRoom.id === conv.id && selectedRoom.type === 'direct';
                  const isOnline = onlineUserIds.includes(String(conv.recipient._id || conv.recipient.id));
                  const unreadCount = unreadDMs[conv.recipient._id || conv.recipient.id] || 0;
                  
                  return (
                    <button
                      key={conv.id}
                      onClick={() => handleSelectRoom({
                        id: conv.id,
                        name: conv.recipient.name,
                        type: 'direct',
                        avatar: conv.recipient.avatar,
                        recipientId: conv.recipient._id || conv.recipient.id
                      })}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors border cursor-pointer ${
                        isSelected
                          ? 'bg-[#00BFFF]/10 border-[#00BFFF]/20 text-white'
                          : 'text-gray-400 hover:bg-gray-850 hover:text-white border-transparent'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 min-w-0 relative">
                        {/* Profile with online indicator */}
                        <div className="relative">
                          <img 
                            src={conv.recipient.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(conv.recipient.name)}`} 
                            alt={conv.recipient.name} 
                            className="h-7 w-7 rounded-full bg-[#7C3AED] object-cover"
                          />
                          {isOnline && (
                            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-emerald-500 rounded-full border border-[#111111]"></span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-semibold block text-white truncate">{conv.recipient.name}</span>
                          <span className="text-[9px] text-gray-500 block truncate leading-tight">
                            {conv.lastMessage || 'Start conversation'}
                          </span>
                        </div>
                      </div>

                      {/* Unread count badge */}
                      {unreadCount > 0 && !isSelected && (
                        <span className="bg-[#22C55E] text-white text-[9px] font-bold rounded-full h-4.5 w-4.5 flex items-center justify-center shrink-0 ml-2">
                          {unreadCount}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Message Thread (Right Panel) */}
      <div className="flex-1 bg-[#111111] border border-gray-850 rounded-2xl flex flex-col h-full overflow-hidden shadow-lg">
        
        {selectedRoom ? (
          <>
            {/* Active Thread Header */}
            <div className="h-16 bg-[#1a1a1a] px-6 border-b border-gray-850 flex items-center justify-between z-10 flex-shrink-0">
              <div className="flex items-center space-x-3 min-w-0">
                {selectedRoom.type === 'direct' ? (
                  <div className="relative">
                    <img 
                      src={selectedRoom.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(selectedRoom.name)}`}
                      alt={selectedRoom.name}
                      className="h-8 w-8 rounded-full bg-[#7C3AED] object-cover"
                    />
                    {onlineUserIds.includes(String(selectedRoom.recipientId)) && (
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-emerald-500 rounded-full border border-[#1a1a1a]"></span>
                    )}
                  </div>
                ) : (
                  <span className="h-4 w-4 rounded-full flex-shrink-0" style={{ backgroundColor: selectedRoom.color }}></span>
                )}
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-white truncate">{selectedRoom.name}</h3>
                  <span className="text-[10px] text-gray-500 block">
                    {selectedRoom.type === 'direct' ? 'Direct Message Chat' : 'Squad Chatroom'}
                  </span>
                </div>
              </div>

              {/* Call Initiation Triggers */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleInitiateCall('voice')}
                  className="p-2 text-gray-400 hover:text-[#00BFFF] hover:bg-gray-850 rounded-lg transition-all cursor-pointer"
                  title="Voice Call"
                >
                  <Phone className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleInitiateCall('video')}
                  className="p-2 text-gray-400 hover:text-[#00BFFF] hover:bg-gray-850 rounded-lg transition-all cursor-pointer animate-pulse"
                  title="Video Call"
                >
                  <Video className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Message History Thread */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar bg-[#0a0a0a]">
              {loadingMessages ? (
                <div className="h-full flex items-center justify-center">
                  <Loader2 className="h-6 w-6 text-[#00BFFF] animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-600">
                  <MessageSquare className="h-10 w-10 text-gray-800 mb-2" />
                  <span className="text-xs">No messages in this chat yet. Start the conversation!</span>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isSentByMe = String(msg.senderId) === String(user.id);
                  return (
                    <motion.div 
                      key={msg._id || idx}
                      initial={{ opacity: 0, x: isSentByMe ? 50 : -50, scale: 0.9 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      transition={{ type: "spring", stiffness: 350, damping: 25 }}
                      className={`flex flex-col ${isSentByMe ? 'items-end' : 'items-start'}`}
                    >
                      {/* Sender Name (only on incoming) */}
                      {!isSentByMe && (
                        <span className="text-[10px] text-gray-500 font-bold ml-1 mb-1">{msg.senderName}</span>
                      )}

                      <div 
                        className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          isSentByMe
                            ? 'bg-[#00BFFF] text-black font-semibold rounded-tr-none'
                            : 'bg-[#1a1a1a] text-white border border-gray-850 rounded-tl-none'
                        }`}
                      >
                        {msg.message}
                      </div>

                      {/* Timestamp & Read ticks */}
                      <div className="flex items-center gap-1.5 mt-1 mx-1.5 text-gray-600">
                        <span className="text-[9px] font-medium">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isSentByMe && selectedRoom.type === 'direct' && (
                          msg.isRead ? (
                            <CheckCheck className="h-3.5 w-3.5 text-[#00BFFF]" />
                          ) : (
                            <Check className="h-3.5 w-3.5" />
                          )
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Box */}
            <form 
              onSubmit={handleSendMessage}
              className="p-4 bg-[#1a1a1a] border-t border-gray-850 flex items-center space-x-2.5 flex-shrink-0"
            >
              <input
                type="text"
                placeholder="Type your message..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 bg-[#0a0a0a] text-white placeholder-gray-600 border border-gray-800 focus:border-[#00BFFF] outline-none px-4 h-11 rounded-lg text-sm transition-all"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="h-11 w-11 bg-[#00BFFF] hover:bg-[#00D4FF] disabled:bg-gray-800 disabled:text-gray-600 text-black flex items-center justify-center rounded-lg transition-colors cursor-pointer"
              >
                <Send className="h-4.5 w-4.5" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-gray-600">
            <MessageSquare className="h-16 w-16 text-gray-800 mb-3" />
            <h3 className="text-base font-bold text-white mb-1">No Chat Selected</h3>
            <p className="text-xs">Choose a team channel or start a direct message on the left.</p>
          </div>
        )}

      </div>

      {/* Start DM Search Modal */}
      <AnimatePresence>
        {showSearchModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0a0a0a]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-[#111111] border border-gray-850 rounded-2xl w-full max-w-md p-6 shadow-2xl flex flex-col justify-between max-h-[80vh]"
            >
              <div>
                <div className="flex items-center justify-between border-b border-gray-850 pb-3 mb-4">
                  <h3 className="font-extrabold text-white text-base">New Direct Message</h3>
                  <button 
                    onClick={() => setShowSearchModal(false)}
                    className="text-gray-400 hover:text-white p-1 hover:bg-gray-800 rounded-full"
                  >
                    <X className="h-4.5 w-4.5" />
                  </button>
                </div>
  
                {/* Search input */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search members by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#1A1A1A] border border-gray-850 rounded-lg pl-9 pr-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#00BFFF]"
                  />
                </div>
  
                {/* Members listing */}
                <div className="space-y-2 overflow-y-auto max-h-[45vh] pr-1 no-scrollbar">
                  {loadingMembers ? (
                    <div className="py-8 flex justify-center">
                      <Loader2 className="h-6 w-6 text-[#00BFFF] animate-spin" />
                    </div>
                  ) : filteredMembers.length === 0 ? (
                    <div className="text-center text-gray-650 text-xs italic py-8">No matching club members found.</div>
                  ) : (
                    filteredMembers.map(m => {
                      const isOnline = onlineUserIds.includes(String(m._id || m.id));
                      return (
                        <div
                          key={m._id || m.id}
                          onClick={() => startDMConversation(m)}
                          className="flex items-center justify-between p-3 rounded-xl border border-gray-850/50 bg-[#161616]/30 hover:bg-[#1A1A1A] hover:border-[#00BFFF]/30 cursor-pointer group transition-all"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="relative">
                              <img 
                                src={m.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(m.name)}`} 
                                alt="" 
                                className="h-8 w-8 rounded-full border border-purple-500/20 object-cover"
                              />
                              {isOnline && (
                                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-emerald-500 rounded-full border border-[#111111]"></span>
                              )}
                            </div>
                            <div>
                              <div className="text-xs text-white font-semibold group-hover:text-[#00BFFF] transition-colors">{m.name}</div>
                              <div className="text-[10px] text-gray-500">{m.email}</div>
                            </div>
                          </div>
                          <span className="text-[9px] bg-[#00BFFF]/10 border border-[#00BFFF]/20 text-[#00BFFF] px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                            Chat
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
              
              <button
                onClick={() => setShowSearchModal(false)}
                className="w-full mt-6 bg-gray-850 hover:bg-gray-800 text-white py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
