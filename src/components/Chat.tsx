// src/components/Chat.tsx
import React, { useState, useRef, useEffect } from 'react';
import type { Message, User } from '../types'; // <-- Import User type
import { Send } from 'lucide-react';

interface ChatProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  currentUser: User | null; // <-- Add currentUser to know who is sending the message
}

const Chat: React.FC<ChatProps> = ({ messages, onSendMessage, currentUser }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input);
      setInput('');
    }
  };

  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-gray-800">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-700">
        <h2 className="text-xl font-bold text-white">Room Chat</h2>
      </div>

      {/* Messages Area with custom scrollbar */}
      <div className="flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.map((msg, i) => {
          const isCurrentUser = msg.user.id === currentUser?.id;
          return (
            <div
              key={i}
              className={`flex items-end gap-2 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
            >
              {/* Avatar for other users */}
              {!isCurrentUser && (
                <div className="w-8 h-8 rounded-full bg-purple-500 flex-shrink-0 flex items-center justify-center text-white font-bold">
                  {msg.user.name.charAt(0).toUpperCase()}
                </div>
              )}

              {/* Message Bubble */}
              <div
                className={`flex flex-col max-w-xs md:max-w-md rounded-lg px-3 py-2 ${
                  isCurrentUser
                    ? 'bg-purple-600 text-white rounded-br-none'
                    : 'bg-gray-700 text-gray-200 rounded-bl-none'
                }`}
              >
                {!isCurrentUser && (
                  <strong className="text-sm font-semibold text-purple-300 mb-1">
                    {msg.user.name}
                  </strong>
                )}
                <p className="text-base break-words">{msg.text}</p>
                <span className="text-xs self-end mt-1 opacity-60">
                  {formatTimestamp(msg.timestamp)}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form Area */}
      <div className="flex-shrink-0 p-4 border-t border-gray-700">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Say something..."
            className="flex-grow p-3 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
          />
          <button
            type="submit"
            className="bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-md transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
            disabled={!input.trim()}
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;