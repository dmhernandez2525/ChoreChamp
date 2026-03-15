// Smart Home Hub Integration Routes (F10.1)

import { FastifyInstance } from 'fastify';
import { eq, and, desc, sql } from 'drizzle-orm';
import { db } from '@chorechamp/database';
import {
  smartHomeHubs,
  smartDevices,
  smartHomeAutomations,
  automationLogs,
  choreZoneDevices,
  deviceActivityLogs,
} from '@chorechamp/database/schema';
import type {
  SmartHomePlatform,
  DeviceCategory,
  ConnectionStatus,
  HubConfiguration,
  DeviceState,
  DeviceCommand,
  AutomationTrigger,
  AutomationCondition,
  AutomationAction,
  ActionExecutionResult,
} from '@chorechamp/types';

// Supported platforms configuration
const PLATFORM_CONFIG: Record<SmartHomePlatform, {
  name: string;
  description: string;
  requiresUrl: boolean;
  requiresToken: boolean;
  capabilities: string[];
}> = {
  home_assistant: {
    name: 'Home Assistant',
    description: 'Open-source home automation platform',
    requiresUrl: true,
    requiresToken: true,
    capabilities: ['devices', 'automations', 'scenes', 'scripts'],
  },
  smartthings: {
    name: 'Samsung SmartThings',
    description: 'Samsung smart home ecosystem',
    requiresUrl: false,
    requiresToken: true,
    capabilities: ['devices', 'scenes', 'routines'],
  },
  google_home: {
    name: 'Google Home',
    description: 'Google smart home platform',
    requiresUrl: false,
    requiresToken: true,
    capabilities: ['devices', 'routines'],
  },
  amazon_alexa: {
    name: 'Amazon Alexa',
    description: 'Amazon smart home platform',
    requiresUrl: false,
    requiresToken: true,
    capabilities: ['devices', 'routines', 'skills'],
  },
  apple_homekit: {
    name: 'Apple HomeKit',
    description: 'Apple smart home ecosystem',
    requiresUrl: false,
    requiresToken: true,
    capabilities: ['devices', 'scenes', 'automations'],
  },
  hubitat: {
    name: 'Hubitat Elevation',
    description: 'Local-first home automation hub',
    requiresUrl: true,
    requiresToken: true,
    capabilities: ['devices', 'apps', 'rules'],
  },
  generic_mqtt: {
    name: 'MQTT Broker',
    description: 'Generic MQTT-based devices',
    requiresUrl: true,
    requiresToken: false,
    capabilities: ['devices', 'publish', 'subscribe'],
  },
  custom_webhook: {
    name: 'Custom Webhook',
    description: 'HTTP webhook integration',
    requiresUrl: true,
    requiresToken: false,
    capabilities: ['webhook'],
  },
};

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { verifyMembership } from '../lib/membership';

const ENCRYPTION_KEY = process.env.SMART_HOME_ENCRYPTION_KEY;
const ALGORITHM = 'aes-256-gcm';

if (!ENCRYPTION_KEY && process.env.NODE_ENV === 'production') {
  throw new Error('SMART_HOME_ENCRYPTION_KEY environment variable is required in production');
}

function getKey(salt: string): Buffer {
  return scryptSync(ENCRYPTION_KEY || 'dev-only-insecure-key-not-for-prod', salt, 32);
}

function encryptCredentials(config: HubConfiguration): string {
  const iv = randomBytes(16);
  const salt = randomBytes(16);
  const key = getKey(salt.toString('hex'));
  const cipher = createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(JSON.stringify(config), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${salt.toString('hex')}:${iv.toString('hex')}:${authTag}:${encrypted}`;
}

function decryptCredentials(encrypted: string): HubConfiguration {
  const [saltHex, ivHex, authTagHex, data] = encrypted.split(':');
  if (!saltHex || !ivHex || !authTagHex || !data) {
    throw new Error('Invalid encrypted credential format');
  }
  const key = getKey(saltHex);
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  let decrypted = decipher.update(data, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return JSON.parse(decrypted);
}

// Mock device sync (replace with actual API calls in production)
async function syncDevicesFromHub(
  hubId: string,
  _householdId: string,
  _platform: SmartHomePlatform,
  _config: HubConfiguration
): Promise<{
  devices: Array<{
    externalId: string;
    name: string;
    category: DeviceCategory;
    manufacturer: string | null;
    model: string | null;
    capabilities: string[];
    state: DeviceState;
  }>;
}> {
  // In production, this would call the actual smart home API
  // For now, return mock devices
  return {
    devices: [
      {
        externalId: `${hubId}-light-1`,
        name: 'Living Room Light',
        category: 'light',
        manufacturer: 'Philips',
        model: 'Hue A19',
        capabilities: ['on_off', 'brightness', 'color'],
        state: { power: 'off', brightness: 100, lastUpdated: new Date() },
      },
      {
        externalId: `${hubId}-switch-1`,
        name: 'Kitchen Switch',
        category: 'switch',
        manufacturer: 'Generic',
        model: 'Smart Switch',
        capabilities: ['on_off'],
        state: { power: 'off', lastUpdated: new Date() },
      },
      {
        externalId: `${hubId}-vacuum-1`,
        name: 'Robot Vacuum',
        category: 'vacuum',
        manufacturer: 'iRobot',
        model: 'Roomba i7',
        capabilities: ['vacuum_control', 'battery'],
        state: { vacuumState: 'idle', battery: 85, lastUpdated: new Date() },
      },
      {
        externalId: `${hubId}-sensor-1`,
        name: 'Motion Sensor - Hallway',
        category: 'sensor',
        manufacturer: 'Aqara',
        model: 'Motion Sensor',
        capabilities: ['motion', 'battery'],
        state: { motion: false, battery: 92, lastUpdated: new Date() },
      },
    ],
  };
}

// Mock device control (replace with actual API calls in production)
async function controlDevice(
  _deviceId: string,
  _externalId: string,
  _platform: SmartHomePlatform,
  _config: HubConfiguration,
  command: DeviceCommand
): Promise<{ success: boolean; newState: DeviceState; error?: string }> {
  // In production, this would call the actual smart home API
  // For now, simulate success
  const newState: DeviceState = { lastUpdated: new Date() };

  switch (command.type) {
    case 'set_power':
      newState.power = command.parameters.power as 'on' | 'off';
      break;
    case 'set_brightness':
      newState.brightness = command.parameters.brightness as number;
      break;
    case 'vacuum_start':
      newState.vacuumState = 'cleaning';
      break;
    case 'vacuum_stop':
      newState.vacuumState = 'idle';
      break;
    default:
      // Custom command
      break;
  }

  return { success: true, newState };
}

export async function smartHomeRoutes(app: FastifyInstance) {
  // Get supported platforms
  app.get('/platforms', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const platforms = Object.entries(PLATFORM_CONFIG).map(([id, config]) => ({
      id,
      ...config,
    }));
    return reply.send({ platforms });
  });

  // Get all hubs for household
  app.get('/hubs', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const hubs = await db
      .select()
      .from(smartHomeHubs)
      .where(
        and(
          eq(smartHomeHubs.householdId, householdId),
          eq(smartHomeHubs.isActive, true)
        )
      )
      .orderBy(desc(smartHomeHubs.createdAt));

    // Don't include encrypted credentials in response
    const sanitizedHubs = hubs.map(hub => ({
      id: hub.id,
      householdId: hub.householdId,
      platform: hub.platform,
      name: hub.name,
      description: hub.description,
      hostUrl: hub.hostUrl,
      status: hub.status as ConnectionStatus,
      lastConnectedAt: hub.lastConnectedAt,
      lastError: hub.lastError,
      capabilities: hub.capabilities,
      metadata: hub.metadata,
      isActive: hub.isActive,
      createdAt: hub.createdAt,
      updatedAt: hub.updatedAt,
    }));

    return reply.send({ hubs: sanitizedHubs });
  });

  // Connect a new hub
  app.post('/hubs', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const { platform, name, description, configuration } = request.body as {
      platform: SmartHomePlatform;
      name: string;
      description?: string;
      configuration: HubConfiguration;
    };

    // Validate platform
    if (!PLATFORM_CONFIG[platform]) {
      return reply.status(400).send({ error: 'Unsupported platform' });
    }

    const platformConfig = PLATFORM_CONFIG[platform];

    // Encrypt credentials
    const encryptedCreds = encryptCredentials(configuration);

    // Create hub
    const [hub] = await db
      .insert(smartHomeHubs)
      .values({
        householdId,
        platform,
        name,
        description: description || null,
        hostUrl: configuration.hostUrl || null,
        encryptedCredentials: encryptedCreds,
        status: 'pending',
        capabilities: platformConfig.capabilities,
        metadata: {},
      })
      .returning();

    // Try to sync devices
    try {
      const { devices } = await syncDevicesFromHub(hub.id, householdId, platform, configuration);

      // Insert devices
      if (devices.length > 0) {
        await db.insert(smartDevices).values(
          devices.map(d => ({
            hubId: hub.id,
            householdId,
            externalId: d.externalId,
            name: d.name,
            category: d.category,
            manufacturer: d.manufacturer,
            model: d.model,
            capabilities: d.capabilities,
            currentState: d.state,
            isOnline: true,
            lastSeenAt: new Date(),
          }))
        );
      }

      // Update hub status
      await db
        .update(smartHomeHubs)
        .set({
          status: 'connected',
          lastConnectedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(smartHomeHubs.id, hub.id));

      // Get inserted devices
      const insertedDevices = await db
        .select()
        .from(smartDevices)
        .where(eq(smartDevices.hubId, hub.id));

      return reply.send({
        hub: {
          ...hub,
          status: 'connected',
          lastConnectedAt: new Date(),
          encryptedCredentials: undefined,
        },
        devices: insertedDevices,
      });
    } catch (error) {
      // Update hub with error
      await db
        .update(smartHomeHubs)
        .set({
          status: 'error',
          lastError: error instanceof Error ? error.message : 'Connection failed',
          updatedAt: new Date(),
        })
        .where(eq(smartHomeHubs.id, hub.id));

      return reply.status(500).send({
        hub: {
          ...hub,
          status: 'error',
          lastError: error instanceof Error ? error.message : 'Connection failed',
        },
        devices: [],
        error: 'Failed to connect to hub',
      });
    }
  });

  // Sync devices from hub
  app.post('/hubs/:hubId/sync', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const { hubId } = request.params as { hubId: string };

    // Get hub
    const [hub] = await db
      .select()
      .from(smartHomeHubs)
      .where(eq(smartHomeHubs.id, hubId));

    if (!hub) {
      return reply.status(404).send({ error: 'Hub not found' });
    }

    const config = hub.encryptedCredentials
      ? decryptCredentials(hub.encryptedCredentials)
      : {} as HubConfiguration;

    // Sync devices
    const { devices } = await syncDevicesFromHub(
      hub.id,
      hub.householdId,
      hub.platform as SmartHomePlatform,
      config
    );

    // Get existing devices
    const existingDevices = await db
      .select()
      .from(smartDevices)
      .where(eq(smartDevices.hubId, hubId));

    const existingMap = new Map(existingDevices.map(d => [d.externalId, d]));

    const devicesAdded: typeof existingDevices = [];
    const devicesUpdated: typeof existingDevices = [];
    const devicesRemoved: string[] = [];

    // Process synced devices
    for (const device of devices) {
      const existing = existingMap.get(device.externalId);

      if (existing) {
        // Update existing device
        const [updated] = await db
          .update(smartDevices)
          .set({
            name: device.name,
            capabilities: device.capabilities,
            currentState: device.state,
            isOnline: true,
            lastSeenAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(smartDevices.id, existing.id))
          .returning();

        devicesUpdated.push(updated);
        existingMap.delete(device.externalId);
      } else {
        // Add new device
        const [added] = await db
          .insert(smartDevices)
          .values({
            hubId: hub.id,
            householdId: hub.householdId,
            externalId: device.externalId,
            name: device.name,
            category: device.category,
            manufacturer: device.manufacturer,
            model: device.model,
            capabilities: device.capabilities,
            currentState: device.state,
            isOnline: true,
            lastSeenAt: new Date(),
          })
          .returning();

        devicesAdded.push(added);
      }
    }

    // Mark missing devices as offline
    for (const [externalId, device] of existingMap) {
      await db
        .update(smartDevices)
        .set({
          isOnline: false,
          updatedAt: new Date(),
        })
        .where(eq(smartDevices.id, device.id));

      devicesRemoved.push(externalId);
    }

    // Update hub status
    await db
      .update(smartHomeHubs)
      .set({
        status: 'connected',
        lastConnectedAt: new Date(),
        lastError: null,
        updatedAt: new Date(),
      })
      .where(eq(smartHomeHubs.id, hubId));

    return reply.send({
      devicesAdded,
      devicesUpdated,
      devicesRemoved,
    });
  });

  // Disconnect/remove hub
  app.delete('/hubs/:hubId', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const { hubId } = request.params as { hubId: string };

    // Soft delete hub and devices
    await db
      .update(smartHomeHubs)
      .set({
        isActive: false,
        status: 'disconnected',
        updatedAt: new Date(),
      })
      .where(eq(smartHomeHubs.id, hubId));

    await db
      .update(smartDevices)
      .set({ isActive: false })
      .where(eq(smartDevices.hubId, hubId));

    return reply.send({ success: true });
  });

  // Get all devices for household
  app.get('/devices', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const { category, zone, hubId } = request.query as {
      category?: string;
      zone?: string;
      hubId?: string;
    };

    const query = db
      .select()
      .from(smartDevices)
      .where(
        and(
          eq(smartDevices.householdId, householdId),
          eq(smartDevices.isActive, true)
        )
      );

    // Note: Additional filters would be applied in a more complex query
    const devices = await query.orderBy(smartDevices.name);

    // Filter in memory for simplicity
    let filtered = devices;
    if (category) {
      filtered = filtered.filter(d => d.category === category);
    }
    if (zone) {
      filtered = filtered.filter(d => d.choreRelatedZone === zone);
    }
    if (hubId) {
      filtered = filtered.filter(d => d.hubId === hubId);
    }

    return reply.send({ devices: filtered });
  });

  // Control a device
  app.post('/devices/:deviceId/control', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const { deviceId } = request.params as { deviceId: string };
    const { command } = request.body as { command: DeviceCommand };

    // Get device and hub
    const [device] = await db
      .select()
      .from(smartDevices)
      .where(eq(smartDevices.id, deviceId));

    if (!device) {
      return reply.status(404).send({ error: 'Device not found' });
    }

    const [hub] = await db
      .select()
      .from(smartHomeHubs)
      .where(eq(smartHomeHubs.id, device.hubId));

    if (!hub) {
      return reply.status(404).send({ error: 'Hub not found' });
    }

    const config = hub.encryptedCredentials
      ? decryptCredentials(hub.encryptedCredentials)
      : {} as HubConfiguration;

    const previousState = device.currentState as DeviceState;

    // Execute command
    const result = await controlDevice(
      device.id,
      device.externalId,
      hub.platform as SmartHomePlatform,
      config,
      command
    );

    if (result.success) {
      // Update device state
      await db
        .update(smartDevices)
        .set({
          currentState: result.newState,
          updatedAt: new Date(),
        })
        .where(eq(smartDevices.id, deviceId));

      // Log activity
      await db.insert(deviceActivityLogs).values({
        deviceId,
        householdId: device.householdId,
        activityType: 'state_change',
        previousState,
        newState: result.newState,
      });

      const [updatedDevice] = await db
        .select()
        .from(smartDevices)
        .where(eq(smartDevices.id, deviceId));

      return reply.send({
        success: true,
        device: updatedDevice,
        previousState,
        newState: result.newState,
      });
    } else {
      return reply.status(500).send({
        success: false,
        error: result.error || 'Failed to control device',
      });
    }
  });

  // Update device zone mapping
  app.patch('/devices/:deviceId', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const { deviceId } = request.params as { deviceId: string };
    const updates = request.body as {
      name?: string;
      location?: string;
      choreRelatedZone?: string;
    };

    const [updated] = await db
      .update(smartDevices)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(smartDevices.id, deviceId))
      .returning();

    return reply.send({ device: updated });
  });

  // --- Automations ---

  // Get all automations
  app.get('/automations', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }

    const automations = await db
      .select()
      .from(smartHomeAutomations)
      .where(eq(smartHomeAutomations.householdId, householdId))
      .orderBy(desc(smartHomeAutomations.createdAt));

    return reply.send({ automations });
  });

  // Create automation
  app.post('/automations', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const { name, description, trigger, conditions, actions } = request.body as {
      name: string;
      description?: string;
      trigger: AutomationTrigger;
      conditions?: AutomationCondition[];
      actions: AutomationAction[];
    };

    const [automation] = await db
      .insert(smartHomeAutomations)
      .values({
        householdId,
        name,
        description: description || null,
        trigger,
        conditions: conditions || [],
        actions,
      })
      .returning();

    return reply.send({ automation });
  });

  // Update automation
  app.patch('/automations/:automationId', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const { automationId } = request.params as { automationId: string };
    const updates = request.body as {
      name?: string;
      description?: string;
      isEnabled?: boolean;
      trigger?: AutomationTrigger;
      conditions?: AutomationCondition[];
      actions?: AutomationAction[];
    };

    const [updated] = await db
      .update(smartHomeAutomations)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(smartHomeAutomations.id, automationId))
      .returning();

    return reply.send({ automation: updated });
  });

  // Delete automation
  app.delete('/automations/:automationId', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const { automationId } = request.params as { automationId: string };

    await db
      .delete(smartHomeAutomations)
      .where(eq(smartHomeAutomations.id, automationId));

    return reply.send({ success: true });
  });

  // Test automation (dry run)
  app.post('/automations/:automationId/test', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const { automationId } = request.params as { automationId: string };
    const { mockTriggerData } = request.body as { mockTriggerData?: Record<string, unknown> };

    const [automation] = await db
      .select()
      .from(smartHomeAutomations)
      .where(eq(smartHomeAutomations.id, automationId));

    if (!automation) {
      return reply.status(404).send({ error: 'Automation not found' });
    }

    // Evaluate conditions (mock evaluation)
    const conditions = automation.conditions as AutomationCondition[];
    const conditionsResult = conditions.map(condition => ({
      condition,
      passed: true, // In production, actually evaluate
      reason: 'Mock evaluation passed',
    }));

    const wouldTrigger = conditionsResult.every(c => c.passed);

    // Preview actions
    const actions = automation.actions as AutomationAction[];
    const actionsPreview = actions.map(action => ({
      action,
      description: `Would execute ${action.type} action`,
    }));

    return reply.send({
      wouldTrigger,
      conditionsResult,
      actionsPreview,
      mockTriggerData,
    });
  });

  // Manually trigger automation
  app.post('/automations/:automationId/trigger', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const { automationId } = request.params as { automationId: string };
    const { triggerData } = request.body as { triggerData?: Record<string, unknown> };

    const [automation] = await db
      .select()
      .from(smartHomeAutomations)
      .where(eq(smartHomeAutomations.id, automationId));

    if (!automation) {
      return reply.status(404).send({ error: 'Automation not found' });
    }

    if (!automation.isEnabled) {
      return reply.status(400).send({ error: 'Automation is disabled' });
    }

    // Execute actions
    const actions = automation.actions as AutomationAction[];
    const results: ActionExecutionResult[] = [];

    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];

      try {
        // Handle delay
        if (action.delay) {
          await new Promise(resolve => setTimeout(resolve, action.delay));
        }

        // Execute action (mock for now)
        results.push({
          actionIndex: i,
          actionType: action.type,
          status: 'success',
          result: { executed: true },
          executedAt: new Date(),
        });
      } catch (error) {
        results.push({
          actionIndex: i,
          actionType: action.type,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          executedAt: new Date(),
        });
      }
    }

    const hasFailures = results.some(r => r.status === 'failed');
    const allFailed = results.every(r => r.status === 'failed');

    // Log execution
    await db.insert(automationLogs).values({
      automationId,
      householdId: automation.householdId,
      triggerData: triggerData || {},
      actionsExecuted: results,
      status: allFailed ? 'failed' : hasFailures ? 'partial' : 'success',
    });

    // Update automation stats
    await db
      .update(smartHomeAutomations)
      .set({
        lastTriggeredAt: new Date(),
        triggerCount: sql`trigger_count + 1`,
        updatedAt: new Date(),
      })
      .where(eq(smartHomeAutomations.id, automationId));

    return reply.send({
      success: !allFailed,
      results,
      status: allFailed ? 'failed' : hasFailures ? 'partial' : 'success',
    });
  });

  // Get automation logs
  app.get('/automations/:automationId/logs', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    try {
      const { automationId } = request.params as { automationId: string };
      const { limit } = request.query as { limit?: string };

      // Validate pagination
      const MAX_LIMIT = 100;
      const DEFAULT_LIMIT = 50;
      const limitNum = Math.min(
        Math.max(1, parseInt(limit || String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT),
        MAX_LIMIT
      );

      const logs = await db
        .select()
        .from(automationLogs)
        .where(eq(automationLogs.automationId, automationId))
        .orderBy(desc(automationLogs.triggeredAt))
        .limit(limitNum);

      return reply.send({ logs, limit: limitNum });
    } catch (error) {
      app.log.error(error, 'Failed to fetch automation logs');
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to fetch automation logs',
      });
    }
  });

  // --- Zone Management ---

  // Get chore zones
  app.get('/zones', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }

    const zones = await db
      .select()
      .from(choreZoneDevices)
      .where(
        and(
          eq(choreZoneDevices.householdId, householdId),
          eq(choreZoneDevices.isActive, true)
        )
      );

    return reply.send({ zones });
  });

  // Create/update zone
  app.post('/zones', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const { zoneName, deviceIds, choreCategories } = request.body as {
      zoneName: string;
      deviceIds: string[];
      choreCategories: string[];
    };

    // Check if zone exists
    const [existing] = await db
      .select()
      .from(choreZoneDevices)
      .where(
        and(
          eq(choreZoneDevices.householdId, householdId),
          eq(choreZoneDevices.zoneName, zoneName)
        )
      );

    if (existing) {
      // Update existing
      const [updated] = await db
        .update(choreZoneDevices)
        .set({
          deviceIds,
          choreCategories,
        })
        .where(eq(choreZoneDevices.id, existing.id))
        .returning();

      return reply.send({ zone: updated });
    } else {
      // Create new
      const [zone] = await db
        .insert(choreZoneDevices)
        .values({
          householdId,
          zoneName,
          deviceIds,
          choreCategories,
        })
        .returning();

      return reply.send({ zone });
    }
  });

  // Delete zone
  app.delete('/zones/:zoneId', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }
    const { zoneId } = request.params as { zoneId: string };

    await db
      .update(choreZoneDevices)
      .set({ isActive: false })
      .where(eq(choreZoneDevices.id, zoneId));

    return reply.send({ success: true });
  });

  // --- Overview ---

  // Get smart home overview
  app.get('/overview', { preHandler: [requireAuth] }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };
    const membership = await verifyMembership(user.id, householdId);
    if (!membership) {
      return reply.status(403).send({ error: 'Forbidden', message: 'Not a member of this household' });
    }

    // Get hubs
    const hubs = await db
      .select()
      .from(smartHomeHubs)
      .where(
        and(
          eq(smartHomeHubs.householdId, householdId),
          eq(smartHomeHubs.isActive, true)
        )
      );

    // Get device counts
    const devices = await db
      .select()
      .from(smartDevices)
      .where(
        and(
          eq(smartDevices.householdId, householdId),
          eq(smartDevices.isActive, true)
        )
      );

    const totalDevices = devices.length;
    const onlineDevices = devices.filter(d => d.isOnline).length;
    const choreRelatedDevices = devices.filter(d => d.choreRelatedZone).length;

    // Get automation count
    const [automationCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(smartHomeAutomations)
      .where(
        and(
          eq(smartHomeAutomations.householdId, householdId),
          eq(smartHomeAutomations.isEnabled, true)
        )
      );

    // Get recent activity
    const recentActivity = await db
      .select()
      .from(deviceActivityLogs)
      .where(eq(deviceActivityLogs.householdId, householdId))
      .orderBy(desc(deviceActivityLogs.detectedAt))
      .limit(10);

    return reply.send({
      hubs: hubs.map(h => ({
        ...h,
        encryptedCredentials: undefined,
      })),
      totalDevices,
      onlineDevices,
      activeAutomations: automationCount?.count || 0,
      recentActivity,
      choreRelatedDevices,
    });
  });
}
