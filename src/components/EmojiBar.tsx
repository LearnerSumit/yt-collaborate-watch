import React from 'react';

interface EmojiBarProps {
  onSendReaction: (emoji: string) => void;
  isChatOpen: boolean;
}

const EMOJIS = ['👍', '😂', '❤️', '🔥', '👏', '🤯','😢']; // 6 emojis are good for a compact bar

const EmojiBar: React.FC<EmojiBarProps> = ({ onSendReaction, isChatOpen }) => {
  return (
    // Remove background and padding, as it will be inside another component
    <div className={`flex bg-gray-700 p-1 rounded-lg items-center justify-center gap-1 ${isChatOpen ? '' : 'hidden'}`}>
      {EMOJIS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => onSendReaction(emoji)}
          // Slightly smaller text and padding for a compact look
          className="text-xl p-1 rounded-lg hover:bg-purple-600/50 transform hover:scale-125 transition-all duration-200 ease-in-out"
          title={`Send a ${emoji} reaction`}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
};

export default EmojiBar;