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
    // Jab bhi video badle, loading state ko reset karein
    if (currentVideo) {
      setIsPlayerLoading(true);
    }
  }, [currentVideo?.id, currentVideo?.source]);

  // Loading Spinner component
  const LoadingSpinner = () => (
    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 z-10">
      <div className="w-16 h-16 border-4 border-solid border-gray-600 border-t-purple-500 rounded-full animate-spin"></div>
    </div>
  );
  
  // MUKHYA SUDHAR: Main container ab aspect ratio ke liye zimmedaar hai.
  // `aspect-video` se yeh hamesha 16:9 ratio mein rahega.
  // `w-full` se yeh apne parent ki poori width lega.
  // `flex items-center justify-center` "Waiting..." message ko center karta hai.
  return (
    <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black flex items-center justify-center">
      {isPlayerLoading && currentVideo && <LoadingSpinner />}
      
      {/* Agar koi video nahi hai to message dikhayein */}
      {!currentVideo && (
         <div className="text-gray-400 p-4 text-center">
           Waiting for video... Paste a URL below to get started.
         </div>
      )}

      {/* Jab video ho tabhi player render karein */}
      {currentVideo && (
        // Yeh container player ko fade-in effect dega aur poori jagah lega.
        <div className={`w-full h-full transition-opacity duration-300 ${isPlayerLoading ? 'opacity-0' : 'opacity-100'}`}>
          {(() => {
            switch (currentVideo.source) {
              case 'youtube':
                return (
                  <YouTube
                    videoId={currentVideo.id ?? undefined}
                    // className se yeh container ko poora bharega.
                    className="w-full h-full" 
                    opts={{ 
                      width: '100%', 
                      height: '100%', 
                      playerVars: { autoplay: 1, controls: 1 } 
                    }}
                    onReady={(e) => {
                      ytPlayerRef.current = e.target;
                      setIsPlayerLoading(false); 
                    }}
                    onPlay={() => onPlayerStateChange({ isPlaying: true, time: ytPlayerRef.current?.getCurrentTime() || 0 })}
                    onPause={() => onPlayerStateChange({ isPlaying: false, time: ytPlayerRef.current?.getCurrentTime() || 0 })}
                    onEnd={() => onPlayerStateChange({ isPlaying: false })}
                    onStateChange={(e) => {
                      if (e.data === 3) { // State 3 is "buffering"
                        onPlayerStateChange({ time: e.target.getCurrentTime() || 0 });
                      }
                    }}
                  />
                );

              case 'gdrive':
                // GDrivePlayer ab apne aap parent ki poori height/width le lega.
                // NOTE: Make sure your GDrivePlayer component's <video> tag also has `w-full h-full` classes.
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
                  <div className="w-full h-full flex items-center justify-center text-red-500">
                    Unsupported video source.
                  </div>
                );
            }
          })()}
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;