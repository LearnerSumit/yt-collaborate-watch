// src/types/index.ts
export type User = {
  id: string;
  name: string;
  roomId: string;
  // This new property will be managed by the server
  voiceState?: {
    isJoined: boolean;
    isMuted: boolean;
  };
};

export interface Message {
  id: string;
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

export interface VideoInfo {
  source: 'youtube' | 'gdrive' | 'unknown';
  id: string | null;
}
