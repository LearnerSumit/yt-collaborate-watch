// src/pages/RoomPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { socket } from '../api/socket';
import type { User, Message, VideoState, Reaction } from '../types';
import VideoPlayer from '../components/VideoPlayer';
import ParticipantList from '../components/ParticipantList';
import FloatingEmojis from '../components/FloatingEmojis';
import Chat from '../components/Chat';
import EmojiBar from '../components/EmojiBar';



const RoomPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [videoState, setVideoState] = useState<VideoState>({ isPlaying: false, time: 0, speed: 1 });
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Effect to handle socket connection and events
  useEffect(() => {
    const initialVideoId = searchParams.get('videoId');
    if (!roomId) {
      navigate('/');
      return;
    }

    const userName = localStorage.getItem('userName') || prompt("Enter your name:") || `User_${Math.random().toString(16).substr(2, 4)}`;
    if (!userName) {
      navigate('/');
      return;
    }
    localStorage.setItem('userName', userName);
    const user: User = { id: socket.id ?? '', name: userName, roomId };


    setCurrentUser(user);

    socket.connect();
    socket.emit('join-room', { roomId, user: { name: userName } });

    // Listen for initial state
    socket.on('room-state', (state: { users: User[], videoState: VideoState, currentVideoId: string | null }) => {
      setUsers(state.users);
      setVideoState(state.videoState);
      setCurrentVideoId(state.currentVideoId || initialVideoId);
    });

    // Listen for updates
    socket.on('user-joined', (newUser: User) => setUsers(prev => [...prev, newUser]));
    socket.on('user-left', (userId: string) => setUsers(prev => prev.filter(u => u.id !== userId)));
    socket.on('player-state-update', (state: VideoState) => setVideoState(state));
    socket.on('video-changed', (newVideoId: string) => setCurrentVideoId(newVideoId));
    socket.on('new-message', (message: Message) => setMessages(prev => [...prev, message]));
    socket.on('new-reaction', (reaction: Reaction) => {
      setReactions(prev => [...prev, { ...reaction, id: `${reaction.userId}-${Date.now()}` }]);
    });

    return () => {
      socket.off('room-state');
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('player-state-update');
      socket.off('video-changed');
      socket.off('new-message');
      socket.off('new-reaction');
      socket.disconnect();
    };
  }, [roomId, navigate, searchParams]);

  const handlePlayerStateChange = useCallback((newState: Partial<VideoState>) => {
    const updatedState = { ...videoState, ...newState };
    socket.emit('player-state-change', { roomId, state: updatedState });
    setVideoState(updatedState); // Optimistic update
  }, [roomId, videoState]);

  const handleChangeVideo = useCallback((newVideoId: string) => {
    socket.emit('change-video', { roomId, videoId: newVideoId });
  }, [roomId]);
  
  const handleSendMessage = useCallback((text: string) => {
    if (currentUser) {
      const message: Message = { user: currentUser, text, timestamp: new Date().toISOString() };
      socket.emit('send-message', { roomId, message });
    }
  }, [roomId, currentUser]);

  const handleSendReaction = useCallback((emoji: string) => {
    if (currentUser) {
      const reaction = { emoji, userId: currentUser.id };
      socket.emit('send-reaction', { roomId, reaction });
    }
  }, [roomId, currentUser]);

  return (
    <div className="flex flex-col lg:flex-row h-screen max-h-screen overflow-hidden">
      <div className="flex-grow flex flex-col p-4 gap-4 relative">
        <VideoPlayer
          videoId={currentVideoId}
          currentState={videoState}
          onStateChange={handlePlayerStateChange}
          onVideoChange={handleChangeVideo}
        />
        <ParticipantList users={users} roomId={roomId!} />
        <FloatingEmojis reactions={reactions} />
      </div>
      <div className="w-full lg:w-80 xl:w-96 flex-shrink-0 bg-gray-800 flex flex-col">
        <Chat messages={messages} onSendMessage={handleSendMessage} />
        <EmojiBar onSendReaction={handleSendReaction} />
      </div>
    </div>
  );
};

export default RoomPage;