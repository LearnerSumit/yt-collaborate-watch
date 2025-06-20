import React, { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Import hooks
import { useRoom } from "../hooks/useRoom";
import { useVoiceChat } from "../hooks/useVoiceChat";

// Component Imports
import FloatingEmojis from "../components/FloatingEmojis";
import VideoPlayer from "../components/VideoPlayer";
import ParticipantList from "../components/ParticipantList";
import ChatSidebar from "../components/ChatSidebar";

const RoomPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();

  // State to manage the chat sidebar visibility
  const [isChatOpen, setIsChatOpen] = useState(true);

  // Hook for Room State (Video, Chat, Users list)
  const {
    users,
    messages,
    videoState,
    reactions,
    currentUser,
    currentVideo,
    isSyncing,
    handlePlayerStateChange,
    handleSendMessage,
    handleSendReaction,
    setIsSyncing,
  } = useRoom(roomId);

  // Hook for Voice Chat Logic
  const {
    isInVoiceChat,
    isMuted,
    joinVoiceChat,
    leaveVoiceChat,
    toggleMute,
    blockedUserIds,
    blockUserAudio,
    unblockUserAudio,
  } = useVoiceChat({ roomId, currentUser });

  const ytPlayerRef = useRef<any>(null);
  const gdrivePlayerRef = useRef<HTMLVideoElement>(null);

  // Effect for syncing player state
  useEffect(() => {
    if (!isSyncing || !currentVideo) {
      return;
    }
    const syncTolerance = 1.5;
    switch (currentVideo.source) {
      case "youtube":
        if (
          ytPlayerRef.current &&
          typeof ytPlayerRef.current.getPlayerState === "function"
        ) {
          const player = ytPlayerRef.current;
          const playerCurrentTime = player.getCurrentTime() || 0;
          if (Math.abs(playerCurrentTime - videoState.time) > syncTolerance) {
            player.seekTo(videoState.time, true);
          }
          const playerState = player.getPlayerState();
          if (videoState.isPlaying && playerState !== 1) {
            player.playVideo();
          } else if (!videoState.isPlaying && playerState !== 2) {
            player.pauseVideo();
          }
        }
        break;
      case "gdrive":
        if (gdrivePlayerRef.current) {
          const player = gdrivePlayerRef.current;
          if (Math.abs(player.currentTime - videoState.time) > syncTolerance) {
            player.currentTime = videoState.time;
          }
          if (videoState.isPlaying && player.paused) {
            player
              .play()
              .catch((e) => console.error("GDrive sync play error:", e));
          } else if (!videoState.isPlaying && !player.paused) {
            player.pause();
          }
        }
        break;
      default:
        break;
    }
    const timer = setTimeout(() => {
      setIsSyncing(false);
    }, 200);
    return () => clearTimeout(timer);
  }, [videoState, currentVideo, isSyncing, setIsSyncing]);

  return (
    // Main container - gap removed for better control
    <div className="relative flex flex-col lg:flex-row h-screen max-h-screen bg-gray-900 text-white overflow-hidden">
      {/* Sidebar Toggle Button - No changes needed here */}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className={`
          absolute top-1/2 -translate-y-1/2 z-20 p-2 
          bg-gray-700 hover:bg-purple-600 text-white rounded-l-md transition-all duration-300
          hidden lg:block
          ${isChatOpen ? "right-[20rem] xl:right-[24rem]" : "right-0"}
        `}
      >
        {isChatOpen ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
      </button>

      <main className="flex-1 min-w-0 flex flex-col p-4 gap-2">
        {/* 👇 Main content area split into 2 sections: video and fixed-height participants */}
        <div className="flex flex-col flex-1 min-h-0 gap-2">
          {/* 👇 Video player takes all available space, emojis float on top */}
          <div className="relative flex-1 min-h-0">
            <VideoPlayer
              currentVideo={currentVideo}
              ytPlayerRef={ytPlayerRef}
              gdrivePlayerRef={
                gdrivePlayerRef as React.RefObject<HTMLVideoElement>
              }
              onPlayerStateChange={handlePlayerStateChange}
            />
            <FloatingEmojis reactions={reactions} />
          </div>

          {/* 👇 Fixed height participant list - no scroll, no overlap */}
          <div className="h-28 sm:h-32 md:h-36 lg:h-40 xl:h-48">
            <ParticipantList
              users={users}
              currentUser={currentUser}
              isInVoiceChat={isInVoiceChat}
              isMuted={isMuted}
              joinVoiceChat={joinVoiceChat}
              leaveVoiceChat={leaveVoiceChat}
              onToggleMute={toggleMute}
              onSendReaction={handleSendReaction}
              blockedUserIds={blockedUserIds}
              onBlockUser={blockUserAudio}
              onUnblockUser={unblockUserAudio}
              isChatOpen={isChatOpen}
            />
          </div>
        </div>
      </main>
      <aside
        className={`
          flex-shrink-0 h-1/2 lg:h-full
          transition-all duration-500 ease-in-out
          overflow-hidden
          ${
            isChatOpen
              ? "w-full lg:w-80 xl:w-96 border-t-2 lg:border-t-0 lg:border-l-2"
              : "w-0 border-none"
          }
          border-gray-700
        `}
      >
        <ChatSidebar
          messages={messages}
          onSendMessage={handleSendMessage}
          currentUser={currentUser!}
        />
      </aside>
    </div>
  );
};

export default RoomPage;
