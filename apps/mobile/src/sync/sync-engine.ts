import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import * as schema from '../db/schema';
import { apiClient } from '../lib/api-client';
import { checkNetworkStatus } from '../hooks/use-network-status';
import { storage } from '../lib/storage';

// Sync configuration
const SYNC_CONFIG = {
  maxRetries: 5,
  baseRetryDelay: 1000, // 1 second
  maxRetryDelay: 30000, // 30 seconds
  staleCacheThreshold: 5 * 60 * 1000, // 5 minutes
};

export interface SyncResult {
  success: boolean;
  tablesSync: string[];
  errors: string[];
  offlineQueueProcessed: number;
}

// Generate unique ID for local entities
export function generateLocalId(): string {
  return `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Get current ISO timestamp
export function nowISO(): string {
  return new Date().toISOString();
}

// Convert Date to ISO string or null
function toISOString(date: Date | null | undefined): string | null {
  if (!date) return null;
  return date instanceof Date ? date.toISOString() : date;
}

// Calculate exponential backoff delay
function getRetryDelay(retryCount: number): number {
  const delay = Math.min(
    SYNC_CONFIG.baseRetryDelay * Math.pow(2, retryCount),
    SYNC_CONFIG.maxRetryDelay
  );
  // Add jitter (±10%)
  return delay * (0.9 + Math.random() * 0.2);
}

// ============================================
// Offline Queue Operations
// ============================================

export interface QueuedOperation {
  operationType: 'create' | 'update' | 'delete' | 'complete';
  entityType: 'chore' | 'reward' | 'completion' | 'redemption';
  entityId: string;
  payload: Record<string, unknown>;
}

export async function queueOfflineOperation(operation: QueuedOperation): Promise<void> {
  await db.insert(schema.offlineQueue).values({
    operationType: operation.operationType,
    entityType: operation.entityType,
    entityId: operation.entityId,
    payload: JSON.stringify(operation.payload),
    createdAt: nowISO(),
    status: 'pending',
    retryCount: 0,
  });
}

export async function processOfflineQueue(householdId: string): Promise<number> {
  const { isConnected, isInternetReachable } = await checkNetworkStatus();
  if (!isConnected || isInternetReachable === false) {
    return 0;
  }

  const pendingOps = await db
    .select()
    .from(schema.offlineQueue)
    .where(eq(schema.offlineQueue.status, 'pending'))
    .orderBy(schema.offlineQueue.createdAt);

  let processed = 0;

  for (const op of pendingOps) {
    try {
      // Mark as processing
      await db
        .update(schema.offlineQueue)
        .set({ status: 'processing' })
        .where(eq(schema.offlineQueue.id, op.id));

      const payload = JSON.parse(op.payload);

      // Process based on operation type
      await processOperation(householdId, op, payload);

      // Mark as completed and delete
      await db.delete(schema.offlineQueue).where(eq(schema.offlineQueue.id, op.id));
      processed++;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      const newRetryCount = (op.retryCount ?? 0) + 1;

      if (newRetryCount >= SYNC_CONFIG.maxRetries) {
        // Mark as failed after max retries
        await db
          .update(schema.offlineQueue)
          .set({
            status: 'failed',
            retryCount: newRetryCount,
            lastRetryAt: nowISO(),
            errorMessage: message,
          })
          .where(eq(schema.offlineQueue.id, op.id));
      } else {
        // Reset to pending for retry with backoff
        await db
          .update(schema.offlineQueue)
          .set({
            status: 'pending',
            retryCount: newRetryCount,
            lastRetryAt: nowISO(),
            errorMessage: message,
          })
          .where(eq(schema.offlineQueue.id, op.id));

        // Wait before next operation (exponential backoff)
        await new Promise((resolve) => setTimeout(resolve, getRetryDelay(newRetryCount)));
      }
    }
  }

  return processed;
}

async function processOperation(
  householdId: string,
  op: typeof schema.offlineQueue.$inferSelect,
  payload: Record<string, unknown>
): Promise<void> {
  switch (op.entityType) {
    case 'completion':
      if (op.operationType === 'complete') {
        // Complete chore via API
        const choreId = payload.choreId as string;
        const scheduledDate = payload.scheduledDate as string | undefined;
        const durationSeconds = payload.durationSeconds as number | undefined;

        const result = await apiClient.completeChore(householdId, choreId, {
          scheduledDate,
          durationSeconds,
        });

        // Update local completion with server response
        if (op.entityId.startsWith('local_')) {
          // Replace local entity with server entity
          await db.delete(schema.cachedCompletions).where(eq(schema.cachedCompletions.id, op.entityId));
          await db.insert(schema.cachedCompletions).values({
            id: result.id,
            choreId: result.choreId,
            householdId,
            memberId: result.memberId,
            scheduledDate: result.scheduledDate,
            completedAt: toISOString(result.completedAt),
            status: result.status,
            pointsAwarded: result.pointsAwarded,
            durationSeconds: result.durationSeconds,
            cachedAt: nowISO(),
            isLocal: false,
            syncVersion: 1,
          });
        }
      }
      break;

    case 'redemption':
      if (op.operationType === 'create') {
        const rewardId = payload.rewardId as string;
        const memberId = payload.memberId as string;
        const notes = payload.notes as string | undefined;
        const result = await apiClient.redeemReward(householdId, rewardId, memberId, notes);

        // Update local redemption with server response
        if (op.entityId.startsWith('local_')) {
          await db.delete(schema.cachedRedemptions).where(eq(schema.cachedRedemptions.id, op.entityId));
          await db.insert(schema.cachedRedemptions).values({
            id: result.id,
            rewardId: result.rewardId,
            householdId,
            memberId: result.memberId,
            pointsSpent: result.pointsSpent,
            status: result.status,
            requestedAt: toISOString(result.requestedAt) || nowISO(),
            cachedAt: nowISO(),
            isLocal: false,
            syncVersion: 1,
          });
        }
      }
      break;

    default:
      console.warn(`Unhandled operation type: ${op.entityType}/${op.operationType}`);
  }
}

// ============================================
// Data Sync Operations
// ============================================

export async function syncHouseholds(): Promise<void> {
  const households = await apiClient.getHouseholds();
  const now = nowISO();

  for (const household of households) {
    await db
      .insert(schema.cachedHouseholds)
      .values({
        id: household.id,
        name: household.name,
        timezone: household.timezone,
        weekStartsOn: household.weekStartsOn,
        pointsName: household.pointsName,
        currency: household.currency,
        totalChoresCompleted: household.totalChoresCompleted,
        currentFamilyStreak: household.currentFamilyStreak,
        longestFamilyStreak: household.longestFamilyStreak,
        cachedAt: now,
        syncVersion: 1,
      })
      .onConflictDoUpdate({
        target: schema.cachedHouseholds.id,
        set: {
          name: household.name,
          timezone: household.timezone,
          weekStartsOn: household.weekStartsOn,
          pointsName: household.pointsName,
          currency: household.currency,
          totalChoresCompleted: household.totalChoresCompleted,
          currentFamilyStreak: household.currentFamilyStreak,
          longestFamilyStreak: household.longestFamilyStreak,
          cachedAt: now,
          syncVersion: 1,
        },
      });
  }

  await updateSyncMetadata('cached_households');
}

export async function syncMembers(householdId: string): Promise<void> {
  const members = await apiClient.getMembers(householdId);
  const now = nowISO();

  for (const member of members) {
    // Conflict resolution for points: merge by taking higher value (additive)
    const existing = await db
      .select()
      .from(schema.cachedMembers)
      .where(eq(schema.cachedMembers.id, member.id))
      .limit(1);

    let pointsCurrent = member.pointsCurrent;
    const pointsLifetime = member.pointsLifetime;

    if (existing.length > 0 && existing[0].syncVersion) {
      // If local points are higher, we may have offline earnings
      // Take the higher value to preserve offline point additions
      const localPoints = existing[0].pointsCurrent ?? 0;
      if (localPoints > member.pointsCurrent) {
        pointsCurrent = localPoints;
      }
    }

    await db
      .insert(schema.cachedMembers)
      .values({
        id: member.id,
        householdId,
        userId: member.userId || null,
        name: member.name,
        role: member.role as 'parent' | 'child' | 'teen' | 'viewer' | 'caregiver',
        color: member.color || null,
        avatarUrl: member.avatarUrl || null,
        pointsCurrent,
        pointsLifetime,
        streakCurrent: member.streakCurrent,
        streakLongest: member.streakLongest,
        streakLastCompletedDate: member.streakLastCompletedDate || null,
        streakFreezesAvailable: member.streakFreezesAvailable,
        badges: member.badges ? JSON.stringify(member.badges) : null,
        caregiverPermissions: member.caregiverPermissions ? JSON.stringify(member.caregiverPermissions) : null,
        linkedMemberId: member.linkedMemberId || null,
        crossHouseholdSettings: member.crossHouseholdSettings ? JSON.stringify(member.crossHouseholdSettings) : null,
        isActive: member.isActive,
        cachedAt: now,
        syncVersion: 1,
      })
      .onConflictDoUpdate({
        target: schema.cachedMembers.id,
        set: {
          name: member.name,
          role: member.role as 'parent' | 'child' | 'teen' | 'viewer' | 'caregiver',
          color: member.color || null,
          avatarUrl: member.avatarUrl || null,
          pointsCurrent,
          pointsLifetime,
          streakCurrent: member.streakCurrent,
          streakLongest: member.streakLongest,
          streakLastCompletedDate: member.streakLastCompletedDate || null,
          streakFreezesAvailable: member.streakFreezesAvailable,
          badges: member.badges ? JSON.stringify(member.badges) : null,
          caregiverPermissions: member.caregiverPermissions ? JSON.stringify(member.caregiverPermissions) : null,
          linkedMemberId: member.linkedMemberId || null,
          crossHouseholdSettings: member.crossHouseholdSettings ? JSON.stringify(member.crossHouseholdSettings) : null,
          isActive: member.isActive,
          cachedAt: now,
          syncVersion: 1,
        },
      });
  }

  await updateSyncMetadata('cached_members');
}

export async function syncChores(householdId: string): Promise<void> {
  const chores = await apiClient.getChores(householdId);
  const now = nowISO();

  for (const chore of chores) {
    await db
      .insert(schema.cachedChores)
      .values({
        id: chore.id,
        householdId,
        title: chore.title,
        description: chore.description || null,
        icon: chore.icon || null,
        category: chore.category || null,
        pointValue: chore.pointValue,
        difficulty: chore.difficulty,
        assignedTo: chore.assignedTo ? JSON.stringify(chore.assignedTo) : null,
        assignmentType: chore.assignmentType,
        recurrenceType: chore.recurrenceType,
        recurrenceDays: chore.recurrenceDays ? JSON.stringify(chore.recurrenceDays) : null,
        dueTime: chore.dueTime || null,
        requiresApproval: chore.requiresApproval,
        requiresPhoto: chore.requiresPhoto,
        estimatedMinutes: chore.estimatedMinutes || null,
        showTimer: chore.showTimer,
        steps: chore.steps ? JSON.stringify(chore.steps) : null,
        isActive: chore.isActive,
        cachedAt: now,
        syncVersion: 1,
      })
      .onConflictDoUpdate({
        target: schema.cachedChores.id,
        set: {
          title: chore.title,
          description: chore.description || null,
          icon: chore.icon || null,
          category: chore.category || null,
          pointValue: chore.pointValue,
          difficulty: chore.difficulty,
          assignedTo: chore.assignedTo ? JSON.stringify(chore.assignedTo) : null,
          assignmentType: chore.assignmentType,
          recurrenceType: chore.recurrenceType,
          recurrenceDays: chore.recurrenceDays ? JSON.stringify(chore.recurrenceDays) : null,
          dueTime: chore.dueTime || null,
          requiresApproval: chore.requiresApproval,
          requiresPhoto: chore.requiresPhoto,
          estimatedMinutes: chore.estimatedMinutes || null,
          showTimer: chore.showTimer,
          steps: chore.steps ? JSON.stringify(chore.steps) : null,
          isActive: chore.isActive,
          cachedAt: now,
          syncVersion: 1,
        },
      });
  }

  await updateSyncMetadata('cached_chores');
}

export async function syncTodaysSchedule(householdId: string, memberId?: string): Promise<void> {
  const todayChores = await apiClient.getTodaysChores(householdId, memberId);
  const now = nowISO();

  for (const item of todayChores) {
    // TodayChore extends ChoreSchedule, so item itself has schedule properties
    await db
      .insert(schema.cachedSchedules)
      .values({
        id: item.id,
        choreId: item.choreId,
        householdId,
        scheduledDate: item.scheduledDate,
        assignedTo: item.assignedTo || null,
        isCompleted: item.isCompleted,
        completionId: item.completionId || null,
        cachedAt: now,
      })
      .onConflictDoUpdate({
        target: schema.cachedSchedules.id,
        set: {
          isCompleted: item.isCompleted,
          completionId: item.completionId || null,
          cachedAt: now,
        },
      });

    // Sync completion if exists
    if (item.completion) {
      // Don't overwrite local completions that haven't synced yet
      const existing = await db
        .select()
        .from(schema.cachedCompletions)
        .where(eq(schema.cachedCompletions.id, item.completion.id))
        .limit(1);

      if (existing.length === 0 || !existing[0].isLocal) {
        await db
          .insert(schema.cachedCompletions)
          .values({
            id: item.completion.id,
            choreId: item.completion.choreId,
            householdId,
            memberId: item.completion.memberId,
            scheduledDate: item.completion.scheduledDate,
            completedAt: toISOString(item.completion.completedAt),
            status: item.completion.status,
            approvedBy: item.completion.approvedBy || null,
            approvedAt: toISOString(item.completion.approvedAt),
            rejectionReason: item.completion.rejectionReason || null,
            photoUrl: item.completion.photoUrl || null,
            pointsAwarded: item.completion.pointsAwarded,
            durationSeconds: item.completion.durationSeconds || null,
            cachedAt: now,
            isLocal: false,
            syncVersion: 1,
          })
          .onConflictDoUpdate({
            target: schema.cachedCompletions.id,
            set: {
              status: item.completion.status,
              approvedBy: item.completion.approvedBy || null,
              approvedAt: toISOString(item.completion.approvedAt),
              rejectionReason: item.completion.rejectionReason || null,
              pointsAwarded: item.completion.pointsAwarded,
              cachedAt: now,
              syncVersion: 1,
            },
          });
      }
    }
  }

  await updateSyncMetadata('cached_schedules');
}

export async function syncRewards(householdId: string): Promise<void> {
  const rewards = await apiClient.getRewards(householdId);
  const now = nowISO();

  for (const reward of rewards) {
    await db
      .insert(schema.cachedRewards)
      .values({
        id: reward.id,
        householdId,
        title: reward.title,
        description: reward.description || null,
        icon: reward.icon || null,
        type: reward.type,
        pointCost: reward.pointCost,
        quantity: reward.quantity || null,
        quantityRemaining: reward.quantityRemaining || null,
        isActive: reward.isActive,
        cachedAt: now,
        syncVersion: 1,
      })
      .onConflictDoUpdate({
        target: schema.cachedRewards.id,
        set: {
          title: reward.title,
          description: reward.description || null,
          icon: reward.icon || null,
          type: reward.type,
          pointCost: reward.pointCost,
          quantity: reward.quantity || null,
          quantityRemaining: reward.quantityRemaining || null,
          isActive: reward.isActive,
          cachedAt: now,
          syncVersion: 1,
        },
      });
  }

  await updateSyncMetadata('cached_rewards');
}

// ============================================
// Sync Metadata Operations
// ============================================

async function updateSyncMetadata(tableName: string): Promise<void> {
  await db
    .insert(schema.syncMetadata)
    .values({
      tableName,
      lastSyncAt: nowISO(),
      syncStatus: 'idle',
      errorMessage: null,
    })
    .onConflictDoUpdate({
      target: schema.syncMetadata.tableName,
      set: {
        lastSyncAt: nowISO(),
        syncStatus: 'idle',
        errorMessage: null,
      },
    });
}

export async function getLastSyncTime(tableName: string): Promise<string | null> {
  const result = await db
    .select()
    .from(schema.syncMetadata)
    .where(eq(schema.syncMetadata.tableName, tableName))
    .limit(1);

  return result.length > 0 ? result[0].lastSyncAt : null;
}

export async function isCacheStale(tableName: string): Promise<boolean> {
  const lastSync = await getLastSyncTime(tableName);
  if (!lastSync) return true;

  const lastSyncTime = new Date(lastSync).getTime();
  const now = Date.now();
  return now - lastSyncTime > SYNC_CONFIG.staleCacheThreshold;
}

// ============================================
// Full Sync Operation
// ============================================

export async function performFullSync(): Promise<SyncResult> {
  const result: SyncResult = {
    success: true,
    tablesSync: [],
    errors: [],
    offlineQueueProcessed: 0,
  };

  const { isConnected, isInternetReachable } = await checkNetworkStatus();
  if (!isConnected || isInternetReachable === false) {
    result.success = false;
    result.errors.push('No network connection');
    return result;
  }

  const activeHouseholdId = await storage.getActiveHousehold();
  const activeMemberId = await storage.getActiveMember();

  try {
    // 1. Process offline queue first (send local changes to server)
    if (activeHouseholdId) {
      result.offlineQueueProcessed = await processOfflineQueue(activeHouseholdId);
    }

    // 2. Sync households
    try {
      await syncHouseholds();
      result.tablesSync.push('households');
    } catch (error) {
      result.errors.push(`households: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // 3. Sync household-specific data
    if (activeHouseholdId) {
      // Sync members
      try {
        await syncMembers(activeHouseholdId);
        result.tablesSync.push('members');
      } catch (error) {
        result.errors.push(`members: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Sync chores
      try {
        await syncChores(activeHouseholdId);
        result.tablesSync.push('chores');
      } catch (error) {
        result.errors.push(`chores: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Sync today's schedule
      try {
        await syncTodaysSchedule(activeHouseholdId, activeMemberId ?? undefined);
        result.tablesSync.push('schedules');
      } catch (error) {
        result.errors.push(`schedules: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Sync rewards
      try {
        await syncRewards(activeHouseholdId);
        result.tablesSync.push('rewards');
      } catch (error) {
        result.errors.push(`rewards: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    result.success = result.errors.length === 0;
  } catch (error) {
    result.success = false;
    result.errors.push(`Full sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}
