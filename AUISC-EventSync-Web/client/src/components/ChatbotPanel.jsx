import React, { useState } from "react";

/**
 * ChatbotPanel - Floating AI chatbot panel for assistance
 */
export const ChatbotPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "bot",
      text: "Hi! I'm EventSync AI. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");

  const handleSendMessage = () => {
    if (input.trim()) {
      setMessages([
        ...messages,
        { id: messages.length + 1, type: "user", text: input },
      ]);

      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: prev.length + 1,
            type: "bot",
            text: "I understand. Let me help you with that.",
          },
        ]);
      }, 500);

      setInput("");
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-24 md:bottom-8 right-8 w-14 h-14 bg-gradient-to-br from-primary to-secondary rounded-full shadow-lg hover:shadow-2xl transition-all flex items-center justify-center text-white font-bold text-xl"
      >
        💬
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-40 md:bottom-24 right-8 w-80 bg-dark-card border border-dark-border rounded-lg shadow-2xl flex flex-col max-h-96">
          <div className="bg-dark-border p-4 flex items-center justify-between rounded-t-lg">
            <h3 className="font-semibold text-white">EventSync AI</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.type === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`rounded-lg p-3 max-w-xs ${
                    msg.type === "user"
                      ? "bg-primary text-black"
                      : "bg-dark-border text-gray-200"
                  }`}
                >
                  <p className="text-sm">{msg.text}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-dark-border p-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Ask me anything..."
                className="input-field flex-1 text-sm"
              />
              <button onClick={handleSendMessage} className="btn-primary px-3">
                📨
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
