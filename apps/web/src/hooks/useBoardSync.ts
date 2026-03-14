import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket } from '../lib/socket';

interface UseBoardSyncOptions {
  householdId: string;
}

interface UseBoardSyncReturn {
  isConnected: boolean;
  lastSyncAt: Date | null;
}

/**
 * Hook that listens for real-time chore board updates via socket.io.
 * Invalidates relevant TanStack Query cache keys when chore events arrive.
 */
export function useBoardSync({ householdId }: UseBoardSyncOptions): UseBoardSyncReturn {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);

  const invalidateChores = useCallback(() => {
    setLastSyncAt(new Date());
    queryClient.invalidateQueries({ queryKey: ['chores', householdId] });
    queryClient.invalidateQueries({ queryKey: ['board', householdId] });
  }, [queryClient, householdId]);

  useEffect(() => {
    const socket = getSocket();

    const onConnect = () => {
      setIsConnected(true);
      socket.emit('join:household', householdId);
    };

    const onDisconnect = () => {
      setIsConnected(false);
    };

    const onConnectError = () => {
      setIsConnected(false);
    };

    const onChoreCreated = () => invalidateChores();
    const onChoreUpdated = () => invalidateChores();
    const onChoreDeleted = () => invalidateChores();
    const onChoreCompleted = () => invalidateChores();
    const onChoreReordered = () => invalidateChores();

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on('chore:created', onChoreCreated);
    socket.on('chore:updated', onChoreUpdated);
    socket.on('chore:deleted', onChoreDeleted);
    socket.on('chore:completed', onChoreCompleted);
    socket.on('chore:reordered', onChoreReordered);

    // If already connected, join the room immediately
    if (socket.connected) {
      setIsConnected(true);
      socket.emit('join:household', householdId);
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.off('chore:created', onChoreCreated);
      socket.off('chore:updated', onChoreUpdated);
      socket.off('chore:deleted', onChoreDeleted);
      socket.off('chore:completed', onChoreCompleted);
      socket.off('chore:reordered', onChoreReordered);

      socket.emit('leave:household', householdId);
    };
  }, [householdId, invalidateChores]);

  return { isConnected, lastSyncAt };
}
