import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { eq, and, desc, sql, gt, or } from 'drizzle-orm';
import { db } from '../lib/db';
import {
  virtualPets,
  petSpecies,
  petAbilities,
  petAccessories,
  petEvents,
  petPlaydates,
  members,
} from '@chorechamp/database';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import {
  PET_CONFIG,
  getPetLevelFromXP,
  getTotalPetXPForLevel,
  canEvolve,
  calculateMood,
  applyStatDecay,
  applyEnergyRegen,
  isActionOnCooldown,
  performAction,
  getAvailableActions,
  getPetHappinessBonus,
  getMoodDisplay,
  getEvolutionDisplay,
} from '@chorechamp/gamification';
import type { PetAction, PetStats } from '@chorechamp/types';

// Validation schemas
const adoptPetSchema = z.object({
  name: z.string().min(1).max(50),
  speciesId: z.string(),
});

const renamePetSchema = z.object({
  name: z.string().min(1).max(50),
});

const performActionSchema = z.object({
  action: z.enum(['feed', 'play', 'pet', 'rest', 'train', 'heal']),
});

const equipAccessorySchema = z.object({
  accessoryId: z.string(),
  slot: z.string().optional(),
});

const unequipAccessorySchema = z.object({
  accessoryId: z.string(),
});

const activateAbilitySchema = z.object({
  abilityId: z.string(),
});

const createPlaydateSchema = z.object({
  guestPetId: z.string().uuid(),
  scheduledAt: z.string().datetime(),
});

// Helper functions
async function verifyMembership(
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

async function getMemberById(
  memberId: string,
  householdId: string
): Promise<typeof members.$inferSelect | null> {
  const [member] = await db
    .select()
    .from(members)
    .where(and(
      eq(members.id, memberId),
      eq(members.householdId, householdId)
    ));
  return member || null;
}

async function verifyParentOrSelf(
  userId: string,
  memberId: string,
  householdId: string
): Promise<boolean> {
  const [membership] = await db
    .select()
    .from(members)
    .where(and(
      eq(members.householdId, householdId),
      eq(members.userId, userId)
    ));

  if (!membership) return false;

  // User is accessing their own pet
  if (membership.id === memberId) return true;

  // User is a parent
  return membership.role === 'parent';
}

async function getPetWithOwnership(
  petId: string,
  householdId: string
): Promise<typeof virtualPets.$inferSelect | null> {
  const [pet] = await db
    .select()
    .from(virtualPets)
    .where(and(
      eq(virtualPets.id, petId),
      eq(virtualPets.householdId, householdId)
    ));
  return pet || null;
}

// Apply stat decay and energy regen to a pet
async function updatePetStats(pet: typeof virtualPets.$inferSelect): Promise<typeof virtualPets.$inferSelect> {
  if (!pet.lastStatsDecayAt) return pet;

  const now = new Date();
  const lastDecay = new Date(pet.lastStatsDecayAt);
  const hoursElapsed = (now.getTime() - lastDecay.getTime()) / (1000 * 60 * 60);

  if (hoursElapsed < 1) return pet; // Only decay once per hour

  // Get species for decay/regen rates
  const [species] = await db
    .select()
    .from(petSpecies)
    .where(eq(petSpecies.id, pet.speciesId));

  if (!species) return pet;

  const baseStats = species.baseStats as {
    healthDecayRate: number;
    happinessDecayRate: number;
    energyRegenRate: number;
  };

  const currentStats: PetStats = {
    health: pet.statHealth,
    maxHealth: pet.statMaxHealth,
    happiness: pet.statHappiness,
    maxHappiness: pet.statMaxHappiness,
    energy: pet.statEnergy,
    maxEnergy: pet.statMaxEnergy,
  };

  // Apply decay
  let updatedStats = applyStatDecay(currentStats, hoursElapsed, {
    healthDecayRate: baseStats.healthDecayRate,
    happinessDecayRate: baseStats.happinessDecayRate,
  });

  // Apply energy regen
  updatedStats = applyEnergyRegen(updatedStats, hoursElapsed, baseStats.energyRegenRate);

  // Calculate new mood
  const newMood = calculateMood(updatedStats);

  // Check consecutive healthy days
  const wasHealthy = pet.statHealth >= PET_CONFIG.healthWarningThreshold;
  const isHealthy = updatedStats.health >= PET_CONFIG.healthWarningThreshold;
  let consecutiveDaysHealthy = pet.consecutiveDaysHealthy;

  if (hoursElapsed >= 24) {
    if (isHealthy && wasHealthy) {
      consecutiveDaysHealthy += Math.floor(hoursElapsed / 24);
    } else if (!isHealthy) {
      consecutiveDaysHealthy = 0;
    }
  }

  // Update in database
  const [updated] = await db
    .update(virtualPets)
    .set({
      statHealth: updatedStats.health,
      statHappiness: updatedStats.happiness,
      statEnergy: updatedStats.energy,
      mood: newMood,
      consecutiveDaysHealthy,
      lastStatsDecayAt: now,
      updatedAt: now,
    })
    .where(eq(virtualPets.id, pet.id))
    .returning();

  return updated;
}

export async function virtualPetRoutes(fastify: FastifyInstance) {
  // Get all pet species
  fastify.get('/species', {
    preHandler: [requireAuth],
  }, async (_request, reply) => {
    const species = await db
      .select()
      .from(petSpecies)
      .orderBy(petSpecies.sortOrder);

    // Get abilities for each species
    const abilities = await db
      .select()
      .from(petAbilities)
      .orderBy(petAbilities.sortOrder);

    const speciesWithAbilities = species.map(s => ({
      ...s,
      abilities: abilities.filter(a => a.speciesId === s.id),
    }));

    return reply.send(speciesWithAbilities);
  });

  // Get all pet accessories
  fastify.get('/accessories', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { category } = request.query as { category?: string };

    let query = db.select().from(petAccessories);

    if (category) {
      query = query.where(eq(petAccessories.category, category)) as typeof query;
    }

    const accessories = await query.orderBy(petAccessories.category, petAccessories.sortOrder);
    return reply.send(accessories);
  });

  // Get all pets for a member
  fastify.get('/member/:memberId', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, memberId } = request.params as { householdId: string; memberId: string };

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You are not a member of this household',
      });
    }

    const pets = await db
      .select({
        pet: virtualPets,
        species: petSpecies,
      })
      .from(virtualPets)
      .innerJoin(petSpecies, eq(virtualPets.speciesId, petSpecies.id))
      .where(and(
        eq(virtualPets.memberId, memberId),
        eq(virtualPets.isActive, true)
      ))
      .orderBy(desc(virtualPets.createdAt));

    // Update stats for each pet and format response
    const petsWithDetails = await Promise.all(pets.map(async ({ pet, species }) => {
      const updatedPet = await updatePetStats(pet);

      const stats: PetStats = {
        health: updatedPet.statHealth,
        maxHealth: updatedPet.statMaxHealth,
        happiness: updatedPet.statHappiness,
        maxHappiness: updatedPet.statMaxHappiness,
        energy: updatedPet.statEnergy,
        maxEnergy: updatedPet.statMaxEnergy,
      };

      const availableActions = getAvailableActions(
        stats,
        updatedPet.lastFedAt,
        updatedPet.lastPlayedAt,
        updatedPet.lastPettedAt
      );

      const moodDisplay = getMoodDisplay(updatedPet.mood as Parameters<typeof getMoodDisplay>[0]);
      const evolutionDisplay = getEvolutionDisplay(updatedPet.evolutionTier as Parameters<typeof getEvolutionDisplay>[0]);

      // Get XP progress to next level
      const currentLevelXP = getTotalPetXPForLevel(updatedPet.level);
      const nextLevelXP = getTotalPetXPForLevel(updatedPet.level + 1);
      const xpForNextLevel = nextLevelXP - currentLevelXP;
      const xpInLevel = updatedPet.xp - currentLevelXP;

      // Check evolution readiness
      const evolutionCheck = canEvolve(
        updatedPet.evolutionTier as Parameters<typeof canEvolve>[0],
        updatedPet.level
      );

      return {
        ...updatedPet,
        species,
        stats,
        availableActions,
        moodDisplay,
        evolutionDisplay,
        xpProgress: {
          current: xpInLevel,
          needed: xpForNextLevel,
          percentage: Math.round((xpInLevel / xpForNextLevel) * 100),
        },
        canEvolve: evolutionCheck.canEvolve,
        nextEvolutionTier: evolutionCheck.nextTier,
        happinessBonus: getPetHappinessBonus(stats),
      };
    }));

    return reply.send(petsWithDetails);
  });

  // Get specific pet details
  fastify.get('/:petId', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, petId } = request.params as { householdId: string; petId: string };

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You are not a member of this household',
      });
    }

    const pet = await getPetWithOwnership(petId, householdId);
    if (!pet) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'Pet not found',
      });
    }

    // Update stats
    const updatedPet = await updatePetStats(pet);

    // Get species info
    const [species] = await db
      .select()
      .from(petSpecies)
      .where(eq(petSpecies.id, updatedPet.speciesId));

    // Get abilities for this species
    const abilities = await db
      .select()
      .from(petAbilities)
      .where(eq(petAbilities.speciesId, updatedPet.speciesId))
      .orderBy(petAbilities.sortOrder);

    // Get recent events
    const recentEvents = await db
      .select()
      .from(petEvents)
      .where(eq(petEvents.petId, petId))
      .orderBy(desc(petEvents.createdAt))
      .limit(20);

    // Get upcoming playdates
    const upcomingPlaydates = await db
      .select()
      .from(petPlaydates)
      .where(and(
        or(
          eq(petPlaydates.hostPetId, petId),
          eq(petPlaydates.guestPetId, petId)
        ),
        eq(petPlaydates.status, 'pending'),
        gt(petPlaydates.scheduledAt, new Date())
      ))
      .orderBy(petPlaydates.scheduledAt)
      .limit(5);

    const stats: PetStats = {
      health: updatedPet.statHealth,
      maxHealth: updatedPet.statMaxHealth,
      happiness: updatedPet.statHappiness,
      maxHappiness: updatedPet.statMaxHappiness,
      energy: updatedPet.statEnergy,
      maxEnergy: updatedPet.statMaxEnergy,
    };

    const availableActions = getAvailableActions(
      stats,
      updatedPet.lastFedAt,
      updatedPet.lastPlayedAt,
      updatedPet.lastPettedAt
    );

    const moodDisplay = getMoodDisplay(updatedPet.mood as Parameters<typeof getMoodDisplay>[0]);
    const evolutionDisplay = getEvolutionDisplay(updatedPet.evolutionTier as Parameters<typeof getEvolutionDisplay>[0]);

    // Get XP progress
    const currentLevelXP = getTotalPetXPForLevel(updatedPet.level);
    const nextLevelXP = getTotalPetXPForLevel(updatedPet.level + 1);
    const xpForNextLevel = nextLevelXP - currentLevelXP;
    const xpInLevel = updatedPet.xp - currentLevelXP;

    // Check evolution readiness
    const evolutionCheck = canEvolve(
      updatedPet.evolutionTier as Parameters<typeof canEvolve>[0],
      updatedPet.level
    );

    // Filter abilities by unlocked tier
    const tierOrder = ['baby', 'juvenile', 'adult', 'legendary'];
    const currentTierIndex = tierOrder.indexOf(updatedPet.evolutionTier);
    const unlockedAbilities = abilities.filter(a => {
      const abilityTierIndex = tierOrder.indexOf(a.unlockTier);
      return abilityTierIndex <= currentTierIndex;
    });

    return reply.send({
      pet: {
        ...updatedPet,
        species,
        stats,
        availableActions,
        moodDisplay,
        evolutionDisplay,
        xpProgress: {
          current: xpInLevel,
          needed: xpForNextLevel,
          percentage: Math.round((xpInLevel / xpForNextLevel) * 100),
        },
        canEvolve: evolutionCheck.canEvolve,
        nextEvolutionTier: evolutionCheck.nextTier,
        happinessBonus: getPetHappinessBonus(stats),
      },
      abilities: unlockedAbilities,
      recentEvents,
      upcomingPlaydates,
    });
  });

  // Adopt a new pet
  fastify.post('/adopt/:memberId', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, memberId } = request.params as { householdId: string; memberId: string };
    const body = adoptPetSchema.parse(request.body);

    const canEdit = await verifyParentOrSelf(user.id, memberId, householdId);
    if (!canEdit) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You can only adopt pets for yourself or your children',
      });
    }

    // Check member exists
    const member = await getMemberById(memberId, householdId);
    if (!member) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'Member not found',
      });
    }

    // Check pet limit for member
    const memberPetCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(virtualPets)
      .where(and(
        eq(virtualPets.memberId, memberId),
        eq(virtualPets.isActive, true)
      ));

    if (Number(memberPetCount[0]?.count || 0) >= PET_CONFIG.maxPetsPerMember) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: `Maximum ${PET_CONFIG.maxPetsPerMember} pets per member`,
      });
    }

    // Check pet limit for household
    const householdPetCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(virtualPets)
      .where(and(
        eq(virtualPets.householdId, householdId),
        eq(virtualPets.isActive, true)
      ));

    if (Number(householdPetCount[0]?.count || 0) >= PET_CONFIG.maxPetsPerHousehold) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: `Maximum ${PET_CONFIG.maxPetsPerHousehold} pets per household`,
      });
    }

    // Verify species exists
    const [species] = await db
      .select()
      .from(petSpecies)
      .where(eq(petSpecies.id, body.speciesId));

    if (!species) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'Pet species not found',
      });
    }

    const baseStats = species.baseStats as {
      maxHealth: number;
      maxHappiness: number;
      maxEnergy: number;
    };

    // Get default accessories for this species
    const defaultAccessories = await db
      .select()
      .from(petAccessories)
      .where(eq(petAccessories.isDefault, true));

    const defaultAccessoryIds = defaultAccessories.map(a => a.id);

    // Create the pet
    const [pet] = await db
      .insert(virtualPets)
      .values({
        memberId,
        householdId,
        name: body.name,
        speciesId: body.speciesId,
        evolutionTier: 'baby',
        level: 1,
        xp: 0,
        statHealth: baseStats.maxHealth,
        statMaxHealth: baseStats.maxHealth,
        statHappiness: baseStats.maxHappiness,
        statMaxHappiness: baseStats.maxHappiness,
        statEnergy: baseStats.maxEnergy,
        statMaxEnergy: baseStats.maxEnergy,
        mood: 'happy',
        equippedAccessories: [],
        unlockedAccessories: defaultAccessoryIds,
        lastStatsDecayAt: new Date(),
      })
      .returning();

    // Log adoption event
    await db.insert(petEvents).values({
      petId: pet.id,
      memberId,
      eventType: 'adopted',
      description: `${body.name} the ${species.name} was adopted!`,
      data: { speciesId: body.speciesId, speciesName: species.name },
    });

    // Emit pet adopted event
    const io = fastify.io;
    if (io) {
      io.to(`household:${householdId}`).emit('pet:adopted', {
        memberId,
        memberName: member.name,
        petId: pet.id,
        petName: body.name,
        speciesId: body.speciesId,
        speciesName: species.name,
      });
    }

    return reply.status(201).send({
      pet,
      species,
    });
  });

  // Rename a pet
  fastify.put('/:petId/name', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, petId } = request.params as { householdId: string; petId: string };
    const body = renamePetSchema.parse(request.body);

    const pet = await getPetWithOwnership(petId, householdId);
    if (!pet) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'Pet not found',
      });
    }

    const canEdit = await verifyParentOrSelf(user.id, pet.memberId, householdId);
    if (!canEdit) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You can only rename your own pets or your children\'s',
      });
    }

    const oldName = pet.name;
    const [updated] = await db
      .update(virtualPets)
      .set({
        name: body.name,
        updatedAt: new Date(),
      })
      .where(eq(virtualPets.id, petId))
      .returning();

    // Log rename event
    await db.insert(petEvents).values({
      petId,
      memberId: pet.memberId,
      eventType: 'renamed',
      description: `${oldName} was renamed to ${body.name}`,
      data: { oldName, newName: body.name },
    });

    return reply.send(updated);
  });

  // Perform action on pet
  fastify.post('/:petId/action', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, petId } = request.params as { householdId: string; petId: string };
    const body = performActionSchema.parse(request.body);

    const pet = await getPetWithOwnership(petId, householdId);
    if (!pet) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'Pet not found',
      });
    }

    const canEdit = await verifyParentOrSelf(user.id, pet.memberId, householdId);
    if (!canEdit) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You can only interact with your own pets or your children\'s',
      });
    }

    // Update stats first
    const updatedPet = await updatePetStats(pet);

    // Check cooldown for this action
    let lastActionAt: Date | null = null;
    switch (body.action) {
      case 'feed':
        lastActionAt = updatedPet.lastFedAt;
        break;
      case 'play':
        lastActionAt = updatedPet.lastPlayedAt;
        break;
      case 'pet':
        lastActionAt = updatedPet.lastPettedAt;
        break;
    }

    const cooldownCheck = isActionOnCooldown(body.action, lastActionAt, PET_CONFIG.actionCooldowns);
    if (cooldownCheck.onCooldown) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: `${body.action} is on cooldown`,
        availableAt: cooldownCheck.availableAt,
      });
    }

    // Perform the action
    const currentStats: PetStats = {
      health: updatedPet.statHealth,
      maxHealth: updatedPet.statMaxHealth,
      happiness: updatedPet.statHappiness,
      maxHappiness: updatedPet.statMaxHappiness,
      energy: updatedPet.statEnergy,
      maxEnergy: updatedPet.statMaxEnergy,
    };

    const result = performAction(body.action as PetAction, currentStats, updatedPet.level);

    // Prepare update object
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (result.statChanges.health !== undefined) {
      updateData.statHealth = result.statChanges.health;
    }
    if (result.statChanges.happiness !== undefined) {
      updateData.statHappiness = result.statChanges.happiness;
    }
    if (result.statChanges.energy !== undefined) {
      updateData.statEnergy = result.statChanges.energy;
    }

    // Update cooldown timestamps
    switch (body.action) {
      case 'feed':
        updateData.lastFedAt = new Date();
        break;
      case 'play':
        updateData.lastPlayedAt = new Date();
        break;
      case 'pet':
        updateData.lastPettedAt = new Date();
        break;
    }

    // Apply XP gain
    let leveledUp = false;
    let evolved = false;
    let newTier: string | null = null;

    if (result.xpGained > 0) {
      const newXP = updatedPet.xp + result.xpGained;
      const newLevel = getPetLevelFromXP(newXP);
      leveledUp = newLevel > updatedPet.level;

      updateData.xp = newXP;
      updateData.level = newLevel;

      // Check for evolution
      if (leveledUp) {
        const evolutionCheck = canEvolve(
          updatedPet.evolutionTier as Parameters<typeof canEvolve>[0],
          newLevel
        );
        if (evolutionCheck.canEvolve && evolutionCheck.nextTier) {
          evolved = true;
          newTier = evolutionCheck.nextTier;
          updateData.evolutionTier = evolutionCheck.nextTier;
        }
      }
    }

    // Calculate new mood
    const finalStats: PetStats = {
      health: (updateData.statHealth as number) ?? updatedPet.statHealth,
      maxHealth: updatedPet.statMaxHealth,
      happiness: (updateData.statHappiness as number) ?? updatedPet.statHappiness,
      maxHappiness: updatedPet.statMaxHappiness,
      energy: (updateData.statEnergy as number) ?? updatedPet.statEnergy,
      maxEnergy: updatedPet.statMaxEnergy,
    };
    updateData.mood = calculateMood(finalStats);

    // Update the pet
    const [finalPet] = await db
      .update(virtualPets)
      .set(updateData)
      .where(eq(virtualPets.id, petId))
      .returning();

    // Log event
    await db.insert(petEvents).values({
      petId,
      memberId: updatedPet.memberId,
      eventType: body.action,
      description: result.message,
      data: {
        action: body.action,
        xpGained: result.xpGained,
        statChanges: result.statChanges,
        leveledUp,
        evolved,
        newTier,
      },
    });

    // Emit events
    const io = fastify.io;
    if (io) {
      io.to(`household:${householdId}`).emit('pet:action', {
        petId,
        petName: finalPet.name,
        action: body.action,
        result,
      });

      if (leveledUp) {
        io.to(`household:${householdId}`).emit('pet:leveled-up', {
          petId,
          petName: finalPet.name,
          newLevel: finalPet.level,
        });
      }

      if (evolved) {
        io.to(`household:${householdId}`).emit('pet:evolved', {
          petId,
          petName: finalPet.name,
          newTier,
        });
      }
    }

    return reply.send({
      pet: finalPet,
      result,
      leveledUp,
      evolved,
      newTier,
    });
  });

  // Evolve pet
  fastify.post('/:petId/evolve', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, petId } = request.params as { householdId: string; petId: string };

    const pet = await getPetWithOwnership(petId, householdId);
    if (!pet) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'Pet not found',
      });
    }

    const canEdit = await verifyParentOrSelf(user.id, pet.memberId, householdId);
    if (!canEdit) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You can only evolve your own pets or your children\'s',
      });
    }

    // Check if can evolve
    const evolutionCheck = canEvolve(
      pet.evolutionTier as Parameters<typeof canEvolve>[0],
      pet.level
    );

    if (!evolutionCheck.canEvolve || !evolutionCheck.nextTier) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Pet cannot evolve at this time',
        currentTier: pet.evolutionTier,
        level: pet.level,
      });
    }

    // Get species for stat multiplier
    const [species] = await db
      .select()
      .from(petSpecies)
      .where(eq(petSpecies.id, pet.speciesId));

    if (!species) {
      return reply.status(500).send({
        error: 'Internal Error',
        message: 'Pet species not found',
      });
    }

    // Find evolution path data
    const evolutionPath = species.evolutionPath as Array<{
      tier: string;
      statsMultiplier: number;
    }>;
    const nextEvolution = evolutionPath.find(e => e.tier === evolutionCheck.nextTier);
    const statMultiplier = nextEvolution?.statsMultiplier || 1.1;

    // Update stats based on evolution
    const [evolved] = await db
      .update(virtualPets)
      .set({
        evolutionTier: evolutionCheck.nextTier,
        statMaxHealth: Math.floor(pet.statMaxHealth * statMultiplier),
        statMaxHappiness: Math.floor(pet.statMaxHappiness * statMultiplier),
        statMaxEnergy: Math.floor(pet.statMaxEnergy * statMultiplier),
        statHealth: Math.floor(pet.statMaxHealth * statMultiplier), // Full heal on evolution
        statHappiness: Math.floor(pet.statMaxHappiness * statMultiplier),
        statEnergy: Math.floor(pet.statMaxEnergy * statMultiplier),
        mood: 'ecstatic',
        updatedAt: new Date(),
      })
      .where(eq(virtualPets.id, petId))
      .returning();

    // Log evolution event
    await db.insert(petEvents).values({
      petId,
      memberId: pet.memberId,
      eventType: 'evolved',
      description: `${pet.name} evolved from ${pet.evolutionTier} to ${evolutionCheck.nextTier}!`,
      data: {
        previousTier: pet.evolutionTier,
        newTier: evolutionCheck.nextTier,
        statMultiplier,
      },
    });

    // Emit evolution event
    const io = fastify.io;
    if (io) {
      io.to(`household:${householdId}`).emit('pet:evolved', {
        petId,
        petName: pet.name,
        previousTier: pet.evolutionTier,
        newTier: evolutionCheck.nextTier,
      });
    }

    return reply.send({
      pet: evolved,
      previousTier: pet.evolutionTier,
      newTier: evolutionCheck.nextTier,
    });
  });

  // Equip accessory
  fastify.post('/:petId/accessories/equip', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, petId } = request.params as { householdId: string; petId: string };
    const body = equipAccessorySchema.parse(request.body);

    const pet = await getPetWithOwnership(petId, householdId);
    if (!pet) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'Pet not found',
      });
    }

    const canEdit = await verifyParentOrSelf(user.id, pet.memberId, householdId);
    if (!canEdit) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You can only customize your own pets or your children\'s',
      });
    }

    // Check accessory is unlocked
    const unlockedAccessories = pet.unlockedAccessories || [];
    if (!unlockedAccessories.includes(body.accessoryId)) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Accessory is not unlocked',
      });
    }

    // Add to equipped accessories
    const equippedAccessories = pet.equippedAccessories as string[];
    if (!equippedAccessories.includes(body.accessoryId)) {
      equippedAccessories.push(body.accessoryId);
    }

    const [updated] = await db
      .update(virtualPets)
      .set({
        equippedAccessories,
        updatedAt: new Date(),
      })
      .where(eq(virtualPets.id, petId))
      .returning();

    return reply.send(updated);
  });

  // Unequip accessory
  fastify.post('/:petId/accessories/unequip', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, petId } = request.params as { householdId: string; petId: string };
    const body = unequipAccessorySchema.parse(request.body);

    const pet = await getPetWithOwnership(petId, householdId);
    if (!pet) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'Pet not found',
      });
    }

    const canEdit = await verifyParentOrSelf(user.id, pet.memberId, householdId);
    if (!canEdit) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You can only customize your own pets or your children\'s',
      });
    }

    // Remove from equipped accessories
    const equippedAccessories = (pet.equippedAccessories as string[]).filter(
      id => id !== body.accessoryId
    );

    const [updated] = await db
      .update(virtualPets)
      .set({
        equippedAccessories,
        updatedAt: new Date(),
      })
      .where(eq(virtualPets.id, petId))
      .returning();

    return reply.send(updated);
  });

  // Activate ability
  fastify.post('/:petId/ability', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, petId } = request.params as { householdId: string; petId: string };
    const body = activateAbilitySchema.parse(request.body);

    const pet = await getPetWithOwnership(petId, householdId);
    if (!pet) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'Pet not found',
      });
    }

    const canEdit = await verifyParentOrSelf(user.id, pet.memberId, householdId);
    if (!canEdit) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You can only use abilities for your own pets or your children\'s',
      });
    }

    // Get the ability
    const [ability] = await db
      .select()
      .from(petAbilities)
      .where(eq(petAbilities.id, body.abilityId));

    if (!ability) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'Ability not found',
      });
    }

    // Check if ability is for this species
    if (ability.speciesId && ability.speciesId !== pet.speciesId) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'This ability is not available for this pet species',
      });
    }

    // Check if ability is unlocked (by tier)
    const tierOrder = ['baby', 'juvenile', 'adult', 'legendary'];
    const petTierIndex = tierOrder.indexOf(pet.evolutionTier);
    const abilityTierIndex = tierOrder.indexOf(ability.unlockTier);

    if (abilityTierIndex > petTierIndex) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: `This ability requires ${ability.unlockTier} tier or higher`,
      });
    }

    // Check cooldown
    if (pet.abilityLastUsedAt) {
      const cooldownMs = ability.cooldownHours * 60 * 60 * 1000;
      const availableAt = new Date(pet.abilityLastUsedAt.getTime() + cooldownMs);

      if (new Date() < availableAt) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Ability is on cooldown',
          availableAt,
        });
      }
    }

    // Activate the ability
    const [updated] = await db
      .update(virtualPets)
      .set({
        activeAbilityId: body.abilityId,
        abilityLastUsedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(virtualPets.id, petId))
      .returning();

    // Log ability use
    await db.insert(petEvents).values({
      petId,
      memberId: pet.memberId,
      eventType: 'ability_used',
      description: `${pet.name} used ${ability.name}!`,
      data: {
        abilityId: ability.id,
        abilityName: ability.name,
        abilityType: ability.abilityType,
        value: ability.value,
      },
    });

    // Emit ability event
    const io = fastify.io;
    if (io) {
      io.to(`household:${householdId}`).emit('pet:ability-used', {
        petId,
        petName: pet.name,
        ability,
      });
    }

    return reply.send({
      pet: updated,
      ability,
    });
  });

  // Create playdate
  fastify.post('/:petId/playdates', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, petId } = request.params as { householdId: string; petId: string };
    const body = createPlaydateSchema.parse(request.body);

    const pet = await getPetWithOwnership(petId, householdId);
    if (!pet) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'Pet not found',
      });
    }

    const canEdit = await verifyParentOrSelf(user.id, pet.memberId, householdId);
    if (!canEdit) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You can only schedule playdates for your own pets or your children\'s',
      });
    }

    // Get guest pet
    const guestPet = await getPetWithOwnership(body.guestPetId, householdId);
    if (!guestPet) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'Guest pet not found',
      });
    }

    // Can't have playdate with yourself
    if (petId === body.guestPetId) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Pet cannot have a playdate with itself',
      });
    }

    // Create the playdate
    const [playdate] = await db
      .insert(petPlaydates)
      .values({
        hostPetId: petId,
        guestPetId: body.guestPetId,
        scheduledAt: new Date(body.scheduledAt),
        status: 'pending',
      })
      .returning();

    // Log events for both pets
    await db.insert(petEvents).values([
      {
        petId,
        memberId: pet.memberId,
        eventType: 'playdate_scheduled',
        description: `Playdate scheduled with ${guestPet.name}`,
        data: { playdateId: playdate.id, guestPetId: body.guestPetId },
      },
      {
        petId: body.guestPetId,
        memberId: guestPet.memberId,
        eventType: 'playdate_scheduled',
        description: `Playdate scheduled with ${pet.name}`,
        data: { playdateId: playdate.id, hostPetId: petId },
      },
    ]);

    // Emit playdate created event
    const io = fastify.io;
    if (io) {
      io.to(`household:${householdId}`).emit('pet:playdate-scheduled', {
        playdateId: playdate.id,
        hostPet: { id: pet.id, name: pet.name },
        guestPet: { id: guestPet.id, name: guestPet.name },
        scheduledAt: playdate.scheduledAt,
      });
    }

    return reply.status(201).send(playdate);
  });

  // Complete playdate
  fastify.post('/:petId/playdates/:playdateId/complete', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, petId, playdateId } = request.params as {
      householdId: string;
      petId: string;
      playdateId: string;
    };

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You are not a member of this household',
      });
    }

    // Get playdate
    const [playdate] = await db
      .select()
      .from(petPlaydates)
      .where(and(
        eq(petPlaydates.id, playdateId),
        or(
          eq(petPlaydates.hostPetId, petId),
          eq(petPlaydates.guestPetId, petId)
        )
      ));

    if (!playdate) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'Playdate not found',
      });
    }

    if (playdate.status !== 'pending') {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Playdate is not pending',
      });
    }

    // Get both pets
    const hostPet = await getPetWithOwnership(playdate.hostPetId, householdId);
    const guestPet = await getPetWithOwnership(playdate.guestPetId, householdId);

    if (!hostPet || !guestPet) {
      return reply.status(500).send({
        error: 'Internal Error',
        message: 'Could not find pets for this playdate',
      });
    }

    // Complete the playdate and award bonus
    const now = new Date();
    const happinessBonus = 15;
    const xpBonus = 10;

    // Update playdate
    await db
      .update(petPlaydates)
      .set({
        status: 'completed',
        completedAt: now,
        bonusAwarded: true,
      })
      .where(eq(petPlaydates.id, playdateId));

    // Update host pet
    await db
      .update(virtualPets)
      .set({
        statHappiness: Math.min(hostPet.statMaxHappiness, hostPet.statHappiness + happinessBonus),
        xp: hostPet.xp + xpBonus,
        updatedAt: now,
      })
      .where(eq(virtualPets.id, hostPet.id));

    // Update guest pet
    await db
      .update(virtualPets)
      .set({
        statHappiness: Math.min(guestPet.statMaxHappiness, guestPet.statHappiness + happinessBonus),
        xp: guestPet.xp + xpBonus,
        updatedAt: now,
      })
      .where(eq(virtualPets.id, guestPet.id));

    // Log events
    await db.insert(petEvents).values([
      {
        petId: hostPet.id,
        memberId: hostPet.memberId,
        eventType: 'playdate_completed',
        description: `Had a playdate with ${guestPet.name}! +${happinessBonus} happiness, +${xpBonus} XP`,
        data: { playdateId, partnerPetId: guestPet.id, happinessBonus, xpBonus },
      },
      {
        petId: guestPet.id,
        memberId: guestPet.memberId,
        eventType: 'playdate_completed',
        description: `Had a playdate with ${hostPet.name}! +${happinessBonus} happiness, +${xpBonus} XP`,
        data: { playdateId, partnerPetId: hostPet.id, happinessBonus, xpBonus },
      },
    ]);

    // Emit event
    const io = fastify.io;
    if (io) {
      io.to(`household:${householdId}`).emit('pet:playdate-completed', {
        playdateId,
        hostPet: { id: hostPet.id, name: hostPet.name },
        guestPet: { id: guestPet.id, name: guestPet.name },
        rewards: { happinessBonus, xpBonus },
      });
    }

    return reply.send({
      completed: true,
      rewards: { happinessBonus, xpBonus },
    });
  });

  // Get pet event history
  fastify.get('/:petId/events', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, petId } = request.params as { householdId: string; petId: string };
    const { limit = 50, offset = 0 } = request.query as { limit?: number; offset?: number };

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You are not a member of this household',
      });
    }

    const events = await db
      .select()
      .from(petEvents)
      .where(eq(petEvents.petId, petId))
      .orderBy(desc(petEvents.createdAt))
      .limit(Number(limit))
      .offset(Number(offset));

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(petEvents)
      .where(eq(petEvents.petId, petId));

    return reply.send({
      events,
      total: Number(countResult?.count || 0),
      hasMore: Number(offset) + events.length < Number(countResult?.count || 0),
    });
  });

  // Get all household pets (for playdate selection, etc.)
  fastify.get('/household', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You are not a member of this household',
      });
    }

    const pets = await db
      .select({
        pet: virtualPets,
        species: petSpecies,
        member: members,
      })
      .from(virtualPets)
      .innerJoin(petSpecies, eq(virtualPets.speciesId, petSpecies.id))
      .innerJoin(members, eq(virtualPets.memberId, members.id))
      .where(and(
        eq(virtualPets.householdId, householdId),
        eq(virtualPets.isActive, true)
      ))
      .orderBy(members.name, virtualPets.name);

    return reply.send(pets.map(({ pet, species, member }) => ({
      ...pet,
      species,
      owner: {
        id: member.id,
        name: member.name,
        color: member.color,
      },
    })));
  });

  // Award XP to pet from chore completion (called internally)
  fastify.post('/:petId/award-xp', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, petId } = request.params as { householdId: string; petId: string };
    const body = z.object({
      chorePoints: z.number().int().min(1),
      streakDays: z.number().int().min(0).default(0),
    }).parse(request.body);

    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You are not a member of this household',
      });
    }

    const pet = await getPetWithOwnership(petId, householdId);
    if (!pet) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'Pet not found',
      });
    }

    // Calculate XP
    const baseXP = Math.floor(body.chorePoints * 0.5);
    const levelBonus = 1 + (pet.level * 0.01);
    const streakBonus = 1 + (Math.min(body.streakDays, 30) * 0.02);
    const xpGained = Math.floor(baseXP * levelBonus * streakBonus);

    const newXP = pet.xp + xpGained;
    const newLevel = getPetLevelFromXP(newXP);
    const leveledUp = newLevel > pet.level;

    // Check evolution
    let evolved = false;
    let newTier: string | null = null;
    if (leveledUp) {
      const evolutionCheck = canEvolve(
        pet.evolutionTier as Parameters<typeof canEvolve>[0],
        newLevel
      );
      if (evolutionCheck.canEvolve) {
        evolved = true;
        newTier = evolutionCheck.nextTier;
      }
    }

    // Update pet
    const updateData: Record<string, unknown> = {
      xp: newXP,
      level: newLevel,
      updatedAt: new Date(),
    };

    if (evolved && newTier) {
      updateData.evolutionTier = newTier;
    }

    const [updated] = await db
      .update(virtualPets)
      .set(updateData)
      .where(eq(virtualPets.id, petId))
      .returning();

    // Log event
    await db.insert(petEvents).values({
      petId,
      memberId: pet.memberId,
      eventType: 'chore_xp',
      description: `Earned ${xpGained} XP from chore completion!`,
      data: {
        chorePoints: body.chorePoints,
        streakDays: body.streakDays,
        xpGained,
        leveledUp,
        evolved,
        newTier,
      },
    });

    // Emit events
    const io = fastify.io;
    if (io) {
      if (leveledUp) {
        io.to(`household:${householdId}`).emit('pet:leveled-up', {
          petId,
          petName: pet.name,
          newLevel,
        });
      }
      if (evolved) {
        io.to(`household:${householdId}`).emit('pet:evolved', {
          petId,
          petName: pet.name,
          newTier,
        });
      }
    }

    return reply.send({
      pet: updated,
      xpGained,
      leveledUp,
      newLevel,
      evolved,
      newTier,
    });
  });

  // Release pet (soft delete)
  fastify.delete('/:petId', {
    preHandler: [requireAuth],
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId, petId } = request.params as { householdId: string; petId: string };

    const pet = await getPetWithOwnership(petId, householdId);
    if (!pet) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'Pet not found',
      });
    }

    const canEdit = await verifyParentOrSelf(user.id, pet.memberId, householdId);
    if (!canEdit) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'You can only release your own pets or your children\'s',
      });
    }

    // Soft delete
    await db
      .update(virtualPets)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(virtualPets.id, petId));

    // Log release event
    await db.insert(petEvents).values({
      petId,
      memberId: pet.memberId,
      eventType: 'released',
      description: `${pet.name} was released`,
      data: { level: pet.level, evolutionTier: pet.evolutionTier },
    });

    // Emit event
    const io = fastify.io;
    if (io) {
      io.to(`household:${householdId}`).emit('pet:released', {
        petId,
        petName: pet.name,
      });
    }

    return reply.send({ success: true });
  });
}
