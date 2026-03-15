import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { chores } from '@chorechamp/database/schema';
import { db } from '../lib/db';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { verifyMembership, verifyParentMembership } from '../lib/membership';

const exportFormatSchema = z.enum(['csv', 'json']).default('json');

const importChoreSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().nullish(),
  icon: z.string().max(50).default('✅'),
  category: z.string().max(50).default('general'),
  pointValue: z.coerce.number().int().min(0).default(10),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  recurrenceType: z.enum(['once', 'daily', 'weekly', 'monthly', 'custom']).default('once'),
  estimatedMinutes: z.coerce.number().int().min(0).nullish(),
  requiresApproval: z.coerce.boolean().default(false),
  requiresPhoto: z.coerce.boolean().default(false),
});

const CSV_COLUMNS = [
  'title',
  'description',
  'icon',
  'category',
  'pointValue',
  'difficulty',
  'priority',
  'recurrenceType',
  'estimatedMinutes',
  'requiresApproval',
  'requiresPhoto',
] as const;

function escapeCSVField(value: unknown): string {
  let str = value == null ? '' : String(value);
  // Prevent CSV formula injection by prefixing dangerous leading characters
  if (str.length > 0 && /^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function choresToCSV(rows: Record<string, unknown>[]): string {
  const header = CSV_COLUMNS.join(',');
  const lines = rows.map(row =>
    CSV_COLUMNS.map(col => escapeCSVField(row[col])).join(',')
  );
  return [header, ...lines].join('\n');
}

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]);
  const results: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j].trim()] = values[j]?.trim() ?? '';
    }
    results.push(row);
  }
  return results;
}

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      fields.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields;
}

function detectFormat(content: string): 'csv' | 'json' {
  const trimmed = content.trim();
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    return 'json';
  }
  return 'csv';
}

export async function importExportRoutes(app: FastifyInstance) {
  // GET /:householdId/chores/export - Export all chores
  app.get('/:householdId/chores/export', {
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

    const query = request.query as { format?: string };
    const format = exportFormatSchema.parse(query.format);

    const allChores = await db
      .select()
      .from(chores)
      .where(eq(chores.householdId, householdId));

    if (format === 'csv') {
      const csv = choresToCSV(allChores as unknown as Record<string, unknown>[]);
      return reply
        .header('Content-Type', 'text/csv')
        .header('Content-Disposition', 'attachment; filename="chores.csv"')
        .send(csv);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const exportData = allChores.map((chore: any) => ({
      title: chore.title,
      description: chore.description,
      icon: chore.icon,
      category: chore.category,
      pointValue: chore.pointValue,
      difficulty: chore.difficulty,
      priority: chore.priority,
      recurrenceType: chore.recurrenceType,
      estimatedMinutes: chore.estimatedMinutes,
      requiresApproval: chore.requiresApproval,
      requiresPhoto: chore.requiresPhoto,
    }));

    return reply
      .header('Content-Type', 'application/json')
      .header('Content-Disposition', 'attachment; filename="chores.json"')
      .send(exportData);
  });

  // POST /:householdId/chores/import - Import chores from CSV/JSON
  app.post('/:householdId/chores/import', {
    preHandler: [requireAuth],
    bodyLimit: 1024 * 1024,
  }, async (request, reply) => {
    const { user } = request as AuthenticatedRequest;
    const { householdId } = request.params as { householdId: string };

    const isParent = await verifyParentMembership(user.id, householdId);
    if (!isParent) {
      return reply.status(403).send({
        error: 'Forbidden',
        message: 'Only parents can import chores',
      });
    }

    const { content, format: explicitFormat } = request.body as { content: string; format?: string };

    const format = explicitFormat ?? detectFormat(content);

    let rawRows: Record<string, unknown>[];
    if (format === 'csv') {
      rawRows = parseCSV(content);
    } else {
      try {
        const parsed = JSON.parse(content);
        rawRows = Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Invalid JSON format in import content',
        });
      }
    }

    let imported = 0;
    const errors: string[] = [];

    for (let i = 0; i < rawRows.length; i++) {
      const result = importChoreSchema.safeParse(rawRows[i]);
      if (!result.success) {
        const issues = result.error.issues.map(iss => iss.message).join(', ');
        errors.push(`Row ${i + 1}: ${issues}`);
        continue;
      }

      await db.insert(chores).values({
        householdId,
        title: result.data.title,
        description: result.data.description ?? null,
        icon: result.data.icon,
        category: result.data.category,
        pointValue: result.data.pointValue,
        difficulty: result.data.difficulty,
        priority: result.data.priority,
        recurrenceType: result.data.recurrenceType,
        estimatedMinutes: result.data.estimatedMinutes ?? null,
        requiresApproval: result.data.requiresApproval,
        requiresPhoto: result.data.requiresPhoto,
        createdBy: user.id,
      });

      imported++;
    }

    return reply.send({
      imported,
      skipped: rawRows.length - imported,
      errors,
    });
  });
}
