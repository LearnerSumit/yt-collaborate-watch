// src/components/EmojiBar.tsx

interface EmojiBarProps {
  onSendReaction: (emoji: string) => void;
}

const EMOJIS = ['👍', '😂', '❤️', '🔥', '🤯', '😢'];

const EmojiBar: React.FC<EmojiBarProps> = ({ onSendReaction }) => {
  return (
    <div className="bg-gray-700 p-2 border-t border-gray-700">
      <div className="flex justify-around">
        {EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => onSendReaction(emoji)}
            className="text-2xl p-2 rounded-full hover:bg-gray-900 transition-colors"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};

export default EmojiBar;