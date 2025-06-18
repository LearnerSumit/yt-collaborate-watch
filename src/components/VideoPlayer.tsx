// src/components/VideoPlayer.tsx
import React, { useEffect, useRef, useState } from 'react';
import type { VideoState } from '../types';

declare global { interface Window { onYouTubeIframeAPIReady: () => void; YT: any; } }

interface VideoPlayerProps {
  videoId: string | null;
  currentState: VideoState;
  onStateChange: (state: Partial<VideoState>) => void;
  onVideoChange: (videoId: string) => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoId, currentState, onStateChange, onVideoChange }) => {
  const playerRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);
  const isSyncing = useRef(false);
  const [newVideoUrl, setNewVideoUrl] = useState('');

  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      window.document.body.appendChild(tag);
      window.onYouTubeIframeAPIReady = () => setIsReady(true);
    } else {
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    if (isReady && videoId && !playerRef.current) {
      playerRef.current = new window.YT.Player('youtube-player', {
        height: '100%',
        width: '100%',
        videoId,
        playerVars: { autoplay: 1, controls: 1, modestbranding: 1, rel: 0 },
        events: { onStateChange: handlePlayerStateEvent },
      });
    } else if (playerRef.current && videoId && videoId !== playerRef.current.getVideoData().video_id) {
        playerRef.current.loadVideoById(videoId);
    }
  }, [isReady, videoId]);

  useEffect(() => {
    if (playerRef.current?.getPlayerState) {
      isSyncing.current = true;
      const playerState = playerRef.current.getPlayerState();
      
      if (currentState.isPlaying && playerState !== window.YT.PlayerState.PLAYING) {
        playerRef.current.playVideo();
      } else if (!currentState.isPlaying && playerState === window.YT.PlayerState.PLAYING) {
        playerRef.current.pauseVideo();
      }

      const timeDiff = Math.abs(playerRef.current.getCurrentTime() - currentState.time);
      if (timeDiff > 2) {
        playerRef.current.seekTo(currentState.time, true);
      }
      setTimeout(() => { isSyncing.current = false; }, 1000);
    }
  }, [currentState]);

  const handlePlayerStateEvent = (event: any) => {
    if (isSyncing.current) return;
    
    let isPlaying;
    if (event.data === window.YT.PlayerState.PLAYING) isPlaying = true;
    else if (event.data === window.YT.PlayerState.PAUSED) isPlaying = false;
    else return;

    onStateChange({ isPlaying, time: event.target.getCurrentTime() });
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newVideoId = newVideoUrl.split('v=')[1]?.split('&')[0];
    if (newVideoId) {
      onVideoChange(newVideoId);
      setNewVideoUrl('');
    }
  };

  return (
    <div className="flex-grow flex flex-col gap-2">
      <div className="aspect-video bg-black w-full rounded-lg overflow-hidden shadow-lg">
        {videoId ? <div id="youtube-player"></div> : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p>Waiting for a video to be added...</p>
          </div>
        )}
      </div>
      <form onSubmit={handleUrlSubmit} className="flex gap-2">
          <input
              type="text"
              value={newVideoUrl}
              onChange={(e) => setNewVideoUrl(e.target.value)}
              placeholder="Paste new YouTube URL to change video"
              className="flex-grow p-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-md transition-colors">
              Load
          </button>
      </form>
    </div>
  );
};

export default VideoPlayer;