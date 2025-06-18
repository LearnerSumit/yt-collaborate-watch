// src/components/FloatingEmojis.tsx
import React from 'react';
import type { Reaction } from '../types';

interface FloatingEmojisProps {
  reactions: Reaction[];
}

const FloatingEmojis: React.FC<FloatingEmojisProps> = ({ reactions }) => {
  return (
    <div className="absolute bottom-20 right-4 pointer-events-none h-64 w-64 overflow-hidden">
      {reactions.map((reaction) => (
        <div
          key={reaction.id}
          className="absolute bottom-0 text-4xl animate-float-up"
          style={{
            left: `${Math.random() * 80}%`, // Random horizontal position
            animationDelay: `${Math.random() * 0.2}s`, // Stagger animations
          }}
        >
          {reaction.emoji}
        </div>
      ))}
    </div>
  );
};

export default FloatingEmojis;