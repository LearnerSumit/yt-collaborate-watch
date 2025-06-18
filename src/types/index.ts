// src/types/index.ts
export interface User {
  id: string;
  name: string;
  roomId: string;
}

export interface Message {
  user: User;
  text: string;
  timestamp: string;
}

export interface VideoState {
  isPlaying: boolean;
  time: number;
  speed: number;
}

export interface Reaction {
  id: string; // Unique ID for the reaction instance
  emoji: string;
  userId: string;
}