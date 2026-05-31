import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import { useChat } from '../hooks/useChat';
import { Phone, Video, Send, Loader2, MessageSquare, Shield, User } from 'lucide-react';

export default function Chat() {
  const { user } = useContext(AuthContext);
  const { socket, unreadDMs, setUnreadDMs, setActiveCall } = useContext(SocketContext);

  const [rooms, setRooms] = useState({ teams: [], members: [] });
  const [selectedRoom, setSelectedRoom] = useState(null); // { id, name, type, color, avatar, memberIds }
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [inputText, setInputText] = useState('');
  
  const messagesEndRef = useRef(null);

  // Hook for messages management
  const { messages, sendMessage, loading: loadingMessages } = useChat(
    selectedRoom ? selectedRoom.id : null
  );

  const fetchRooms = async () => {
    try {
      setLoadingRooms(true);
      const res = await axios.get('/api/chat/rooms');
      setRooms(res.data);
      
      // Select the first room (e.g. team room) by default if available
      if (res.data.teams.length > 0) {
        handleSelectRoom({
          id: res.data.teams[0].id,
          name: res.data.teams[0].name,
          type: 'team',
          color: res.data.teams[0].color
        });
      } else if (res.data.members.length > 0) {
        handleSelectRoom({
          id: getDMId(user.id, res.data.members[0].id),
          name: res.data.members[0].name,
          type: 'direct',
          avatar: res.data.members[0].avatar,
          recipientId: res.data.members[0].id
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRooms(false);
    }
  };

  const getDMId = (uid1, uid2) => {
    return [String(uid1), String(uid2)].sort().join('_');
  };

  useEffect(() => {
    fetchRooms();
  }, [user]);

  const handleSelectRoom = (room) => {
    setSelectedRoom(room);
    
    // Clear unread count for this user if it's a DM
    if (room.type === 'direct' && room.recipientId) {
      setUnreadDMs(prev => ({
        ...prev,
        [room.recipientId]: 0
      }));
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendMessage(inputText);
    setInputText('');
  };

  // Trigger calling overlay
  const handleInitiateCall = (callType) => {
    if (!selectedRoom || !socket) return;
    
    let participants = [];
    if (selectedRoom.type === 'direct') {
      participants = [user.id, selectedRoom.recipientId];
    } else {
      // In a real app we'd fetch all memberIds of the team.
      // We will fetch members details of the team on trigger,
      // or for simplicity, we can load all users assigned to the team.
      // Let's call the API to fetch team details to get member list.
      axios.get(`/api/teams/${selectedRoom.id}`).then(res => {
        participants = res.data.memberIds ? res.data.memberIds.map(m => m._id) : [];
        if (!participants.includes(user.id)) participants.push(user.id);
        
        triggerCall(participants, callType);
      }).catch(() => {
        // Fallback participants
        participants = [user.id];
        triggerCall(participants, callType);
      });
      return;
    }

    triggerCall(participants, callType);
  };

  const triggerCall = (participants, callType) => {
    const callData = {
      roomId: selectedRoom.id,
      initiatedBy: user.id,
      participants,
      type: callType
    };
    
    socket.emit('initiate-call', callData);
    
    // Set active call state locally for display
    setActiveCall({
      ...callData,
      callId: `call_${Date.now()}`,
      callerName: selectedRoom.name,
      callerAvatar: selectedRoom.avatar || ''
    });
  };

  // Scroll message thread to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedRoom]);

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
              ) : rooms.teams.length === 0 ? (
                <div className="p-3 text-xs text-gray-600 italic">No assigned squads.</div>
              ) : (
                rooms.teams.map(t => (
                  <button
                    key={t.id}
                    onClick={() => handleSelectRoom(t)}
                    className={`w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                      selectedRoom && selectedRoom.id === t.id
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
            <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2 mb-2">Direct Messages</h4>
            <div className="space-y-1">
              {loadingRooms ? (
                <div className="p-3 text-center text-xs text-gray-600">Loading members...</div>
              ) : rooms.members.length === 0 ? (
                <div className="p-3 text-xs text-gray-600 italic">No members list.</div>
              ) : (
                rooms.members.map(m => {
                  const dmRoomId = getDMId(user.id, m.id);
                  const unreadCount = unreadDMs[m.id] || 0;
                  const isSelected = selectedRoom && selectedRoom.id === dmRoomId;
                  
                  return (
                    <button
                      key={m.id}
                      onClick={() => handleSelectRoom({
                        id: dmRoomId,
                        name: m.name,
                        type: 'direct',
                        avatar: m.avatar,
                        recipientId: m.id
                      })}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-colors border cursor-pointer ${
                        isSelected
                          ? 'bg-[#00BFFF]/10 border-[#00BFFF]/20 text-white'
                          : 'text-gray-400 hover:bg-gray-850 hover:text-white border-transparent'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <img 
                          src={m.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(m.name)}`} 
                          alt={m.name} 
                          className="h-7 w-7 rounded-full bg-[#7C3AED]"
                        />
                        <div className="min-w-0">
                          <span className="text-xs font-semibold block text-white truncate">{m.name}</span>
                          <span className="text-[9px] text-gray-500 block truncate">{m.role}</span>
                        </div>
                      </div>

                      {/* Unread count badge */}
                      {unreadCount > 0 && !isSelected && (
                        <span className="bg-[#22C55E] text-white text-[9px] font-bold rounded-full h-4.5 w-4.5 flex items-center justify-center">
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
                  <img 
                    src={selectedRoom.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(selectedRoom.name)}`}
                    alt={selectedRoom.name}
                    className="h-8 w-8 rounded-full bg-[#7C3AED]"
                  />
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
                    <div 
                      key={msg._id || idx}
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

                      {/* Timestamp */}
                      <span className="text-[9px] text-gray-600 font-medium mt-1 mx-1.5">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
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
            <p className="text-xs">Choose a team channel or member on the left to start collaborating.</p>
          </div>
        )}

      </div>

    </div>
  );
}
