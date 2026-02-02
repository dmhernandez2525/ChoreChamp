import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { eq, and, desc, sql, gte } from 'drizzle-orm';
import { db } from '@chorechamp/database';
import {
  qrCodes,
  qrCodeScans,
  checkpointProgress,
  equipmentCheckouts,
  members,
} from '@chorechamp/database/schema';
import { QR_CODE_TEMPLATES } from '@chorechamp/types';
import { randomBytes } from 'crypto';

// Helper to generate unique code data
function generateCodeData(): string {
  return randomBytes(16).toString('hex');
}

// Helper to calculate distance between two GPS coordinates (Haversine formula)
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Zod schemas
const createQRCodeSchema = z.object({
  type: z.enum([
    'location',
    'chore',
    'equipment',
    'room',
    'task_station',
    'checkpoint',
    'supply_cabinet',
  ]),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  locationName: z.string().max(100).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  radiusMeters: z.number().min(1).max(10000).optional(),
  linkedChoreId: z.string().uuid().optional(),
  linkedZoneName: z.string().max(100).optional(),
  verificationRequirement: z
    .enum([
      'scan_only',
      'scan_and_photo',
      'scan_and_confirm',
      'timed_scan',
      'sequential_scan',
      'gps_verified',
    ])
    .default('scan_only'),
  requiresPhoto: z.boolean().default(false),
  expiresAt: z.string().datetime().optional(),
  checkpointOrder: z.number().int().min(1).optional(),
  checkpointGroupId: z.string().max(100).optional(),
});

const updateQRCodeSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  status: z.enum(['active', 'inactive', 'expired', 'revoked']).optional(),
  locationName: z.string().max(100).nullable().optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  radiusMeters: z.number().min(1).max(10000).nullable().optional(),
  linkedChoreId: z.string().uuid().nullable().optional(),
  linkedZoneName: z.string().max(100).nullable().optional(),
  verificationRequirement: z
    .enum([
      'scan_only',
      'scan_and_photo',
      'scan_and_confirm',
      'timed_scan',
      'sequential_scan',
      'gps_verified',
    ])
    .optional(),
  requiresPhoto: z.boolean().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
});

const scanQRCodeSchema = z.object({
  codeData: z.string().min(1),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  accuracy: z.number().min(0).optional(),
  photoBase64: z.string().optional(),
  devicePlatform: z.string().optional(),
  deviceModel: z.string().optional(),
  appVersion: z.string().optional(),
});

const checkoutEquipmentSchema = z.object({
  qrCodeId: z.string().uuid(),
  notes: z.string().max(500).optional(),
  condition: z.enum(['good', 'fair', 'needs_repair']).default('good'),
  dueAt: z.string().datetime().optional(),
});

const checkinEquipmentSchema = z.object({
  notes: z.string().max(500).optional(),
  condition: z.enum(['good', 'fair', 'needs_repair']),
});

export async function qrVerificationRoutes(fastify: FastifyInstance) {
  // ========================================
  // QR Code Templates
  // ========================================

  /**
   * GET /qr/templates - Get QR code templates
   */
  fastify.get('/qr/templates', async () => {
    return { templates: QR_CODE_TEMPLATES };
  });

  // ========================================
  // QR Code CRUD
  // ========================================

  /**
   * GET /qr/codes - List all QR codes for household
   */
  fastify.get<{
    Params: { householdId: string };
    Querystring: { type?: string; status?: string };
  }>('/qr/codes', async (request) => {
    const { householdId } = request.params;
    const { type, status } = request.query;

    const conditions = [eq(qrCodes.householdId, householdId)];

    if (type) {
      conditions.push(eq(qrCodes.type, type));
    }
    if (status) {
      conditions.push(eq(qrCodes.status, status));
    }

    const codes = await db
      .select()
      .from(qrCodes)
      .where(and(...conditions))
      .orderBy(desc(qrCodes.createdAt));

    return { codes };
  });

  /**
   * POST /qr/codes - Create a new QR code
   */
  fastify.post<{
    Params: { householdId: string };
    Body: z.infer<typeof createQRCodeSchema>;
  }>('/qr/codes', async (request, reply) => {
    const { householdId } = request.params;
    const data = createQRCodeSchema.parse(request.body);
    const memberId = request.headers['x-member-id'] as string;

    const codeData = generateCodeData();
    const codeUrl = `chorechamp://qr/${codeData}`;

    const [code] = await db
      .insert(qrCodes)
      .values({
        householdId,
        type: data.type,
        name: data.name,
        description: data.description,
        codeData,
        codeUrl,
        locationName: data.locationName,
        latitude: data.latitude,
        longitude: data.longitude,
        radiusMeters: data.radiusMeters,
        linkedChoreId: data.linkedChoreId,
        linkedZoneName: data.linkedZoneName,
        verificationRequirement: data.verificationRequirement,
        requiresPhoto: data.requiresPhoto,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        checkpointOrder: data.checkpointOrder,
        checkpointGroupId: data.checkpointGroupId,
        createdBy: memberId,
      })
      .returning();

    return reply.status(201).send({ code });
  });

  /**
   * GET /qr/codes/:codeId - Get a specific QR code
   */
  fastify.get<{
    Params: { householdId: string; codeId: string };
  }>('/qr/codes/:codeId', async (request, reply) => {
    const { householdId, codeId } = request.params;

    const code = await db.query.qrCodes.findFirst({
      where: and(eq(qrCodes.id, codeId), eq(qrCodes.householdId, householdId)),
    });

    if (!code) {
      return reply.status(404).send({ error: 'QR code not found' });
    }

    // Get recent scans
    const recentScans = await db
      .select({
        scan: qrCodeScans,
        member: {
          id: members.id,
          name: members.name,
        },
      })
      .from(qrCodeScans)
      .leftJoin(members, eq(qrCodeScans.memberId, members.id))
      .where(eq(qrCodeScans.qrCodeId, codeId))
      .orderBy(desc(qrCodeScans.scannedAt))
      .limit(10);

    return {
      code,
      recentScans: recentScans.map((s) => ({
        ...s.scan,
        member: s.member,
      })),
    };
  });

  /**
   * PATCH /qr/codes/:codeId - Update a QR code
   */
  fastify.patch<{
    Params: { householdId: string; codeId: string };
    Body: z.infer<typeof updateQRCodeSchema>;
  }>('/qr/codes/:codeId', async (request, reply) => {
    const { householdId, codeId } = request.params;
    const data = updateQRCodeSchema.parse(request.body);

    const existing = await db.query.qrCodes.findFirst({
      where: and(eq(qrCodes.id, codeId), eq(qrCodes.householdId, householdId)),
    });

    if (!existing) {
      return reply.status(404).send({ error: 'QR code not found' });
    }

    const updateData: Record<string, unknown> = {
      ...data,
      updatedAt: new Date(),
    };

    // Handle expiresAt separately to avoid type issues
    if (data.expiresAt !== undefined) {
      updateData.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
    }

    const [updated] = await db
      .update(qrCodes)
      .set(updateData)
      .where(eq(qrCodes.id, codeId))
      .returning();

    return { code: updated };
  });

  /**
   * DELETE /qr/codes/:codeId - Delete a QR code
   */
  fastify.delete<{
    Params: { householdId: string; codeId: string };
  }>('/qr/codes/:codeId', async (request, reply) => {
    const { householdId, codeId } = request.params;

    const existing = await db.query.qrCodes.findFirst({
      where: and(eq(qrCodes.id, codeId), eq(qrCodes.householdId, householdId)),
    });

    if (!existing) {
      return reply.status(404).send({ error: 'QR code not found' });
    }

    await db.delete(qrCodes).where(eq(qrCodes.id, codeId));

    return { success: true };
  });

  /**
   * POST /qr/codes/:codeId/regenerate - Regenerate QR code data
   */
  fastify.post<{
    Params: { householdId: string; codeId: string };
  }>('/qr/codes/:codeId/regenerate', async (request, reply) => {
    const { householdId, codeId } = request.params;

    const existing = await db.query.qrCodes.findFirst({
      where: and(eq(qrCodes.id, codeId), eq(qrCodes.householdId, householdId)),
    });

    if (!existing) {
      return reply.status(404).send({ error: 'QR code not found' });
    }

    const newCodeData = generateCodeData();
    const newCodeUrl = `chorechamp://qr/${newCodeData}`;

    const [updated] = await db
      .update(qrCodes)
      .set({
        codeData: newCodeData,
        codeUrl: newCodeUrl,
        updatedAt: new Date(),
      })
      .where(eq(qrCodes.id, codeId))
      .returning();

    return { code: updated };
  });

  // ========================================
  // QR Code Scanning
  // ========================================

  /**
   * POST /qr/scan - Scan a QR code
   */
  fastify.post<{
    Params: { householdId: string };
    Body: z.infer<typeof scanQRCodeSchema>;
  }>('/qr/scan', async (request, reply) => {
    const { householdId } = request.params;
    const data = scanQRCodeSchema.parse(request.body);
    const memberId = request.headers['x-member-id'] as string;

    if (!memberId) {
      return reply.status(400).send({ error: 'Member ID required' });
    }

    // Find the QR code
    const code = await db.query.qrCodes.findFirst({
      where: and(
        eq(qrCodes.codeData, data.codeData),
        eq(qrCodes.householdId, householdId)
      ),
    });

    if (!code) {
      return reply.status(404).send({
        success: false,
        message: 'QR code not found or belongs to another household',
        qrCode: null,
        scan: null,
        gpsVerified: null,
        gpsDistance: null,
        photoRequired: false,
        photoUploaded: false,
        checkpointProgress: null,
        isLastCheckpoint: false,
        pointsAwarded: 0,
        choreCompleted: false,
      });
    }

    // Check status
    if (code.status !== 'active') {
      return reply.status(400).send({
        success: false,
        message: `QR code is ${code.status}`,
        qrCode: code,
        scan: null,
        gpsVerified: null,
        gpsDistance: null,
        photoRequired: false,
        photoUploaded: false,
        checkpointProgress: null,
        isLastCheckpoint: false,
        pointsAwarded: 0,
        choreCompleted: false,
      });
    }

    // Check expiration
    if (code.expiresAt && new Date(code.expiresAt) < new Date()) {
      await db
        .update(qrCodes)
        .set({ status: 'expired' })
        .where(eq(qrCodes.id, code.id));

      return reply.status(400).send({
        success: false,
        message: 'QR code has expired',
        qrCode: code,
        scan: null,
        gpsVerified: null,
        gpsDistance: null,
        photoRequired: false,
        photoUploaded: false,
        checkpointProgress: null,
        isLastCheckpoint: false,
        pointsAwarded: 0,
        choreCompleted: false,
      });
    }

    let verificationStatus: 'success' | 'failed' | 'pending' = 'success';
    let failureReason: string | null = null;
    let gpsVerified: boolean | null = null;
    let gpsDistance: number | null = null;
    let photoUploaded = false;

    // GPS verification
    if (code.verificationRequirement === 'gps_verified') {
      if (!data.latitude || !data.longitude) {
        verificationStatus = 'failed';
        failureReason = 'GPS location required';
      } else if (code.latitude && code.longitude && code.radiusMeters) {
        gpsDistance = calculateDistance(
          code.latitude,
          code.longitude,
          data.latitude,
          data.longitude
        );
        gpsVerified = gpsDistance <= code.radiusMeters;

        if (!gpsVerified) {
          verificationStatus = 'failed';
          failureReason = `Too far from location (${Math.round(gpsDistance)}m away, max ${code.radiusMeters}m)`;
        }
      }
    }

    // Photo verification
    if (code.requiresPhoto || code.verificationRequirement === 'scan_and_photo') {
      if (data.photoBase64) {
        photoUploaded = true;
        // In production, upload photo to storage and get URL
        // For now, we'll just mark it as uploaded
      } else if (verificationStatus === 'success') {
        verificationStatus = 'pending';
        failureReason = 'Photo required';
      }
    }

    // Create scan record
    const [scan] = await db
      .insert(qrCodeScans)
      .values({
        qrCodeId: code.id,
        householdId,
        memberId,
        scanLocation:
          data.latitude && data.longitude
            ? {
                latitude: data.latitude,
                longitude: data.longitude,
                accuracy: data.accuracy || 0,
              }
            : null,
        verificationStatus,
        failureReason,
        gpsVerified,
        gpsDistanceMeters: gpsDistance,
        photoVerified: photoUploaded ? null : null, // Would be set after review
        deviceInfo:
          data.devicePlatform || data.deviceModel || data.appVersion
            ? {
                platform: data.devicePlatform || 'unknown',
                deviceModel: data.deviceModel || 'unknown',
                appVersion: data.appVersion || 'unknown',
              }
            : null,
        bonusPointsAwarded: verificationStatus === 'success' ? 5 : 0,
      })
      .returning();

    // Update QR code stats
    await db
      .update(qrCodes)
      .set({
        totalScans: sql`${qrCodes.totalScans} + 1`,
        lastScannedAt: new Date(),
        lastScannedBy: memberId,
      })
      .where(eq(qrCodes.id, code.id));

    // Handle checkpoint progress
    let progress = null;
    let isLastCheckpoint = false;

    if (
      code.type === 'checkpoint' &&
      code.checkpointGroupId &&
      verificationStatus === 'success'
    ) {
      // Get or create checkpoint progress
      const existingProgress = await db.query.checkpointProgress.findFirst({
        where: and(
          eq(checkpointProgress.memberId, memberId),
          eq(checkpointProgress.checkpointGroupId, code.checkpointGroupId),
          eq(checkpointProgress.status, 'in_progress')
        ),
      });

      if (existingProgress) {
        // Check if this checkpoint was already scanned
        const alreadyCompleted = (existingProgress.completedCheckpointIds as string[]).includes(
          code.id
        );

        if (!alreadyCompleted) {
          const newCompletedIds = [
            ...(existingProgress.completedCheckpointIds as string[]),
            code.id,
          ];
          const newCompletedCount = existingProgress.completedCheckpoints + 1;
          isLastCheckpoint = newCompletedCount >= existingProgress.totalCheckpoints;

          const [updatedProgress] = await db
            .update(checkpointProgress)
            .set({
              completedCheckpoints: newCompletedCount,
              completedCheckpointIds: newCompletedIds,
              status: isLastCheckpoint ? 'completed' : 'in_progress',
              completedAt: isLastCheckpoint ? new Date() : null,
              bonusPointsAwarded: isLastCheckpoint
                ? existingProgress.bonusPointsAwarded + 10
                : existingProgress.bonusPointsAwarded,
            })
            .where(eq(checkpointProgress.id, existingProgress.id))
            .returning();

          progress = updatedProgress;
        } else {
          progress = existingProgress;
        }
      } else {
        // Get total checkpoints in group
        const [{ count }] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(qrCodes)
          .where(
            and(
              eq(qrCodes.householdId, householdId),
              eq(qrCodes.checkpointGroupId, code.checkpointGroupId)
            )
          );

        isLastCheckpoint = count === 1;

        const [newProgress] = await db
          .insert(checkpointProgress)
          .values({
            memberId,
            householdId,
            checkpointGroupId: code.checkpointGroupId,
            choreId: code.linkedChoreId,
            totalCheckpoints: count,
            completedCheckpoints: 1,
            completedCheckpointIds: [code.id],
            status: isLastCheckpoint ? 'completed' : 'in_progress',
            completedAt: isLastCheckpoint ? new Date() : null,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
          })
          .returning();

        progress = newProgress;
      }
    }

    // Award points if successful
    if (verificationStatus === 'success') {
      await db
        .update(members)
        .set({
          pointsCurrent: sql`points_current + 5`,
          pointsLifetime: sql`points_lifetime + 5`,
        })
        .where(eq(members.id, memberId));
    }

    return {
      success: verificationStatus === 'success',
      message:
        verificationStatus === 'success'
          ? 'Scan verified successfully'
          : failureReason || 'Verification pending',
      qrCode: code,
      scan,
      gpsVerified,
      gpsDistance,
      photoRequired: code.requiresPhoto,
      photoUploaded,
      checkpointProgress: progress,
      isLastCheckpoint,
      pointsAwarded: verificationStatus === 'success' ? 5 : 0,
      choreCompleted: isLastCheckpoint && code.linkedChoreId !== null,
    };
  });

  /**
   * GET /qr/scans - Get scan history
   */
  fastify.get<{
    Params: { householdId: string };
    Querystring: {
      memberId?: string;
      qrCodeId?: string;
      status?: string;
      limit?: string;
      offset?: string;
    };
  }>('/qr/scans', async (request) => {
    const { householdId } = request.params;
    const { memberId, qrCodeId, status, limit = '50', offset = '0' } = request.query;

    const conditions = [eq(qrCodeScans.householdId, householdId)];

    if (memberId) {
      conditions.push(eq(qrCodeScans.memberId, memberId));
    }
    if (qrCodeId) {
      conditions.push(eq(qrCodeScans.qrCodeId, qrCodeId));
    }
    if (status) {
      conditions.push(eq(qrCodeScans.verificationStatus, status));
    }

    const scans = await db
      .select({
        scan: qrCodeScans,
        qrCode: {
          id: qrCodes.id,
          name: qrCodes.name,
          type: qrCodes.type,
        },
        member: {
          id: members.id,
          name: members.name,
        },
      })
      .from(qrCodeScans)
      .leftJoin(qrCodes, eq(qrCodeScans.qrCodeId, qrCodes.id))
      .leftJoin(members, eq(qrCodeScans.memberId, members.id))
      .where(and(...conditions))
      .orderBy(desc(qrCodeScans.scannedAt))
      .limit(parseInt(limit))
      .offset(parseInt(offset));

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(qrCodeScans)
      .where(and(...conditions));

    return {
      scans: scans.map((s) => ({
        ...s.scan,
        qrCode: s.qrCode,
        member: s.member,
      })),
      total: count,
    };
  });

  // ========================================
  // Equipment Checkout/Checkin
  // ========================================

  /**
   * POST /qr/equipment/checkout - Check out equipment
   */
  fastify.post<{
    Params: { householdId: string };
    Body: z.infer<typeof checkoutEquipmentSchema>;
  }>('/qr/equipment/checkout', async (request, reply) => {
    const { householdId } = request.params;
    const data = checkoutEquipmentSchema.parse(request.body);
    const memberId = request.headers['x-member-id'] as string;

    if (!memberId) {
      return reply.status(400).send({ error: 'Member ID required' });
    }

    // Verify QR code exists and is equipment type
    const code = await db.query.qrCodes.findFirst({
      where: and(
        eq(qrCodes.id, data.qrCodeId),
        eq(qrCodes.householdId, householdId),
        eq(qrCodes.type, 'equipment')
      ),
    });

    if (!code) {
      return reply.status(404).send({ error: 'Equipment QR code not found' });
    }

    // Check if already checked out
    const existingCheckout = await db.query.equipmentCheckouts.findFirst({
      where: and(
        eq(equipmentCheckouts.qrCodeId, data.qrCodeId),
        eq(equipmentCheckouts.status, 'checked_out')
      ),
    });

    if (existingCheckout) {
      return reply.status(400).send({
        error: 'Equipment already checked out',
        checkout: existingCheckout,
      });
    }

    const [checkout] = await db
      .insert(equipmentCheckouts)
      .values({
        qrCodeId: data.qrCodeId,
        householdId,
        memberId,
        equipmentName: code.name,
        checkoutNotes: data.notes,
        conditionOnCheckout: data.condition,
        dueAt: data.dueAt ? new Date(data.dueAt) : null,
      })
      .returning();

    return reply.status(201).send({ checkout });
  });

  /**
   * POST /qr/equipment/:checkoutId/checkin - Check in equipment
   */
  fastify.post<{
    Params: { householdId: string; checkoutId: string };
    Body: z.infer<typeof checkinEquipmentSchema>;
  }>('/qr/equipment/:checkoutId/checkin', async (request, reply) => {
    const { householdId, checkoutId } = request.params;
    const data = checkinEquipmentSchema.parse(request.body);

    const checkout = await db.query.equipmentCheckouts.findFirst({
      where: and(
        eq(equipmentCheckouts.id, checkoutId),
        eq(equipmentCheckouts.householdId, householdId)
      ),
    });

    if (!checkout) {
      return reply.status(404).send({ error: 'Checkout not found' });
    }

    if (checkout.status !== 'checked_out') {
      return reply.status(400).send({ error: 'Equipment not checked out' });
    }

    const [updated] = await db
      .update(equipmentCheckouts)
      .set({
        status: 'checked_in',
        checkedInAt: new Date(),
        checkinNotes: data.notes,
        conditionOnCheckin: data.condition,
      })
      .where(eq(equipmentCheckouts.id, checkoutId))
      .returning();

    return { checkout: updated };
  });

  /**
   * GET /qr/equipment/checkouts - Get equipment checkout history
   */
  fastify.get<{
    Params: { householdId: string };
    Querystring: { status?: string; memberId?: string };
  }>('/qr/equipment/checkouts', async (request) => {
    const { householdId } = request.params;
    const { status, memberId } = request.query;

    const conditions = [eq(equipmentCheckouts.householdId, householdId)];

    if (status) {
      conditions.push(eq(equipmentCheckouts.status, status));
    }
    if (memberId) {
      conditions.push(eq(equipmentCheckouts.memberId, memberId));
    }

    const checkouts = await db
      .select({
        checkout: equipmentCheckouts,
        member: {
          id: members.id,
          name: members.name,
        },
      })
      .from(equipmentCheckouts)
      .leftJoin(members, eq(equipmentCheckouts.memberId, members.id))
      .where(and(...conditions))
      .orderBy(desc(equipmentCheckouts.checkedOutAt));

    return {
      checkouts: checkouts.map((c) => ({
        ...c.checkout,
        member: c.member,
      })),
    };
  });

  // ========================================
  // Checkpoint Progress
  // ========================================

  /**
   * GET /qr/checkpoints/progress - Get checkpoint progress for member
   */
  fastify.get<{
    Params: { householdId: string };
    Querystring: { memberId?: string; status?: string };
  }>('/qr/checkpoints/progress', async (request) => {
    const { householdId } = request.params;
    const memberId = request.query.memberId || (request.headers['x-member-id'] as string);
    const { status } = request.query;

    const conditions = [eq(checkpointProgress.householdId, householdId)];

    if (memberId) {
      conditions.push(eq(checkpointProgress.memberId, memberId));
    }
    if (status) {
      conditions.push(eq(checkpointProgress.status, status));
    }

    const progress = await db
      .select()
      .from(checkpointProgress)
      .where(and(...conditions))
      .orderBy(desc(checkpointProgress.startedAt));

    // Get checkpoint details for each progress
    const withCheckpoints = await Promise.all(
      progress.map(async (p) => {
        const checkpoints = await db
          .select({
            id: qrCodes.id,
            name: qrCodes.name,
            checkpointOrder: qrCodes.checkpointOrder,
          })
          .from(qrCodes)
          .where(eq(qrCodes.checkpointGroupId, p.checkpointGroupId))
          .orderBy(qrCodes.checkpointOrder);

        return {
          ...p,
          checkpoints: checkpoints.map((cp) => ({
            ...cp,
            completed: (p.completedCheckpointIds as string[]).includes(cp.id),
          })),
        };
      })
    );

    return { progress: withCheckpoints };
  });

  // ========================================
  // Analytics
  // ========================================

  /**
   * GET /qr/analytics - Get QR code analytics
   */
  fastify.get<{
    Params: { householdId: string };
    Querystring: { days?: string };
  }>('/qr/analytics', async (request) => {
    const { householdId } = request.params;
    const days = parseInt(request.query.days || '30');
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Get all QR codes
    const codes = await db
      .select()
      .from(qrCodes)
      .where(eq(qrCodes.householdId, householdId));

    // Get scans in period
    const scans = await db
      .select()
      .from(qrCodeScans)
      .where(
        and(
          eq(qrCodeScans.householdId, householdId),
          gte(qrCodeScans.scannedAt, since)
        )
      );

    const totalScans = scans.length;
    const successfulScans = scans.filter((s) => s.verificationStatus === 'success').length;
    const failedScans = scans.filter((s) => s.verificationStatus === 'failed').length;
    const successRate = totalScans > 0 ? (successfulScans / totalScans) * 100 : 0;
    const totalPointsAwarded = scans.reduce((sum, s) => sum + s.bonusPointsAwarded, 0);

    // Group by type
    const scansByType: Record<string, { scans: number; success: number }> = {};
    for (const scan of scans) {
      const code = codes.find((c) => c.id === scan.qrCodeId);
      if (code) {
        if (!scansByType[code.type]) {
          scansByType[code.type] = { scans: 0, success: 0 };
        }
        scansByType[code.type].scans++;
        if (scan.verificationStatus === 'success') {
          scansByType[code.type].success++;
        }
      }
    }

    // Group by member
    const scansByMember: Record<string, { scans: number; points: number }> = {};
    for (const scan of scans) {
      if (!scansByMember[scan.memberId]) {
        scansByMember[scan.memberId] = { scans: 0, points: 0 };
      }
      scansByMember[scan.memberId].scans++;
      scansByMember[scan.memberId].points += scan.bonusPointsAwarded;
    }

    // Get member names
    const memberIds = Object.keys(scansByMember);
    const memberData = memberIds.length > 0
      ? await db
          .select({ id: members.id, name: members.name })
          .from(members)
          .where(sql`${members.id} IN (${sql.join(memberIds.map((id) => sql`${id}`), sql`, `)})`)
      : [];

    // Top QR codes
    const topCodes = codes
      .filter((c) => c.totalScans > 0)
      .sort((a, b) => b.totalScans - a.totalScans)
      .slice(0, 5);

    // Recent scans
    const recentScans = scans
      .sort((a, b) => new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime())
      .slice(0, 10);

    return {
      analytics: {
        totalQRCodes: codes.length,
        activeQRCodes: codes.filter((c) => c.status === 'active').length,
        totalScans,
        successfulScans,
        failedScans,
        successRate: Math.round(successRate),
        totalPointsAwarded,
        totalChoresCompleted: scans.filter((s) => s.choreCompletionId).length,
        scansByType: Object.entries(scansByType).map(([type, data]) => ({
          type,
          scans: data.scans,
          successRate: Math.round((data.success / data.scans) * 100),
        })),
        scansByMember: Object.entries(scansByMember).map(([memberId, data]) => ({
          memberId,
          memberName: memberData.find((m) => m.id === memberId)?.name || 'Unknown',
          scans: data.scans,
          points: data.points,
        })),
        topQRCodes: topCodes.map((c) => ({
          id: c.id,
          name: c.name,
          scans: c.totalScans,
        })),
        recentScans,
      },
    };
  });
}
