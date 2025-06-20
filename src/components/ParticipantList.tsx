import React, { useRef, useState, useEffect } from "react";
import type { User } from "../types";
import {
  Mic,
  MicOff,
  Link,
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeOff,
} from "lucide-react";
import EmojiBar from "./EmojiBar";

interface ParticipantListProps {
  users: User[];
  currentUser: User | null;
  isInVoiceChat: boolean;
  joinVoiceChat: () => void;
  leaveVoiceChat: () => void;
  onSendReaction: (emoji: string) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  blockedUserIds: string[];
  onBlockUser: (userId: string) => void;
  onUnblockUser: (userId: string) => void;
  isChatOpen: boolean;
}

const ParticipantList: React.FC<ParticipantListProps> = ({
  users,
  currentUser,
  isInVoiceChat,
  joinVoiceChat,
  leaveVoiceChat,
  onSendReaction,
  blockedUserIds,
  onBlockUser,
  onUnblockUser,
  isChatOpen,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScrollability = () => {
    const el = scrollContainerRef.current;
    if (el) {
      const isScrollable = el.scrollWidth > el.clientWidth;
      setCanScrollLeft(el.scrollLeft > 0);
      setCanScrollRight(
        isScrollable && el.scrollLeft < el.scrollWidth - el.clientWidth - 1
      );
    }
  };

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) {
      checkScrollability();
      const observer = new ResizeObserver(checkScrollability);
      observer.observe(el);
      el.addEventListener("scroll", checkScrollability);
      return () => {
        observer.unobserve(el);
        el.removeEventListener("scroll", checkScrollability);
      };
    }
  }, [users]);

  const handleScroll = (direction: "left" | "right") => {
    const el = scrollContainerRef.current;
    if (el) {
      el.scrollBy({
        left:
          direction === "left" ? -el.clientWidth * 0.7 : el.clientWidth * 0.7,
        behavior: "smooth",
      });
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Room link copied to clipboard!");
  };

  return (
    <div
      className={`bg-gray-800/50 p-3 rounded-lg transition-all duration-300`}
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-white">
          Participants ({users.length})
        </h2>
        <div
          className={`hidden lg:flex flex-grow justify-center transition-all duration-300 ${
            !isChatOpen ? "hidden" : ""
          }`}
        >
          <EmojiBar isChatOpen={isChatOpen} onSendReaction={onSendReaction} />
        </div>
        <button
          onClick={handleCopyLink}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-md transition-colors"
        >
          <Link size={16} /> <span>Invite</span>
        </button>
      </div>

      <div className="relative">
        {canScrollLeft && (
          <button
            onClick={() => handleScroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-gray-900/70 hover:bg-gray-900 text-white rounded-full p-2 transition-opacity"
          >
            <ChevronLeft size={24} />
          </button>
        )}

        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide"
        >
          {users.map((user) => {
            const isCurrentUser = user.id === currentUser?.id;
            const isUserInVC = !!user.voiceState?.isJoined;
            const isBlockedByYou =
              !isCurrentUser && blockedUserIds.includes(user.id);

            return (
              <div
                key={user.id}
                className={`${ isChatOpen? "":"hidden"} relative group aspect-square w-28 flex-shrink-0 bg-gray-700 rounded-lg flex flex-col items-center justify-center shadow-md overflow-hidden`}
              >
                {isUserInVC && (
                  <div
                    className={`absolute top-2 right-2 p-1.5 rounded-full ${
                      isBlockedByYou ? "bg-red-500/80" : "bg-green-500/80"
                    }`}
                  >
                    {isBlockedByYou ? (
                      <VolumeOff size={12} />
                    ) : (
                      <Volume2 size={12} />
                    )}
                  </div>
                )}

                <div className="w-16 h-16 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold text-3xl">
                  {user.name?.charAt(0).toUpperCase() || "?"}
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent flex items-center justify-between text-xs opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-300 ease-in-out">
                  <p className="text-white font-medium truncate">{user.name}</p>

                  {isCurrentUser ? (
                    <button
                      onClick={isInVoiceChat ? leaveVoiceChat : joinVoiceChat}
                      className="p-1 rounded-full hover:bg-white/20 transition-colors"
                      title={
                        isInVoiceChat ? "Leave Voice Chat" : "Join Voice Chat"
                      }
                    >
                      {isInVoiceChat ? (
                        <Mic size={16} className="text-green-400" />
                      ) : (
                        <MicOff size={16} className="text-red-400" />
                      )}
                    </button>
                  ) : (
                    isUserInVC && (
                      <div className="flex items-center gap-1">
                        {user.voiceState?.isMuted ? (
                          <MicOff size={16} className="text-gray-400" />
                        ) : (
                          <Mic size={16} className="text-gray-400" />
                        )}
                        <button
                          onClick={() =>
                            isBlockedByYou
                              ? onUnblockUser(user.id)
                              : onBlockUser(user.id)
                          }
                          className="p-1 rounded-full hover:bg-white/20 transition-colors"
                          title={
                            isBlockedByYou ? "Unblock Voice" : "Block Voice"
                          }
                        >
                          {isBlockedByYou ? (
                            <Volume2 size={16} className="text-red-400" />
                          ) : (
                            <VolumeOff size={16} className="text-gray-300" />
                          )}
                        </button>
                      </div>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {canScrollRight && (
          <button
            onClick={() => handleScroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-gray-900/70 hover:bg-gray-900 text-white rounded-full p-2 transition-opacity"
          >
            <ChevronRight size={24} />
          </button>
        )}
      </div>
    </div>
  );
};

export default ParticipantList;
