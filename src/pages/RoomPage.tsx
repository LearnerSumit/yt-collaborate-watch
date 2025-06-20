import React, { useState, useRef, useEffect } from "react"; // <-- Import useState
import { useParams } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react"; // <-- Icons for the toggle button

// Import BOTH hooks
import { useRoom } from "../hooks/useRoom";
import { useVoiceChat } from "../hooks/useVoiceChat";

// Component Imports
import FloatingEmojis from "../components/FloatingEmojis";
import VideoPlayer from "../components/VideoPlayer";
import ParticipantList from "../components/ParticipantList";
import ChatSidebar from "../components/ChatSidebar";

const RoomPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();

  // --- NEW: State to manage the chat sidebar visibility ---
  const [isChatOpen, setIsChatOpen] = useState(true);

  // --- Hook 1: For Room State (Video, Chat, Users list) ---
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

  // --- Hook 2: For Voice Chat Logic ---
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

  //

  useEffect(() => {
    // STEP 1: Agar sync mode 'false' hai, toh kuch na karein.
    // Iska matlab user abhi player ko control kar raha hai, ya koi server update nahi hai.
    if (!isSyncing || !currentVideo) {
      return;
    }

    const syncTolerance = 1.5; // seconds. Itna difference aam hai, isse zyada par sync hoga.

    // STEP 2: Player ke source ke hisaab se logic chalao.
    switch (currentVideo.source) {
      case "youtube":
        // Pehle check karo ki player ready hai ya nahi.
        if (
          ytPlayerRef.current &&
          typeof ytPlayerRef.current.getPlayerState === "function"
        ) {
          const player = ytPlayerRef.current;

          // Logic 1: Time Sync (Seek)
          const playerCurrentTime = player.getCurrentTime() || 0;
          if (Math.abs(playerCurrentTime - videoState.time) > syncTolerance) {
            player.seekTo(videoState.time, true);
          }

          // Logic 2: Play/Pause Sync (hamesha check hoga)
          const playerState = player.getPlayerState(); // 1: Playing, 2: Paused
          if (videoState.isPlaying && playerState !== 1) {
            player.playVideo();
          } else if (!videoState.isPlaying && playerState !== 2) {
            player.pauseVideo();
          }
        }
        break;

      case "gdrive":
        // Pehle check karo ki player ready hai ya nahi.
        if (gdrivePlayerRef.current) {
          const player = gdrivePlayerRef.current;

          // Logic 1: Time Sync (Seek)
          if (Math.abs(player.currentTime - videoState.time) > syncTolerance) {
            player.currentTime = videoState.time;
          }

          // Logic 2: Play/Pause Sync (hamesha check hoga)
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

    // STEP 3: SABSE ZAROORI - Sync command dene ke baad, sync mode ko 'false' par reset karein.
    // Isse player wapas user ke control mein aa jaata hai.
    const timer = setTimeout(() => {
      setIsSyncing(false);
    }, 200); // 200ms ka buffer taaki player command process karle.

    // Cleanup function
    return () => clearTimeout(timer);
  }, [videoState, currentVideo, isSyncing, setIsSyncing]); // Saari zaroori dependencies

  return (
    // Add `relative` to the main container to position the toggle button
    <div className="relative flex flex-col lg:flex-row gap-3 h-screen max-h-screen bg-gray-900 text-white overflow-hidden">
      {/* --- NEW: Button to toggle the chat sidebar --- */}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className={`
          absolute top-1/2 -translate-y-1/2 z-20 p-2 
          bg-gray-700 hover:bg-purple-600 text-white rounded-l-md transition-all duration-300
          hidden lg:block // Only show on large screens
          ${isChatOpen ? "right-[20rem] xl:right-[24rem]" : "right-0"}
        `}
        // The `right` values match the sidebar width (w-80=20rem, w-96=24rem)
      >
        {isChatOpen ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
      </button>

      {/* Left Side: Video Player and Participant List (this will auto-expand) */}
      <div className="flex-grow flex flex-col p-4 gap-4">
        <div className="player-container relative flex-grow min-h-0">
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

        <div className={`${isChatOpen ? "" : "mt-auto"}`}>
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

      {/* Right Side: Collapsible Chat Sidebar */}
      <div
        className={`
          flex-shrink-0 h-1/2 lg:h-full
          transition-all duration-500 ease-in-out
          overflow-hidden // Hide content when shrinking
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
      </div>
    </div>
  );
};

export default RoomPage;
