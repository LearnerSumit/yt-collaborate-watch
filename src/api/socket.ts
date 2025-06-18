// src/api/socket.ts
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'https://yt-video-watch-backend-2.onrender.com';

export const socket: Socket = io(SOCKET_URL, {
  autoConnect: false, // Don't connect automatically
});
