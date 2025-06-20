import { Play, Pause, Volume2, VolumeX, Maximize, Settings} from 'lucide-react';
import type { VideoState } from '../types';
import { useEffect, useRef, useState } from 'react';

interface GDrivePlayerProps {
  src: string;
  gdrivePlayerRef: React.RefObject<HTMLVideoElement>;
  onPlayerStateChange: (newState: Partial<VideoState>) => void;
  onCanPlay: () => void; // To hide the main loading spinner
}

const GDrivePlayer: React.FC<GDrivePlayerProps> = ({
  src,
  gdrivePlayerRef,
  onPlayerStateChange,
  onCanPlay,
}) => {
  const playerContainerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true); // Start muted as per original requirement
  const [volume, setVolume] = useState(0.5);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [areControlsVisible, setAreControlsVisible] = useState(true);
  let controlsTimeout = useRef<number | null>(null);

  // Function to format time from seconds to MM:SS
  const formatTime = (timeInSeconds: number) => {
    const floorTime = Math.floor(timeInSeconds);
    const minutes = Math.floor(floorTime / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (floorTime % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  // Show controls and hide them after a delay
  const showControls = () => {
    setAreControlsVisible(true);
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    controlsTimeout.current = window.setTimeout(() => {
      if (gdrivePlayerRef.current && !gdrivePlayerRef.current.paused) {
        setAreControlsVisible(false);
      }
    }, 3000);
  };

  // Effect for handling controls visibility
  useEffect(() => {
    const container = playerContainerRef.current;
    container?.addEventListener("mousemove", showControls);
    container?.addEventListener("mouseleave", () => {
      if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
      if (isPlaying) setAreControlsVisible(false);
    });
    return () => {
      container?.removeEventListener("mousemove", showControls);
    };
  }, [isPlaying]);

  // Effect for binding video events
  useEffect(() => {
    const video = gdrivePlayerRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleDurationChange = () => setDuration(video.duration);
    const handlePlay = () => {
      setIsPlaying(true);
      showControls(); // Show controls briefly when play starts
      onPlayerStateChange({ isPlaying: true });
    };
    const handlePause = () => {
      setIsPlaying(false);
      showControls(); // Keep controls visible when paused
      onPlayerStateChange({ isPlaying: false });
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("durationchange", handleDurationChange);
    video.addEventListener("loadedmetadata", handleDurationChange);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("durationchange", handleDurationChange);
      video.removeEventListener("loadedmetadata", handleDurationChange);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
    };
  }, [gdrivePlayerRef, onPlayerStateChange]);

  // Effect for keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === "INPUT") return;
      const video = gdrivePlayerRef.current;
      if (!video) return;

      switch (e.key.toLowerCase()) {
        case " ":
          e.preventDefault();
          togglePlayPause();
          break;
        case "m":
          toggleMute();
          break;
        case "f":
          toggleFullScreen();
          break;
        case "arrowright":
          video.currentTime = Math.min(duration, video.currentTime + 5);
          onPlayerStateChange({ time: video.currentTime });
          break;
        case "arrowleft":
          video.currentTime = Math.max(0, video.currentTime - 5);
          onPlayerStateChange({ time: video.currentTime });
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [duration]);

  // Control functions
  const togglePlayPause = () => {
    if (gdrivePlayerRef.current) {
      gdrivePlayerRef.current.paused
        ? gdrivePlayerRef.current.play()
        : gdrivePlayerRef.current.pause();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (gdrivePlayerRef.current) {
      const newTime = Number(e.target.value);
      gdrivePlayerRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      onPlayerStateChange({ time: newTime });
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (gdrivePlayerRef.current) {
      const newVolume = Number(e.target.value);
      gdrivePlayerRef.current.volume = newVolume;
      gdrivePlayerRef.current.muted = newVolume === 0;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
    }
  };

  const toggleMute = () => {
    if (gdrivePlayerRef.current) {
      const currentlyMuted = gdrivePlayerRef.current.muted;
      gdrivePlayerRef.current.muted = !currentlyMuted;
      setIsMuted(!currentlyMuted);
      if (currentlyMuted) setVolume(0.5); // Restore volume when unmuting
    }
  };

  const changePlaybackSpeed = (speed: number) => {
    if (gdrivePlayerRef.current) {
      gdrivePlayerRef.current.playbackRate = speed;
      setPlaybackSpeed(speed);
      onPlayerStateChange({ speed });
    }
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      playerContainerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <div
      ref={playerContainerRef}
      className="relative w-full aspect-video bg-black group"
      onMouseMove={showControls}
    >
      <video
        ref={gdrivePlayerRef}
        src={src}
        autoPlay
        muted={isMuted}
        onCanPlay={onCanPlay} // Signal to parent that loading is done
        onClick={togglePlayPause}
        className="w-full h-full cursor-pointer"
      />

      {/* Custom Controls Overlay */}
      <div
        className={`custom-controls absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent transition-opacity duration-300 ${
          areControlsVisible ? "opacity-100" : "opacity-0"
        }`}
        // Stop clicks on the control bar from toggling play/pause on the video
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress Bar */}
        <input
          type="range"
          min="0"
          max={duration || 0}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1.5 bg-gray-600 rounded-lg appearance-none cursor-pointer range-sm accent-purple-500"
        />

        {/* Bottom Controls */}
        <div className="flex items-center justify-between mt-2 text-white">
          <div className="flex items-center gap-4">
            <button onClick={togglePlayPause}>
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>
            <div className="flex items-center gap-2">
              <button onClick={toggleMute}>
                {isMuted || volume === 0 ? (
                  <VolumeX size={24} />
                ) : (
                  <Volume2 size={24} />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-20 h-1.5 bg-gray-600 rounded-lg appearance-none cursor-pointer range-sm accent-white"
              />
            </div>
            <span className="text-sm font-mono">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative group/settings">
              <button>
                <Settings size={20} />
              </button>
              <div className="absolute bottom-full right-0 mb-2 p-2 bg-black/80 rounded-md hidden group-hover/settings:block">
                <p className="text-sm text-gray-400 mb-1">Speed</p>
                {[0.5, 1, 1.5, 2].map((speed) => (
                  <button
                    key={speed}
                    onClick={() => changePlaybackSpeed(speed)}
                    className={`block w-full text-left p-1 rounded ${
                      playbackSpeed === speed
                        ? "bg-purple-600"
                        : "hover:bg-gray-700"
                    }`}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
            </div>
            <button onClick={toggleFullScreen}>
              <Maximize size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GDrivePlayer;