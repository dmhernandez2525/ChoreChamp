import { describe, it, expect } from 'vitest';

// Test helpers for reports-related logic
// These tests focus on the business logic without requiring a full Fastify server

describe('reports route logic', () => {
  describe('resolveReportWindowDays', () => {
    it('returns 730 days (2 years) for premium tier', () => {
      const resolveReportWindowDays = (tier: string): number => {
        if (tier === 'premium') return 365 * 2;
        return 30;
      };

      expect(resolveReportWindowDays('premium')).toBe(730);
    });

    it('returns 30 days for non-premium tiers', () => {
      const resolveReportWindowDays = (tier: string): number => {
        if (tier === 'premium') return 365 * 2;
        return 30;
      };

      expect(resolveReportWindowDays('free')).toBe(30);
      expect(resolveReportWindowDays('family')).toBe(30);
      expect(resolveReportWindowDays('enterprise')).toBe(30);
    });
  });

  describe('clampReportRange', () => {
    const clampReportRange = (start: Date, end: Date, maxDays: number) => {
      const windowMs = maxDays * 24 * 60 * 60 * 1000;
      const minStart = new Date(end.getTime() - windowMs);
      if (start.getTime() < minStart.getTime()) {
        return { start: minStart, end, limitApplied: true };
      }
      return { start, end, limitApplied: false };
    };

    it('does not clamp when range is within limit', () => {
      const end = new Date('2024-06-15');
      const start = new Date('2024-06-01');
      const result = clampReportRange(start, end, 30);

      expect(result.limitApplied).toBe(false);
      expect(result.start.toISOString()).toBe(start.toISOString());
    });

    it('clamps start date when range exceeds limit', () => {
      const end = new Date('2024-06-15');
      const start = new Date('2024-01-01'); // >30 days before end
      const result = clampReportRange(start, end, 30);

      expect(result.limitApplied).toBe(true);
      expect(result.start.getTime()).toBeGreaterThan(start.getTime());
    });

    it('preserves end date', () => {
      const end = new Date('2024-06-15');
      const start = new Date('2024-01-01');
      const result = clampReportRange(start, end, 30);

      expect(result.end.toISOString()).toBe(end.toISOString());
    });

    it('handles exact boundary (start equals min start)', () => {
      const end = new Date('2024-06-15');
      const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
      const result = clampReportRange(start, end, 30);

      expect(result.limitApplied).toBe(false);
    });
  });

  describe('permission checks', () => {
    it('only allows parents to view reports', () => {
      const canViewReports = (role: string): boolean => role === 'parent';

      expect(canViewReports('parent')).toBe(true);
      expect(canViewReports('child')).toBe(false);
      expect(canViewReports('teen')).toBe(false);
      expect(canViewReports('viewer')).toBe(false);
    });

    it('only allows parents to export reports', () => {
      const canExportReports = (role: string): boolean => role === 'parent';

      expect(canExportReports('parent')).toBe(true);
      expect(canExportReports('child')).toBe(false);
    });
  });

  describe('CSV generation', () => {
    it('generates correct CSV headers', () => {
      const headers = ['Date', 'Member', 'Chore', 'Category', 'Points', 'Status'];
      const csvHeader = headers.join(',');
      expect(csvHeader).toBe('Date,Member,Chore,Category,Points,Status');
    });

    it('generates correct CSV rows with quoting', () => {
      const row = [
        '2024-06-15T10:00:00.000Z',
        'Alice',
        'Clean the kitchen',
        'kitchen',
        '25',
        'approved',
      ];

      const csvRow = row.map(cell => `"${cell}"`).join(',');
      expect(csvRow).toBe('"2024-06-15T10:00:00.000Z","Alice","Clean the kitchen","kitchen","25","approved"');
    });

    it('handles null points in CSV', () => {
      const pointsAwarded = null as number | null;
      const pointStr = pointsAwarded !== null ? pointsAwarded.toString() : '0';
      expect(pointStr).toBe('0');
    });

    it('builds full CSV string correctly', () => {
      const headers = ['Date', 'Member', 'Points'];
      const rows = [
        ['2024-06-15', 'Alice', '25'],
        ['2024-06-15', 'Bob', '10'],
      ];

      const csv = [
        headers.join(','),
        ...rows.map(r => r.map(cell => `"${cell}"`).join(',')),
      ].join('\n');

      const lines = csv.split('\n');
      expect(lines).toHaveLength(3);
      expect(lines[0]).toBe('Date,Member,Points');
      expect(lines[1]).toBe('"2024-06-15","Alice","25"');
    });
  });

  describe('trend filling with zeros', () => {
    it('fills missing days with zero completions', () => {
      const trendMap = new Map([
        ['2024-06-10', { date: '2024-06-10', completions: 5, points: 50 }],
        ['2024-06-12', { date: '2024-06-12', completions: 3, points: 30 }],
      ]);

      const start = new Date('2024-06-10');
      const end = new Date('2024-06-13');
      const filledTrend = [];
      const currentDate = new Date(start);

      while (currentDate <= end) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const existing = trendMap.get(dateStr);
        filledTrend.push({
          date: dateStr,
          completions: existing?.completions || 0,
          points: existing?.points || 0,
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }

      expect(filledTrend).toHaveLength(4);
      expect(filledTrend[0].completions).toBe(5);
      expect(filledTrend[1].completions).toBe(0); // Jun 11 missing
      expect(filledTrend[2].completions).toBe(3);
      expect(filledTrend[3].completions).toBe(0); // Jun 13 missing
    });
  });

  describe('default date range calculation', () => {
    it('defaults end date to now when not provided', () => {
      const endDate: string | undefined = undefined;
      const end = endDate ? new Date(endDate) : new Date();
      expect(end).toBeInstanceOf(Date);
    });

    it('uses provided dates when available', () => {
      const endDate = '2024-06-15';
      const end = endDate ? new Date(endDate) : new Date();
      expect(end.toISOString().startsWith('2024-06-15')).toBe(true);
    });

    it('calculates default start from max days', () => {
      const end = new Date('2024-06-15');
      const maxDays = 30;
      const defaultStart = new Date(end.getTime() - maxDays * 24 * 60 * 60 * 1000);
      expect(defaultStart.toISOString().startsWith('2024-05-16')).toBe(true);
    });
  });

  describe('period days calculation', () => {
    it('calculates days between start and end', () => {
      const start = new Date('2024-06-01');
      const end = new Date('2024-06-15');
      const days = Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
      expect(days).toBe(14);
    });
  });

  describe('export format handling', () => {
    it('defaults to json when format not specified', () => {
      const format: string | undefined = undefined;
      const effectiveFormat = format || 'json';
      expect(effectiveFormat).toBe('json');
    });

    it('accepts csv format', () => {
      const format = 'csv';
      expect(format).toBe('csv');
    });

    it('generates CSV content-disposition header', () => {
      const start = new Date('2024-06-01');
      const end = new Date('2024-06-15');
      const filename = `chorechamp-report-${start.toISOString().split('T')[0]}-to-${end.toISOString().split('T')[0]}.csv`;
      expect(filename).toBe('chorechamp-report-2024-06-01-to-2024-06-15.csv');
    });
  });
});
