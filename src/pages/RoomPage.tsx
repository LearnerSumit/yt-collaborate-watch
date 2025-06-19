import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { socket } from '../api/socket';
import type { User, Message, VideoState, Reaction } from '../types';

import ParticipantList from '../components/ParticipantList';
import FloatingEmojis from '../components/FloatingEmojis';
import Chat from '../components/Chat';
import EmojiBar from '../components/EmojiBar';
import YouTube from 'react-youtube';

// This section is unchanged
type VideoInfo = {
  source: 'youtube' | 'gdrive';
  id: string;
};
const parseVideoUrl = (url: string): VideoInfo | null => {
  const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const ytMatch = url.match(ytRegex);
  if (ytMatch && ytMatch[1]) return { source: 'youtube', id: ytMatch[1] };
  const gdRegex = /drive\.google\.com\/(?:file\/d\/|open\?id=)([a-zA-Z0-9_-]+)/;
  const gdMatch = url.match(gdRegex);
  if (gdMatch && gdMatch[1]) {
    const embedLink = `https://drive.google.com/file/d/${gdMatch[1]}/preview`;
    return { source: 'gdrive', id: embedLink };
  }
  return null;
};
const VideoURLInput = ({ onVideoChange }: { onVideoChange: (video: VideoInfo) => void }) => {
  const [url, setUrl] = useState('');
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const videoInfo = parseVideoUrl(url);
    if (videoInfo) {
      onVideoChange(videoInfo);
      setUrl('');
    } else {
      alert('Invalid YouTube or Google Drive URL');
    }
  };
  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mt-2">
      <input
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Paste new video URL and press Enter"
        className="flex-grow p-2 bg-gray-900 border border-gray-700 rounded-md"
      />
      <button type="submit" className="px-4 py-2 bg-purple-600 rounded-md">Change</button>
    </form>
  );
};


const RoomPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // States are unchanged
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [videoState, setVideoState] = useState<VideoState>({ isPlaying: false, time: 0, speed: 1 });
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentVideo, setCurrentVideo] = useState<VideoInfo | null>(null);
  const ytPlayerRef = useRef<any>(null);
  const gdrivePlayerRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (!roomId) {
      navigate('/');
      return;
    }

    const initialSource = searchParams.get('source') as VideoInfo['source'] | null;
    const initialId = searchParams.get('id');
    if (initialSource && initialId) {
      setCurrentVideo({ source: initialSource, id: initialId });
    }

    // --- NEW: Ask for user's name if not already set ---
    let userName = localStorage.getItem('userName');
    if (!userName) {
      userName = prompt("Please enter your name:");
      // If user cancels or enters nothing, navigate to home page.
      if (!userName || userName.trim() === '') {
        navigate('/');
        return;
      }
      localStorage.setItem('userName', userName.trim());
    }
    
    // The rest of the useEffect is unchanged
    const user: User = { id: socket.id ?? '', name: userName, roomId };
    setCurrentUser(user);
    socket.connect();
    socket.emit('join-room', { roomId, user: { name: userName } });
    socket.on('room-state', (state: { users: User[], videoState: VideoState, currentVideo: VideoInfo | null }) => {
      setUsers(state.users);
      setVideoState(state.videoState);
      setCurrentVideo(state.currentVideo || (initialSource && initialId ? { source: initialSource, id: initialId } : null));
    });
    socket.on('user-joined', (newUser: User) => setUsers(prev => [...prev, newUser]));
    socket.on('user-left', (userId: string) => setUsers(prev => prev.filter(u => u.id !== userId)));
    socket.on('player-state-update', (state: VideoState) => setVideoState(state));
    socket.on('video-changed', (newVideo: VideoInfo) => setCurrentVideo(newVideo));
    socket.on('new-message', (message: Message) => setMessages(prev => [...prev, message]));
    socket.on('new-reaction', (reaction: Reaction) =>
      setReactions(prev => [...prev, { ...reaction, id: `${reaction.userId}-${Date.now()}` }])
    );
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

  // All other hooks and render logic are unchanged.
  useEffect(() => {
    if (!currentVideo) return;
    const player = currentVideo.source === 'youtube' ? ytPlayerRef.current : gdrivePlayerRef.current;
    if (!player) return;
    if (currentVideo.source === 'youtube') {
      const isPlaying = player.getPlayerState() === 1;
      if (videoState.isPlaying && !isPlaying) player.playVideo();
      if (!videoState.isPlaying && isPlaying) player.pauseVideo();
      const currentTime = player.getCurrentTime();
      if (Math.abs(currentTime - videoState.time) > 1.5) player.seekTo(videoState.time);
      const currentSpeed = player.getPlaybackRate();
      if (currentSpeed !== videoState.speed) player.setPlaybackRate(videoState.speed);
    }
  }, [videoState, currentVideo]);

  const handlePlayerStateChange = useCallback((newState: Partial<VideoState>) => {
    const updatedState = { ...videoState, ...newState };
    socket.emit('player-state-change', { roomId, state: updatedState });
    setVideoState(updatedState);
  }, [roomId, videoState]);

  const handleChangeVideo = useCallback((video: VideoInfo) => {
    socket.emit('change-video', { roomId, video });
  }, [roomId]);

  const handleSendMessage = useCallback((text: string) => {
    if (currentUser) {
      const message: Message = { user: currentUser, text, timestamp: new Date().toISOString() };
      socket.emit('send-message', { roomId, message });
    }
  }, [roomId, currentUser]);

  const handleSendReaction = useCallback((emoji: string) => {
    if (currentUser) {
      socket.emit('send-reaction', { roomId, reaction: { emoji, userId: currentUser.id } });
    }
  }, [roomId, currentUser]);

  const renderPlayer = () => {
    if (!currentVideo) {
      return <div className="aspect-video w-full bg-black flex items-center justify-center text-gray-400">Waiting for video...</div>;
    }
    switch (currentVideo.source) {
      case 'youtube':
        return (
          <YouTube
            videoId={currentVideo.id}
            opts={{ width: '100%', height: '100%', playerVars: { autoplay: 1, controls: 1 } }}
            className="aspect-video w-full"
            onReady={(e) => { ytPlayerRef.current = e.target; }}
            onPlay={() => handlePlayerStateChange({ isPlaying: true, time: ytPlayerRef.current?.getCurrentTime() || 0 })}
            onPause={() => handlePlayerStateChange({ isPlaying: false, time: ytPlayerRef.current?.getCurrentTime() || 0 })}
            onEnd={() => handlePlayerStateChange({ isPlaying: false })}
          />
        );
      case 'gdrive':
        return (
          <iframe
            ref={gdrivePlayerRef}
            src={currentVideo.id}
            allow="autoplay"
            className="aspect-video w-full bg-black"
          />
        );
      default:
        return <div className="aspect-video w-full bg-black flex items-center justify-center text-red-500">Unsupported video source.</div>;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen max-h-screen overflow-hidden bg-gray-900 text-white">
      <div className="flex-grow flex flex-col p-4 gap-4 relative">
        <div className="player-container relative">
          {renderPlayer()}
          <FloatingEmojis reactions={reactions} />
        </div>
        <VideoURLInput onVideoChange={handleChangeVideo} />
        <ParticipantList users={users} roomId={roomId!} />
      </div>
      <div className="w-full lg:w-80 xl:w-96 flex-shrink-0 bg-gray-800 flex flex-col">
        <Chat messages={messages} onSendMessage={handleSendMessage} />
        <EmojiBar onSendReaction={handleSendReaction} />
      </div>
    </div>
  );
};

export default RoomPage;