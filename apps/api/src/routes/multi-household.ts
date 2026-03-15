import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { eq, and, or } from 'drizzle-orm';
import { db } from '../lib/db';
import {
  households,
  members,
  userHouseholds,
  memberLinks,
} from '@chorechamp/database';
import { userPreferences } from '@chorechamp/database';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import type { CaregiverPermissions } from '@chorechamp/types';

// Validation schemas
const switchHouseholdSchema = z.object({
  householdId: z.string().uuid(),
  setAsDefault: z.boolean().optional(),
});

const updateCaregiverPermissionsSchema = z.object({
  memberId: z.string().uuid(),
  permissions: z.object({
    canViewChores: z.boolean().optional(),
    canCompleteChores: z.boolean().optional(),
    canApproveChores: z.boolean().optional(),
    canCreateChores: z.boolean().optional(),
    canEditChores: z.boolean().optional(),
    canViewPoints: z.boolean().optional(),
    canViewRewards: z.boolean().optional(),
    canRedeemRewards: z.boolean().optional(),
    canViewActivity: z.boolean().optional(),
  }),
});

const createMemberLinkSchema = z.object({
  sourceMemberId: z.string().uuid(),
  targetHouseholdId: z.string().uuid(),
  targetMemberName: z.string().min(1).max(100),
  shareSettings: z
    .object({
      sharePoints: z.boolean().optional(),
      shareStreaks: z.boolean().optional(),
      shareBadges: z.boolean().optional(),
      shareChoreView: z.boolean().optional(),
    })
    .optional(),
});

const updateMemberLinkSchema = z.object({
  linkId: z.string().uuid(),
  shareSettings: z.object({
    sharePoints: z.boolean().optional(),
    shareStreaks: z.boolean().optional(),
    shareBadges: z.boolean().optional(),
    shareChoreView: z.boolean().optional(),
  }),
});

const approveMemberLinkSchema = z.object({
  linkId: z.string().uuid(),
});

export async function multiHouseholdRoutes(fastify: FastifyInstance) {
  // Get user's households with active/default info
  fastify.get('/households/context', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;

    // Get user preferences
    const [prefs] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, user.id));

    // Get all households for user
    const userHouseholdsData = await db
      .select({
        household: households,
        member: members,
      })
      .from(userHouseholds)
      .innerJoin(households, eq(userHouseholds.householdId, households.id))
      .innerJoin(
        members,
        and(
          eq(members.householdId, households.id),
          eq(members.userId, user.id),
          eq(members.isActive, true)
        )
      )
      .where(eq(userHouseholds.userId, user.id));

    // Get linked members for each household member
    const householdContexts = await Promise.all(
      userHouseholdsData.map(async ({ household, member }) => {
        // Get links where this member is the primary or linked member
        const links = await db
          .select({
            link: memberLinks,
            linkedMember: members,
            linkedHousehold: households,
          })
          .from(memberLinks)
          .innerJoin(
            members,
            or(
              eq(memberLinks.linkedMemberId, members.id),
              eq(memberLinks.primaryMemberId, members.id)
            )
          )
          .innerJoin(households, eq(members.householdId, households.id))
          .where(
            and(
              or(
                eq(memberLinks.primaryMemberId, member.id),
                eq(memberLinks.linkedMemberId, member.id)
              ),
              eq(memberLinks.isActive, true)
            )
          );

        const linkedMembers = links
          .filter((l) => l.link.primaryMemberId === member.id || l.link.linkedMemberId === member.id)
          .map((l) => ({
            householdId: l.linkedHousehold.id,
            householdName: l.linkedHousehold.name,
            memberId: l.linkedMember.id,
            memberRole: l.linkedMember.role as string,
            pointsCurrent: l.linkedMember.pointsCurrent || 0,
            streakCurrent: l.linkedMember.streakCurrent || 0,
          }));

        return {
          household,
          member,
          role: member.role,
          isDefault: prefs?.defaultHouseholdId === household.id,
          linkedMembers,
        };
      })
    );

    return reply.send({
      households: householdContexts,
      activeHouseholdId: prefs?.activeHouseholdId || householdContexts[0]?.household.id || null,
    });
  });

  // Switch active household
  fastify.post('/households/switch', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const body = switchHouseholdSchema.parse(request.body);

    // Verify user is a member of the household
    const [membership] = await db
      .select()
      .from(members)
      .where(
        and(eq(members.householdId, body.householdId), eq(members.userId, user.id), eq(members.isActive, true))
      );

    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You are not a member of this household',
      });
    }

    // Upsert user preferences
    const existingPrefs = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, user.id));

    if (existingPrefs.length === 0) {
      await db.insert(userPreferences).values({
        userId: user.id,
        activeHouseholdId: body.householdId,
        defaultHouseholdId: body.setAsDefault ? body.householdId : null,
      });
    } else {
      await db
        .update(userPreferences)
        .set({
          activeHouseholdId: body.householdId,
          defaultHouseholdId: body.setAsDefault
            ? body.householdId
            : existingPrefs[0].defaultHouseholdId,
          updatedAt: new Date(),
        })
        .where(eq(userPreferences.userId, user.id));
    }

    return reply.send({
      activeHouseholdId: body.householdId,
      isDefault: body.setAsDefault || false,
    });
  });

  // Update caregiver permissions
  fastify.patch('/:householdId/members/:memberId/caregiver-permissions', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, memberId } = request.params as {
      householdId: string;
      memberId: string;
    };
    const body = updateCaregiverPermissionsSchema.parse(request.body);

    // Verify user is a parent in this household
    const [parentMembership] = await db
      .select()
      .from(members)
      .where(
        and(
          eq(members.householdId, householdId),
          eq(members.userId, user.id),
          eq(members.role, 'parent'),
          eq(members.isActive, true)
        )
      );

    if (!parentMembership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Only parents can update caregiver permissions',
      });
    }

    // Get the caregiver member
    const [caregiverMember] = await db
      .select()
      .from(members)
      .where(
        and(
          eq(members.id, memberId),
          eq(members.householdId, householdId),
          eq(members.role, 'caregiver')
        )
      );

    if (!caregiverMember) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'Caregiver member not found',
      });
    }

    // Merge with existing permissions
    const currentPermissions = (caregiverMember.caregiverPermissions as CaregiverPermissions) || {
      canViewChores: true,
      canCompleteChores: true,
      canApproveChores: false,
      canCreateChores: false,
      canEditChores: false,
      canViewPoints: true,
      canViewRewards: false,
      canRedeemRewards: false,
      canViewActivity: true,
    };

    const updatedPermissions = {
      ...currentPermissions,
      ...body.permissions,
    };

    const [updated] = await db
      .update(members)
      .set({
        caregiverPermissions: updatedPermissions,
        updatedAt: new Date(),
      })
      .where(eq(members.id, memberId))
      .returning();

    return reply.send(updated);
  });

  // Create cross-household member link request
  fastify.post('/:householdId/member-links', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const body = createMemberLinkSchema.parse(request.body);

    // Verify user is a parent in the source household
    const [parentMembership] = await db
      .select()
      .from(members)
      .where(
        and(
          eq(members.householdId, householdId),
          eq(members.userId, user.id),
          eq(members.role, 'parent'),
          eq(members.isActive, true)
        )
      );

    if (!parentMembership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Only parents can create member links',
      });
    }

    // Verify source member exists in the household
    const [sourceMember] = await db
      .select()
      .from(members)
      .where(
        and(
          eq(members.id, body.sourceMemberId),
          eq(members.householdId, householdId)
        )
      );

    if (!sourceMember) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'Source member not found in household',
      });
    }

    // Verify target household exists and user has access
    const [targetHousehold] = await db
      .select()
      .from(households)
      .where(eq(households.id, body.targetHouseholdId));

    if (!targetHousehold) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'Target household not found',
      });
    }

    // Check if user is also a parent in target household
    const [targetParentMembership] = await db
      .select()
      .from(members)
      .where(
        and(
          eq(members.householdId, body.targetHouseholdId),
          eq(members.userId, user.id),
          eq(members.role, 'parent'),
          eq(members.isActive, true)
        )
      );

    // Create a corresponding member in target household
    const colors = ['#EF4444', '#F59E0B', '#10B981', '#8B5CF6', '#EC4899', '#06B6D4'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    // Create member and link atomically
    const { targetMember, link } = await db.transaction(async (tx) => {
      const [targetMember] = await tx
        .insert(members)
        .values({
          householdId: body.targetHouseholdId,
          userId: sourceMember.userId,
          name: body.targetMemberName || sourceMember.name,
          role: sourceMember.role,
          color: randomColor,
          avatarUrl: sourceMember.avatarUrl,
          birthYear: sourceMember.birthYear,
          requiresApproval: sourceMember.requiresApproval,
        })
        .returning();

      const [link] = await tx
        .insert(memberLinks)
        .values({
          primaryMemberId: body.sourceMemberId,
          primaryHouseholdId: householdId,
          linkedMemberId: targetMember.id,
          linkedHouseholdId: body.targetHouseholdId,
          sharePoints: body.shareSettings?.sharePoints ?? false,
          shareStreaks: body.shareSettings?.shareStreaks ?? false,
          shareBadges: body.shareSettings?.shareBadges ?? false,
          shareChoreView: body.shareSettings?.shareChoreView ?? false,
          approvedByPrimaryHousehold: true,
          approvedByLinkedHousehold: !!targetParentMembership,
          isActive: !!targetParentMembership,
        })
        .returning();

      return { targetMember, link };
    });

    return reply.status(201).send({
      link,
      targetMember,
      requiresApproval: !targetParentMembership,
    });
  });

  // Approve a member link request (from target household)
  fastify.post('/:householdId/member-links/approve', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const body = approveMemberLinkSchema.parse(request.body);

    // Verify user is a parent in this household
    const [parentMembership] = await db
      .select()
      .from(members)
      .where(
        and(
          eq(members.householdId, householdId),
          eq(members.userId, user.id),
          eq(members.role, 'parent'),
          eq(members.isActive, true)
        )
      );

    if (!parentMembership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Only parents can approve member links',
      });
    }

    // Get the link and verify it's for this household
    const [link] = await db
      .select()
      .from(memberLinks)
      .where(
        and(
          eq(memberLinks.id, body.linkId),
          eq(memberLinks.linkedHouseholdId, householdId)
        )
      );

    if (!link) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'Member link not found',
      });
    }

    // Update the link
    const [updated] = await db
      .update(memberLinks)
      .set({
        approvedByLinkedHousehold: true,
        isActive: link.approvedByPrimaryHousehold, // Active if both approved
        updatedAt: new Date(),
      })
      .where(eq(memberLinks.id, body.linkId))
      .returning();

    return reply.send(updated);
  });

  // Get pending member link requests for household
  fastify.get('/:householdId/member-links/pending', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };

    // Verify user is a parent in this household
    const [parentMembership] = await db
      .select()
      .from(members)
      .where(
        and(
          eq(members.householdId, householdId),
          eq(members.userId, user.id),
          eq(members.role, 'parent'),
          eq(members.isActive, true)
        )
      );

    if (!parentMembership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Only parents can view member link requests',
      });
    }

    // Get pending links for this household
    const pendingLinks = await db
      .select({
        link: memberLinks,
        primaryMember: members,
        primaryHousehold: households,
      })
      .from(memberLinks)
      .innerJoin(members, eq(memberLinks.primaryMemberId, members.id))
      .innerJoin(households, eq(memberLinks.primaryHouseholdId, households.id))
      .where(
        and(
          eq(memberLinks.linkedHouseholdId, householdId),
          eq(memberLinks.approvedByLinkedHousehold, false)
        )
      );

    return reply.send(pendingLinks);
  });

  // Update member link settings
  fastify.patch('/:householdId/member-links/:linkId', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, linkId } = request.params as {
      householdId: string;
      linkId: string;
    };
    const body = updateMemberLinkSchema.parse(request.body);

    // Verify user is a parent in this household
    const [parentMembership] = await db
      .select()
      .from(members)
      .where(
        and(
          eq(members.householdId, householdId),
          eq(members.userId, user.id),
          eq(members.role, 'parent'),
          eq(members.isActive, true)
        )
      );

    if (!parentMembership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Only parents can update member links',
      });
    }

    // Get the link and verify it's associated with this household
    const [link] = await db
      .select()
      .from(memberLinks)
      .where(
        and(
          eq(memberLinks.id, linkId),
          or(
            eq(memberLinks.primaryHouseholdId, householdId),
            eq(memberLinks.linkedHouseholdId, householdId)
          )
        )
      );

    if (!link) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'Member link not found',
      });
    }

    // Update the link settings
    const [updated] = await db
      .update(memberLinks)
      .set({
        ...body.shareSettings,
        updatedAt: new Date(),
      })
      .where(eq(memberLinks.id, linkId))
      .returning();

    return reply.send(updated);
  });

  // Delete/deactivate member link
  fastify.delete('/:householdId/member-links/:linkId', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, linkId } = request.params as {
      householdId: string;
      linkId: string;
    };

    // Verify user is a parent in this household
    const [parentMembership] = await db
      .select()
      .from(members)
      .where(
        and(
          eq(members.householdId, householdId),
          eq(members.userId, user.id),
          eq(members.role, 'parent'),
          eq(members.isActive, true)
        )
      );

    if (!parentMembership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Only parents can delete member links',
      });
    }

    // Get the link and verify it's associated with this household
    const [link] = await db
      .select()
      .from(memberLinks)
      .where(
        and(
          eq(memberLinks.id, linkId),
          or(
            eq(memberLinks.primaryHouseholdId, householdId),
            eq(memberLinks.linkedHouseholdId, householdId)
          )
        )
      );

    if (!link) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'Member link not found',
      });
    }

    // Deactivate the link (soft delete)
    await db
      .update(memberLinks)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(memberLinks.id, linkId));

    return reply.status(204).send();
  });

  // Get cross-household points summary for a member
  fastify.get('/:householdId/members/:memberId/cross-household-summary', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, memberId } = request.params as {
      householdId: string;
      memberId: string;
    };

    // Verify user is a member of this household
    const [membership] = await db
      .select()
      .from(members)
      .where(
        and(eq(members.householdId, householdId), eq(members.userId, user.id), eq(members.isActive, true))
      );

    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You are not a member of this household',
      });
    }

    // Get the target member
    const [targetMember] = await db
      .select()
      .from(members)
      .where(
        and(eq(members.id, memberId), eq(members.householdId, householdId))
      );

    if (!targetMember) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'Member not found',
      });
    }

    // Get all linked members with sharePoints enabled
    const links = await db
      .select({
        link: memberLinks,
        linkedMember: members,
        linkedHousehold: households,
      })
      .from(memberLinks)
      .innerJoin(members, eq(memberLinks.linkedMemberId, members.id))
      .innerJoin(households, eq(members.householdId, households.id))
      .where(
        and(
          or(
            eq(memberLinks.primaryMemberId, memberId),
            eq(memberLinks.linkedMemberId, memberId)
          ),
          eq(memberLinks.isActive, true),
          eq(memberLinks.sharePoints, true)
        )
      );

    // Get source household
    const [sourceHousehold] = await db
      .select()
      .from(households)
      .where(eq(households.id, householdId));

    // Calculate totals
    const householdBreakdown = [
      {
        householdId: householdId,
        householdName: sourceHousehold.name,
        pointsCurrent: targetMember.pointsCurrent || 0,
        pointsLifetime: targetMember.pointsLifetime || 0,
      },
      ...links.map((l) => ({
        householdId: l.linkedHousehold.id,
        householdName: l.linkedHousehold.name,
        pointsCurrent: l.linkedMember.pointsCurrent || 0,
        pointsLifetime: l.linkedMember.pointsLifetime || 0,
      })),
    ];

    const totalPoints = householdBreakdown.reduce(
      (sum, h) => sum + h.pointsCurrent,
      0
    );
    const totalLifetimePoints = householdBreakdown.reduce(
      (sum, h) => sum + h.pointsLifetime,
      0
    );

    return reply.send({
      memberId,
      memberName: targetMember.name,
      totalPoints,
      totalLifetimePoints,
      householdBreakdown,
    });
  });
}
