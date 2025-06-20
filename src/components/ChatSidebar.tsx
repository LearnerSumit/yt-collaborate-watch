import React from 'react';
import type { Message, User } from '../types';

// Sirf Chat component import karenge
import Chat from './Chat';

// Props bhi simplify ho jayenge, kyonki ab users/roomId ki zaroorat nahi hai
interface ChatSidebarProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  currentUser: User;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ messages, onSendMessage, currentUser }) => {
  // activeTab state poori tarah se hata diya gaya hai
  return (
    // Main container waisa hi rahega
    <div className="flex flex-col h-full bg-gray-800">
      
      {/* Tab Buttons wala section poori tarah se hata diya gaya hai */}

      {/* Ab yahan conditional rendering nahi, sirf Chat component render hoga */}
      <Chat messages={messages} onSendMessage={onSendMessage} currentUser={currentUser} />
      
    </div>
  );
};

export default ChatSidebar;