// src/components/ParticipantList.tsx
import React from 'react';
import type { User } from '../types';
import { Users, Link } from 'lucide-react';

interface ParticipantListProps {
  users: User[];
  roomId: string;
}

const ParticipantList: React.FC<ParticipantListProps> = ({ users, roomId }) => {
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Room link copied to clipboard!');
  };

  // Filter users by current roomId
  const filteredUsers = users.filter(user => user.roomId === roomId);

  return (
    <div className="bg-gray-800 p-3 rounded-lg shadow-md flex justify-between items-center">
      <div className="flex items-center gap-3 overflow-x-auto">
        <Users className="text-gray-400 flex-shrink-0" />
        <div className="flex flex-wrap gap-2">
          {filteredUsers.map(user => (
            <span key={user.id} className="bg-gray-700 px-3 py-1 rounded-full text-sm font-medium">
              {user.name}
            </span>
          ))}
        </div>
      </div>
      <button onClick={handleCopyLink} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-md transition-colors">
        <Link size={16} />
        <span>Invite</span>
      </button>
    </div>
  );
};

export default ParticipantList;
