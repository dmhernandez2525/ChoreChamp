import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export interface PresenceMember {
  id: string;
  name: string;
  avatarUrl?: string;
  idle: boolean;
  idleSince: number | null;
}

interface UsePresenceOptions {
  householdId: string;
  boardId: string;
}

interface UsePresenceReturn {
  onlineMembers: PresenceMember[];
  isConnected: boolean;
}

const IDLE_TIMEOUT_MS = 60_000;
const SOCKET_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

export function usePresence({ householdId, boardId }: UsePresenceOptions): UsePresenceReturn {
  const [onlineMembers, setOnlineMembers] = useState<PresenceMember[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetIdleTimer = useCallback(() => {
    const socket = socketRef.current;
    if (!socket?.connected) return;

    socket.emit('board:active', { householdId, boardId });

    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
    idleTimerRef.current = setTimeout(() => {
      socket.emit('board:idle', { householdId, boardId });
    }, IDLE_TIMEOUT_MS);
  }, [householdId, boardId]);

  useEffect(() => {
    let socket: Socket;

    try {
      socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        autoConnect: true,
      });
    } catch {
      // Socket.io server not available; degrade gracefully
      return;
    }

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('board:join', { householdId, boardId });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('connect_error', () => {
      setIsConnected(false);
    });

    socket.on('board:presence', (members: PresenceMember[]) => {
      setOnlineMembers(members);
    });

    // Track user activity for idle detection
    const activityEvents = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];
    const handleActivity = () => resetIdleTimer();

    for (const event of activityEvents) {
      window.addEventListener(event, handleActivity, { passive: true });
    }

    // Start the idle timer on mount
    resetIdleTimer();

    return () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }

      for (const event of activityEvents) {
        window.removeEventListener(event, handleActivity);
      }

      socket.emit('board:leave', { householdId, boardId });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [householdId, boardId, resetIdleTimer]);

  return { onlineMembers, isConnected };
}
