import { eq, and } from 'drizzle-orm';
import { db } from './db';
import { members } from '@chorechamp/database';

export async function verifyMembership(
  userId: string,
  householdId: string
): Promise<typeof members.$inferSelect | null> {
  const [membership] = await db
    .select()
    .from(members)
    .where(and(
      eq(members.householdId, householdId),
      eq(members.userId, userId)
    ));
  return membership || null;
}

export async function verifyParentMembership(
  userId: string,
  householdId: string
): Promise<boolean> {
  const [membership] = await db
    .select()
    .from(members)
    .where(and(
      eq(members.householdId, householdId),
      eq(members.userId, userId),
      eq(members.role, 'parent')
    ));
  return !!membership;
}
