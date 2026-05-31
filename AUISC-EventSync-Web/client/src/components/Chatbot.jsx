import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Zap, X, Send, Loader2 } from 'lucide-react';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: 'Hi there! I am your EventSync AI Assistant. ⚡ How can I help you today?',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const sampleQuestions = [
    "What are my pending tasks?",
    "When is the next event?",
    "How much have I spent this month?",
    "Who is in my team?"
  ];

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    // Add user message
    const userMsg = {
      sender: 'user',
      text,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const res = await axios.post('/api/chat/ai', { message: text });
      
      const botMsg = {
        sender: 'bot',
        text: res.data.response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
      const errorMsg = {
        sender: 'bot',
        text: 'Sorry, I had trouble processing that request. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  return (
    <div className="fixed bottom-20 right-6 z-50">
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full bg-[#00BFFF] hover:bg-[#00D4FF] flex items-center justify-center text-black font-bold shadow-lg glow-active cursor-pointer transition-all hover:scale-105"
        >
          <Zap className="h-7 w-7 fill-black" />
        </button>
      )}

      {/* Slide-Up Chat Panel */}
      {isOpen && (
        <div className="w-[350px] sm:w-[400px] h-[500px] bg-[#111111] border border-gray-800 rounded-2xl flex flex-col shadow-2xl overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="h-14 bg-[#1a1a1a] px-4 flex items-center justify-between border-b border-gray-800">
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-[#00BFFF] fill-[#00BFFF]" />
              <span className="font-semibold text-white">EventSync Assistant</span>
            </div>
            <button 
              onClick={() => setIsOpen(false)} 
              className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar bg-[#0a0a0a]">
            {messages.map((msg, index) => (
              <div 
                key={index} 
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line ${
                    msg.sender === 'user' 
                      ? 'bg-[#00BFFF] text-black font-medium rounded-tr-none' 
                      : 'bg-[#1a1a1a] text-white rounded-tl-none border border-gray-800'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex justify-start">
                <div className="bg-[#1a1a1a] text-gray-400 border border-gray-800 rounded-2xl rounded-tl-none px-4 py-3 text-sm flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin text-[#00BFFF]" />
                  <span>Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestion Prompts */}
          {messages.length === 1 && (
            <div className="p-3 bg-[#0c0c0c] border-t border-gray-800/50 flex flex-wrap gap-2 justify-center">
              {sampleQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(q)}
                  className="text-xs bg-[#161616] hover:bg-[#202020] text-gray-400 hover:text-white border border-gray-850 px-2.5 py-1.5 rounded-full transition-colors cursor-pointer text-left"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Chat Input */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
            className="p-3 bg-[#1a1a1a] border-t border-gray-850 flex items-center space-x-2"
          >
            <input
              type="text"
              placeholder="Ask about tasks, events, expenses..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 bg-[#0a0a0a] text-white placeholder-gray-500 border border-gray-800 focus:border-[#00BFFF] outline-none px-4 h-10 rounded-lg text-sm transition-all"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || loading}
              className="h-10 w-10 bg-[#00BFFF] hover:bg-[#00D4FF] disabled:bg-gray-800 disabled:text-gray-600 text-black flex items-center justify-center rounded-lg transition-colors cursor-pointer"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
