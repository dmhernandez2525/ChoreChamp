import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Replicate schemas and helper functions from the route for isolated testing

const exportFormatSchema = z.enum(['csv', 'json']).default('json');

const importChoreSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().nullish(),
  icon: z.string().max(50).default('\u2705'),
  category: z.string().max(50).default('general'),
  pointValue: z.coerce.number().int().min(0).default(10),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  recurrenceType: z.enum(['once', 'daily', 'weekly', 'monthly', 'custom']).default('once'),
  estimatedMinutes: z.coerce.number().int().min(0).nullish(),
  requiresApproval: z.coerce.boolean().default(false),
  requiresPhoto: z.coerce.boolean().default(false),
});

function escapeCSVField(value: unknown): string {
  let str = value == null ? '' : String(value);
  if (str.length > 0 && /^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
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

describe('import-export route logic', () => {
  describe('exportFormatSchema validation', () => {
    it('accepts csv format', () => {
      expect(exportFormatSchema.parse('csv')).toBe('csv');
    });

    it('accepts json format', () => {
      expect(exportFormatSchema.parse('json')).toBe('json');
    });

    it('defaults to json when undefined', () => {
      expect(exportFormatSchema.parse(undefined)).toBe('json');
    });

    it('rejects invalid format', () => {
      const result = exportFormatSchema.safeParse('xml');
      expect(result.success).toBe(false);
    });
  });

  describe('importChoreSchema validation', () => {
    it('accepts minimal valid chore with defaults', () => {
      const result = importChoreSchema.safeParse({ title: 'Wash dishes' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.pointValue).toBe(10);
        expect(result.data.difficulty).toBe('medium');
        expect(result.data.priority).toBe('medium');
        expect(result.data.recurrenceType).toBe('once');
        expect(result.data.category).toBe('general');
        expect(result.data.requiresApproval).toBe(false);
        expect(result.data.requiresPhoto).toBe(false);
      }
    });

    it('accepts fully specified chore', () => {
      const result = importChoreSchema.safeParse({
        title: 'Mow the lawn',
        description: 'Front and back yard',
        icon: '\uD83C\uDF3F',
        category: 'outdoor',
        pointValue: 25,
        difficulty: 'hard',
        priority: 'high',
        recurrenceType: 'weekly',
        estimatedMinutes: 45,
        requiresApproval: true,
        requiresPhoto: true,
      });
      expect(result.success).toBe(true);
    });

    it('rejects empty title', () => {
      const result = importChoreSchema.safeParse({ title: '' });
      expect(result.success).toBe(false);
    });

    it('rejects title exceeding 200 characters', () => {
      const result = importChoreSchema.safeParse({ title: 'a'.repeat(201) });
      expect(result.success).toBe(false);
    });

    it('coerces string pointValue to number', () => {
      const result = importChoreSchema.safeParse({ title: 'Test', pointValue: '15' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.pointValue).toBe(15);
      }
    });

    it('rejects negative pointValue', () => {
      const result = importChoreSchema.safeParse({ title: 'Test', pointValue: -5 });
      expect(result.success).toBe(false);
    });

    it('rejects non-integer pointValue', () => {
      const result = importChoreSchema.safeParse({ title: 'Test', pointValue: 10.5 });
      expect(result.success).toBe(false);
    });

    it('rejects invalid difficulty', () => {
      const result = importChoreSchema.safeParse({ title: 'Test', difficulty: 'extreme' });
      expect(result.success).toBe(false);
    });

    it('rejects invalid recurrenceType', () => {
      const result = importChoreSchema.safeParse({ title: 'Test', recurrenceType: 'yearly' });
      expect(result.success).toBe(false);
    });

    it('coerces boolean strings for requiresApproval', () => {
      const result = importChoreSchema.safeParse({ title: 'Test', requiresApproval: 'true' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.requiresApproval).toBe(true);
      }
    });
  });

  describe('escapeCSVField - CSV injection protection', () => {
    it('prefixes fields starting with = to prevent formula injection', () => {
      // After prefixing with ', the result is '=SUM(A1:A10)
      // No commas/quotes/newlines, so no wrapping in double quotes
      expect(escapeCSVField('=SUM(A1:A10)')).toBe("'=SUM(A1:A10)");
    });

    it('prefixes fields starting with +', () => {
      const result = escapeCSVField('+cmd');
      expect(result.startsWith("'")).toBe(true);
    });

    it('prefixes fields starting with -', () => {
      const result = escapeCSVField('-value');
      expect(result.startsWith("'")).toBe(true);
    });

    it('prefixes fields starting with @', () => {
      const result = escapeCSVField('@SUM(A1)');
      expect(result.startsWith("'")).toBe(true);
    });

    it('prefixes fields starting with tab character', () => {
      const result = escapeCSVField('\tdata');
      expect(result).toContain("'");
    });

    it('prefixes fields starting with carriage return', () => {
      const result = escapeCSVField('\rdata');
      expect(result).toContain("'");
    });

    it('returns empty string for null', () => {
      expect(escapeCSVField(null)).toBe('');
    });

    it('returns empty string for undefined', () => {
      expect(escapeCSVField(undefined)).toBe('');
    });

    it('wraps fields containing commas in quotes', () => {
      expect(escapeCSVField('hello, world')).toBe('"hello, world"');
    });

    it('escapes double quotes within fields', () => {
      expect(escapeCSVField('say "hello"')).toBe('"say ""hello"""');
    });

    it('wraps fields containing newlines in quotes', () => {
      expect(escapeCSVField('line1\nline2')).toBe('"line1\nline2"');
    });

    it('leaves plain strings unchanged', () => {
      expect(escapeCSVField('clean value')).toBe('clean value');
    });

    it('converts numbers to strings', () => {
      expect(escapeCSVField(42)).toBe('42');
    });
  });

  describe('parseCSVLine', () => {
    it('parses simple comma-separated values', () => {
      expect(parseCSVLine('a,b,c')).toEqual(['a', 'b', 'c']);
    });

    it('handles quoted fields with commas', () => {
      expect(parseCSVLine('a,"b,c",d')).toEqual(['a', 'b,c', 'd']);
    });

    it('handles escaped quotes within quoted fields', () => {
      expect(parseCSVLine('a,"say ""hi""",c')).toEqual(['a', 'say "hi"', 'c']);
    });

    it('handles empty fields', () => {
      expect(parseCSVLine('a,,c')).toEqual(['a', '', 'c']);
    });
  });

  describe('detectFormat', () => {
    it('detects JSON array', () => {
      expect(detectFormat('[{"title":"test"}]')).toBe('json');
    });

    it('detects JSON object', () => {
      expect(detectFormat('{"title":"test"}')).toBe('json');
    });

    it('detects CSV with header row', () => {
      expect(detectFormat('title,description\nTest,test desc')).toBe('csv');
    });

    it('handles leading whitespace in JSON', () => {
      expect(detectFormat('  [{"title":"test"}]')).toBe('json');
    });
  });
});
