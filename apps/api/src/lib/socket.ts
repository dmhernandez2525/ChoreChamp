import { Server, Socket } from 'socket.io';
import { createLogger } from './logger';
import { verifyMembership } from './membership';

const logger = createLogger('socket');

export function initializeSocket(io: Server) {
  io.on('connection', (socket: Socket) => {
    const userId = socket.handshake.auth?.userId as string | undefined;
    logger.info({ socketId: socket.id, userId }, 'Client connected');

    if (!userId) {
      logger.warn({ socketId: socket.id }, 'Socket connected without userId, disconnecting');
      socket.disconnect(true);
      return;
    }

    socket.data.userId = userId;
    socket.join(`user:${userId}`);

    // Join household room (with membership verification)
    socket.on('join:household', async (householdId: string) => {
      const membership = await verifyMembership(userId, householdId);
      if (!membership) {
        socket.emit('error', { message: 'Not a member of this household' });
        return;
      }
      socket.join(`household:${householdId}`);
      logger.info({ socketId: socket.id, householdId }, 'Joined household room');
    });

    // Leave household room
    socket.on('leave:household', (householdId: string) => {
      socket.leave(`household:${householdId}`);
      logger.info({ socketId: socket.id, householdId }, 'Left household room');
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      logger.info({ socketId: socket.id }, 'Client disconnected');
    });
  });

  return io;
}

// Helper to emit events to a household
export function emitToHousehold(io: Server, householdId: string, event: string, data: unknown) {
  io.to(`household:${householdId}`).emit(event, data);
}

// Helper to emit to a specific user (all their connections)
export function emitToUser(io: Server, userId: string, event: string, data: unknown) {
  io.to(`user:${userId}`).emit(event, data);
}
