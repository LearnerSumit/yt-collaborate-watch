// src/hooks/useRoom.ts
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { socket } from '../api/socket';
import type { User, Message, VideoState, Reaction, VideoInfo } from '../types';

export const useRoom = (roomId: string | undefined) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // --- State Management ---
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [videoState, setVideoState] = useState<VideoState>({ isPlaying: false, time: 0, speed: 1 });
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentVideo, setCurrentVideo] = useState<VideoInfo | null>(null);
  
  // --- CORE CHANGE: `isSyncing` ko `useRef` se `useState` banaya gaya hai ---
  // Aisa isliye kyunki `useState` ko update karne se component re-render hota hai,
  // jo `RoomPage` ke sync `useEffect` ko trigger karne ke liye zaroori hai.
  const [isSyncing, setIsSyncing] = useState(false);

  // --- Main Effect for Socket Connection and Listeners ---
  useEffect(() => {
    if (!roomId) {
      navigate('/');
      return;
    }
    
    // Initial video from URL params
    const initialSource = searchParams.get('source') as VideoInfo['source'] | null;
    const initialId = searchParams.get('id');
    const initialVideo = initialSource && initialId ? { source: initialSource, id: initialId } : null;
    
    // Get or prompt for username
    let userName = localStorage.getItem('userName');
    if (!userName) {
      userName = prompt("Please enter your name:");
      if (!userName || userName.trim() === '') {
        navigate('/');
        return;
      }
      localStorage.setItem('userName', userName.trim());
    }
    
    // Connect and join room
    socket.connect();
    socket.emit('join-room', { roomId, user: { name: userName } });

    // --- Socket Event Listeners ---
    socket.on('room-state', (state: { users: User[], videoState: VideoState, currentVideo: VideoInfo | null }) => {
      const self = state.users.find(u => u.id === socket.id);
      if (self) setCurrentUser(self);
      setUsers(state.users);
      setCurrentVideo(state.currentVideo || initialVideo);
      setVideoState(state.videoState);
      // isSyncing.current = true; // OLD
      setIsSyncing(true); // NEW: State setter use karein
    });

    socket.on('player-state-update', (newState: VideoState) => {
      // isSyncing.current = true; // OLD
      setIsSyncing(true); // NEW: State setter use karein
      setVideoState(newState);
    });

    socket.on('video-changed', (newVideo: VideoInfo) => {
      // isSyncing.current = true; // OLD
      setIsSyncing(true); // NEW: State setter use karein
      setCurrentVideo(newVideo);
      setVideoState({ isPlaying: true, time: 0, speed: 1 });
    });

    // Baki listeners mein koi badlav nahi hai
    socket.on('user-joined', (newUser: User) => setUsers(prev => [...prev, newUser]));
    socket.on('user-left', (userId: string) => setUsers(prev => prev.filter(u => u.id !== userId)));
    socket.on('new-message', (message: Message) => setMessages(prev => [...prev, message]));
    socket.on('new-reaction', (reaction: Reaction) => setReactions(prev => [...prev, { ...reaction, id: `${reaction.userId}-${Date.now()}` }]));
    socket.on('user-voice-state-updated', ({ userId, voiceState }) => {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, voiceState } : u));
    });

    // --- Cleanup ---
    return () => {
      socket.off('room-state');
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('player-state-update');
      socket.off('video-changed');
      socket.off('new-message');
      socket.off('new-reaction');
      socket.off('user-voice-state-updated');
      socket.disconnect();
    };
  }, [roomId, navigate, searchParams]);


  // --- Event Handlers ---
  const handlePlayerStateChange = useCallback((newState: Partial<VideoState>) => {
    // Ab `isSyncing` ek state hai, isliye isse seedha use kar sakte hain.
    if (isSyncing) return;

    const fullState = { ...videoState, ...newState };
    setVideoState(fullState);
    socket.emit('player-state-change', { roomId, state: fullState });
  }, [roomId, videoState, isSyncing]); // isSyncing ko dependency array mein add karein

  const handleChangeVideo = useCallback((video: VideoInfo) => {
    socket.emit('change-video', { roomId, video });
  }, [roomId]);

  const handleSendMessage = useCallback((text: string) => {
    if (currentUser && roomId) {
      socket.emit('send-message', { roomId, message: { user: currentUser, text, timestamp: new Date().toString() } });
    }
  }, [roomId, currentUser]);

  const handleSendReaction = useCallback((emoji: string) => {
    if (currentUser && roomId) {
      socket.emit('send-reaction', { roomId, reaction: { emoji, userId: currentUser.id } });
    }
  }, [roomId, currentUser]);

  // --- Return all state and handlers ---
  return {
    users,
    messages,
    videoState,
    reactions,
    currentUser,
    currentVideo,
    isSyncing, // isSyncing state ko return karein
    setIsSyncing, // <<<< YEH SABSE ZAROORI HAI: Setter function ko bhi return karein
    handlePlayerStateChange,
    handleChangeVideo,
    handleSendMessage,
    handleSendReaction,
    // Note: setVideoState ko return karna generally zaroori nahi hai,
    // kyunki aapke paas handlePlayerStateChange jaisa specific handler hai.
  };
};