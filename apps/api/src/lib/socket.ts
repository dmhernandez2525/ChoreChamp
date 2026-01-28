import { Server, Socket } from 'socket.io';
import { createLogger } from './logger';

const logger = createLogger('socket');

export function initializeSocket(io: Server) {
  io.on('connection', (socket: Socket) => {
    logger.info({ socketId: socket.id }, 'Client connected');

    // Join household room
    socket.on('join:household', (householdId: string) => {
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
