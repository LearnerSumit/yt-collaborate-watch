// src/components/Chat.tsx
import React, { useState, useRef, useEffect } from 'react';
import type { Message } from '../types';
import { Send } from 'lucide-react';

interface ChatProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
}

const Chat: React.FC<ChatProps> = ({ messages, onSendMessage }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input);
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-full p-4">
      <h2 className="text-xl font-bold mb-4 border-b border-gray-700 pb-2">Room Chat</h2>
      <div className="flex-grow overflow-y-auto pr-2">
        {messages.map((msg, i) => (
          <div key={i} className="mb-3">
            <strong className="text-purple-300">{msg.user.name}:</strong>
            <p className="text-gray-200 break-words">{msg.text}</p>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="flex mt-4 gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Say something..."
          className="flex-grow p-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-md transition-colors">
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};
export default Chat;