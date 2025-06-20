import { useState, useEffect, useRef, useCallback } from 'react';
import Peer from 'simple-peer';
import { socket } from '../api/socket';
import type { User } from '../types';

interface UseVoiceChatProps {
  roomId: string | undefined;
  currentUser: User | null;
}

export const useVoiceChat = ({ roomId, currentUser }: UseVoiceChatProps) => {
  const [isInVoiceChat, setIsInVoiceChat] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  // State to track locally blocked user IDs
  const [blockedUserIds, setBlockedUserIds] = useState<string[]>([]);

  const localStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<{ [socketId: string]: Peer.Instance }>({});
  const audioElementsRef = useRef<{ [socketId:string]: HTMLAudioElement }>({});

  const cleanupVoiceConnections = useCallback(() => {
    localStreamRef.current?.getTracks().forEach(track => track.stop());
    localStreamRef.current = null;
    Object.values(peersRef.current).forEach(peer => peer.destroy());
    peersRef.current = {};
    Object.values(audioElementsRef.current).forEach(audio => audio.remove());
    audioElementsRef.current = {};
  }, []);

  useEffect(() => {
    // --- Signaling Listeners ---
    const handleUserJoinedVoice = (payload: { signal: Peer.SignalData; callerID: string; }) => {
      if (!localStreamRef.current) return; // Don't create a peer if we don't have a stream
      
      const peer = new Peer({ initiator: false, trickle: false, stream: localStreamRef.current });
      
      peer.on('signal', signal => socket.emit('returning-signal', { signal, callerID: payload.callerID }));
      
      peer.on('stream', stream => {
        const audio = document.createElement('audio');
        audio.srcObject = stream;
        
        // Mute the audio element if the user is in our blocked list
        if (blockedUserIds.includes(payload.callerID)) {
            audio.muted = true;
        }

        audio.play().catch(e => console.error("Audio play failed", e));
        audioElementsRef.current[payload.callerID] = audio;
      });

      peer.signal(payload.signal);
      peersRef.current[payload.callerID] = peer;
    };

    const handleReceivingReturnedSignal = (payload: { signal: Peer.SignalData; id: string; }) => {
      peersRef.current[payload.id]?.signal(payload.signal);
    };

    const handleUserLeftVoice = (payload: { userId: string }) => {
      peersRef.current[payload.userId]?.destroy();
      delete peersRef.current[payload.userId];
      audioElementsRef.current[payload.userId]?.remove();
      delete audioElementsRef.current[payload.userId];
    };

    socket.on('user-joined-voice', handleUserJoinedVoice);
    socket.on('receiving-returned-signal', handleReceivingReturnedSignal);
    socket.on('user-left-voice', handleUserLeftVoice);

    return () => {
      socket.off('user-joined-voice', handleUserJoinedVoice);
      socket.off('receiving-returned-signal', handleReceivingReturnedSignal);
      socket.off('user-left-voice', handleUserLeftVoice);
      if (isInVoiceChat) {
        cleanupVoiceConnections();
      }
    };
    // Re-run this effect if the blocked user list changes. This ensures that
    // the 'handleUserJoinedVoice' function closes over the latest list.
  }, [isInVoiceChat, cleanupVoiceConnections, blockedUserIds]);

  const createPeer = useCallback((userToSignal: string, stream: MediaStream) => {
    if (!currentUser) return null;
    const peer = new Peer({ initiator: true, trickle: false, stream });
    peer.on('signal', signal => socket.emit('sending-signal', { userToSignal, callerID: currentUser.id, signal }));
    return peer;
  }, [currentUser]);

  const joinVoiceChat = useCallback(async () => {
    if (!roomId) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
      localStreamRef.current = stream;
      setIsInVoiceChat(true);

      socket.emit('join-voice-chat', { roomId });
      socket.once('all-voice-users', (data: { users: { id: string }[] }) => {
        data.users.forEach(user => {
          if (user.id !== currentUser?.id) {
            const peer = createPeer(user.id, stream);
            if (peer) peersRef.current[user.id] = peer;
          }
        });
      });
    } catch (err) {
      console.error("Mic access error:", err);
      alert("Could not access microphone.");
    }
  }, [roomId, currentUser, createPeer]);

  const leaveVoiceChat = useCallback(() => {
    if (!roomId) return;
    socket.emit('leave-voice-chat', { roomId });
    setIsInVoiceChat(false);
    setIsMuted(false);
    cleanupVoiceConnections();
  }, [roomId, cleanupVoiceConnections]);

  const toggleMute = useCallback(() => {
    if (!isInVoiceChat || !localStreamRef.current) return;
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      const newMutedState = !audioTrack.enabled;
      audioTrack.enabled = !newMutedState; // This mutes the track for others
      setIsMuted(newMutedState);
      // Corrected event name to match backend
      socket.emit('voice-state-change', { roomId, isMuted: newMutedState });
    }
  }, [isInVoiceChat, roomId]);

  /**
   * Mutes a specific user's audio on the client-side only.
   * @param userId The socket ID of the user to block.
   */
  const blockUserAudio = useCallback((userId: string) => {
    if (blockedUserIds.includes(userId)) return;

    const audioEl = audioElementsRef.current[userId];
    if (audioEl) {
      audioEl.muted = true;
    }
    setBlockedUserIds(prev => [...prev, userId]);
  }, [blockedUserIds]);

  /**
   * Unmutes a specific user's audio on the client-side only.
   * @param userId The socket ID of the user to unblock.
   */
  const unblockUserAudio = useCallback((userId: string) => {
    const audioEl = audioElementsRef.current[userId];
    if (audioEl) {
      audioEl.muted = false;
    }
    setBlockedUserIds(prev => prev.filter(id => id !== userId));
  }, []);

  return { 
    isInVoiceChat, 
    isMuted, 
    joinVoiceChat, 
    leaveVoiceChat, 
    toggleMute,
    // Expose the new state and functions
    blockedUserIds,
    blockUserAudio,
    unblockUserAudio,
  };
};