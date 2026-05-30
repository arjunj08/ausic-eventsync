import React, { useState } from "react";

/**
 * ChatPanel - Team chat UI component for real-time messaging
 */
export const ChatPanel = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      user: "John Doe",
      message: "Event setup is looking good!",
      timestamp: new Date(Date.now() - 300000),
      role: "admin",
    },
    {
      id: 2,
      user: "Jane Smith",
      message: "I've updated the schedule",
      timestamp: new Date(Date.now() - 120000),
      role: "organizer",
    },
  ]);
  const [newMessage, setNewMessage] = useState("");

  const handleSend = () => {
    if (newMessage.trim()) {
      setMessages([
        ...messages,
        {
          id: messages.length + 1,
          user: "You",
          message: newMessage,
          timestamp: new Date(),
          role: "user",
        },
      ]);
      setNewMessage("");
    }
  };

  return (
    <div className="flex flex-col h-96 bg-dark-card border border-dark-border rounded-lg shadow-lg">
      <div className="p-4 border-b border-dark-border bg-dark-border">
        <h3 className="font-semibold text-white">Team Chat</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => (
          <div key={msg.id} className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-primary">{msg.user}</span>
              <span className="text-xs text-gray-500">
                {msg.timestamp.toLocaleTimeString()}
              </span>
              {msg.role === "admin" && (
                <span className="badge-success text-xs">Admin</span>
              )}
            </div>
            <p className="text-gray-200 text-sm ml-2">{msg.message}</p>
          </div>
        ))}
      </div>

      <div className="border-t border-dark-border p-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type a message..."
            className="input-field flex-1"
          />
          <button onClick={handleSend} className="btn-primary px-4">
            Send
          </button>
        </div>
      </div>
    </div>
  );
};
