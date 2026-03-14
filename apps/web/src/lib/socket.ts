import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

let socketInstance: Socket | null = null;

/**
 * Returns a singleton socket.io client instance.
 * Reuses the same connection across all hooks and components.
 */
export function getSocket(): Socket {
  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000,
      reconnectionAttempts: Infinity,
    });
  }

  return socketInstance;
}

/**
 * Disconnects and destroys the singleton socket instance.
 * Useful for cleanup on logout or app teardown.
 */
export function destroySocket(): void {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}
