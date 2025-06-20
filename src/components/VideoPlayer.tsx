// src/components/VideoPlayer.tsx
import React, { useState, useEffect } from 'react';
import YouTube from 'react-youtube';
import type { VideoInfo, VideoState } from '../types';
import GDrivePlayer from './GDrivePlayer';

interface VideoPlayerProps {
  currentVideo: VideoInfo | null;
  ytPlayerRef: React.MutableRefObject<any>;
  gdrivePlayerRef: React.RefObject<HTMLVideoElement>;
  onPlayerStateChange: (newState: Partial<VideoState>) => void;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  currentVideo,
  ytPlayerRef,
  gdrivePlayerRef,
  onPlayerStateChange,
}) => {
  const [isPlayerLoading, setIsPlayerLoading] = useState(true);

  useEffect(() => {
    if (currentVideo) {
      setIsPlayerLoading(true);
    }
  }, [currentVideo?.id, currentVideo?.source]);

  if (!currentVideo) {
    return (
      <div className="aspect-video w-full bg-black flex items-center justify-center text-gray-400 p-4 text-center">
        Waiting for video... Paste a URL below to get started.
      </div>
    );
  }
  
  const LoadingSpinner = () => (
    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 z-10">
      <div className="w-16 h-16 border-4 border-solid border-gray-600 border-t-purple-500 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="relative w-full h-auto rounded-lg overflow-hidden bg-black">
      {isPlayerLoading && <LoadingSpinner />}
      
      <div className={`transition-opacity duration-300 ${isPlayerLoading ? 'opacity-0' : 'opacity-100'}`}>
        {(() => {
          switch (currentVideo.source) {
            case 'youtube':
              return (
                <YouTube
                  videoId={currentVideo.id ?? undefined}
                  opts={{ width: '100%', height: '100%', playerVars: { autoplay: 1, controls: 1 } }}
                  className="aspect-video w-full"
                  onReady={(e) => {
                    ytPlayerRef.current = e.target;
                    setIsPlayerLoading(false); 
                  }}
                  onPlay={() => onPlayerStateChange({ isPlaying: true, time: ytPlayerRef.current?.getCurrentTime() || 0 })}
                  onPause={() => onPlayerStateChange({ isPlaying: false, time: ytPlayerRef.current?.getCurrentTime() || 0 })}
                  onEnd={() => onPlayerStateChange({ isPlaying: false })}
                  onStateChange={(e) => {
                    if (e.data === 3) {
                      onPlayerStateChange({ time: e.target.getCurrentTime() || 0 });
                    }
                  }}
                />
              );

            case 'gdrive':
              return (
                <GDrivePlayer
                  src={`${import.meta.env.VITE_BACKEND_URI}/api/stream/gdrive/${currentVideo.id}`}
                  gdrivePlayerRef={gdrivePlayerRef}
                  onPlayerStateChange={onPlayerStateChange}
                  onCanPlay={() => setIsPlayerLoading(false)}
                />
              );

            default:
              return (
                <div className="aspect-video w-full bg-black flex items-center justify-center text-red-500">
                  Unsupported video source.
                </div>
              );
          }
        })()}
      </div>
    </div>
  );
};

export default VideoPlayer;