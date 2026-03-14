import { Server } from 'socket.io';

/**
 * Emits a chore:created event to all clients in the household room.
 */
export function emitChoreCreated(io: Server, householdId: string, data: unknown): void {
  io.to(`household:${householdId}`).emit('chore:created', data);
}

/**
 * Emits a chore:updated event to all clients in the household room.
 */
export function emitChoreUpdated(io: Server, householdId: string, data: unknown): void {
  io.to(`household:${householdId}`).emit('chore:updated', data);
}

/**
 * Emits a chore:deleted event to all clients in the household room.
 */
export function emitChoreDeleted(io: Server, householdId: string, data: unknown): void {
  io.to(`household:${householdId}`).emit('chore:deleted', data);
}

/**
 * Emits a chore:completed event to all clients in the household room.
 */
export function emitChoreCompleted(io: Server, householdId: string, data: unknown): void {
  io.to(`household:${householdId}`).emit('chore:completed', data);
}

/**
 * Emits a chore:reordered event to all clients in the household room.
 */
export function emitChoreReordered(io: Server, householdId: string, data: unknown): void {
  io.to(`household:${householdId}`).emit('chore:reordered', data);
}
