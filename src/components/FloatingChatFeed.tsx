// src/components/FloatingChatFeed.tsx
import React from 'react';
import type { Message, User } from '../types';

interface FloatingChatFeedProps {
  // Yeh messages ka array hoga jo abhi-abhi aaye hain
  messages: Message[]; 
  currentUser: User | null;
}

const FloatingChatFeed: React.FC<FloatingChatFeedProps> = ({ messages, currentUser }) => {
  
  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    // Container ko absolute position diya gaya hai taaki yeh video ke upar float kar sake.
    // pointer-events-none zaroori hai taaki aap iske peeche video ko control kar sakein.
    <div className="absolute top-4 left-4 w-full max-w-md pointer-events-none z-20 space-y-3">
      {messages.map((msg) => {
        // Check karte hain ki message current user ka hai ya kisi aur ka
        const isCurrentUser = msg.user.id === currentUser?.id;
        
        return (
          // Har message ko individual animation diya jayega
          <div
            key={msg.id} // Hamesha unique id use karein, jaise message id
            className="animate-fade-in-out"
          >
            {/* Yahan humne aapke Chat.tsx se message bubble ka exact style copy kiya hai */}
            <div
              className={`flex items-end gap-2 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isCurrentUser && (
                <div className="w-8 h-8 rounded-full bg-purple-500 flex-shrink-0 flex items-center justify-center text-white font-bold pointer-events-auto">
                  {msg.user.name.charAt(0).toUpperCase()}
                </div>
              )}

              <div
                // pointer-events-auto taaki log message text select/copy kar sakein agar chahe
                className={`flex flex-col max-w-xs md:max-w-md rounded-lg px-3 py-2 pointer-events-auto shadow-lg ${
                  isCurrentUser
                    ? 'bg-purple-600 text-white rounded-br-none'
                    : 'bg-gray-900 bg-opacity-70 text-gray-200 rounded-bl-none'
                }`}
              >
                {!isCurrentUser && (
                  <strong className="text-sm font-semibold text-purple-300 mb-1">
                    {msg.user.name}
                  </strong>
                )}
                <p className="text-base break-words">{msg.text}</p>
                <span className="text-xs self-end mt-1 opacity-70">
                  {formatTimestamp(msg.timestamp)}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FloatingChatFeed;