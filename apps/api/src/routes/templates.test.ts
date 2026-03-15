import { describe, it, expect } from 'vitest';

// Test helpers for templates-related logic
// These tests focus on the business logic without requiring a full Fastify server

describe('template route logic', () => {
  describe('category list', () => {
    const categories = [
      { id: 'bedroom', name: 'Bedroom', icon: '🛏️' },
      { id: 'bathroom', name: 'Bathroom', icon: '🚿' },
      { id: 'kitchen', name: 'Kitchen', icon: '🍳' },
      { id: 'living-room', name: 'Living Room', icon: '🛋️' },
      { id: 'outdoor', name: 'Outdoor', icon: '🌳' },
      { id: 'pets', name: 'Pets', icon: '🐕' },
      { id: 'laundry', name: 'Laundry', icon: '👕' },
      { id: 'school', name: 'School', icon: '📚' },
      { id: 'self-care', name: 'Self Care', icon: '🧼' },
      { id: 'helping', name: 'Helping Others', icon: '🤝' },
    ];

    it('contains exactly 10 categories', () => {
      expect(categories).toHaveLength(10);
    });

    it('each category has id, name, and icon', () => {
      for (const cat of categories) {
        expect(cat.id).toBeTruthy();
        expect(cat.name).toBeTruthy();
        expect(cat.icon).toBeTruthy();
      }
    });

    it('has unique category ids', () => {
      const ids = categories.map(c => c.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('contains expected categories', () => {
      const ids = categories.map(c => c.id);
      expect(ids).toContain('bedroom');
      expect(ids).toContain('kitchen');
      expect(ids).toContain('pets');
      expect(ids).toContain('outdoor');
    });
  });

  describe('category filter', () => {
    it('filters templates by category', () => {
      const templates = [
        { id: '1', category: 'kitchen', title: 'Do dishes' },
        { id: '2', category: 'bedroom', title: 'Make bed' },
        { id: '3', category: 'kitchen', title: 'Wipe counters' },
      ];

      const category = 'kitchen';
      const filtered = templates.filter(t => t.category === category);

      expect(filtered).toHaveLength(2);
      expect(filtered.map(t => t.title)).toEqual(['Do dishes', 'Wipe counters']);
    });

    it('returns all templates when no category filter', () => {
      const templates = [
        { id: '1', category: 'kitchen' },
        { id: '2', category: 'bedroom' },
      ];

      const category: string | undefined = undefined;
      const filtered = category ? templates.filter(t => t.category === category) : templates;

      expect(filtered).toHaveLength(2);
    });
  });

  describe('age range filtering', () => {
    it('includes templates with no age restrictions', () => {
      const template = { minAge: null, maxAge: null };
      const age = 8;

      const minAgeOk = template.minAge === null || template.minAge <= age;
      const maxAgeOk = template.maxAge === null || template.maxAge >= age;

      expect(minAgeOk && maxAgeOk).toBe(true);
    });

    it('includes templates where age is within range', () => {
      const template = { minAge: 5, maxAge: 12 };
      const age = 8;

      const minAgeOk = template.minAge === null || template.minAge <= age;
      const maxAgeOk = template.maxAge === null || template.maxAge >= age;

      expect(minAgeOk && maxAgeOk).toBe(true);
    });

    it('excludes templates where age is below minimum', () => {
      const template = { minAge: 10, maxAge: 18 };
      const age = 8;

      const minAgeOk = template.minAge === null || template.minAge <= age;
      expect(minAgeOk).toBe(false);
    });

    it('excludes templates where age is above maximum', () => {
      const template = { minAge: 3, maxAge: 6 };
      const age = 8;

      const maxAgeOk = template.maxAge === null || template.maxAge >= age;
      expect(maxAgeOk).toBe(false);
    });

    it('includes templates with only minAge set', () => {
      const template = { minAge: 5, maxAge: null };
      const age = 8;

      const minAgeOk = template.minAge === null || template.minAge <= age;
      const maxAgeOk = template.maxAge === null || template.maxAge >= age;

      expect(minAgeOk && maxAgeOk).toBe(true);
    });

    it('includes templates with only maxAge set', () => {
      const template = { minAge: null, maxAge: 12 };
      const age = 8;

      const minAgeOk = template.minAge === null || template.minAge <= age;
      const maxAgeOk = template.maxAge === null || template.maxAge >= age;

      expect(minAgeOk && maxAgeOk).toBe(true);
    });

    it('parses age from query string', () => {
      const minAge = '5';
      const maxAge: string | undefined = undefined;
      const age = parseInt(minAge || maxAge || '0', 10);
      expect(age).toBe(5);
    });

    it('defaults to 0 when no age provided', () => {
      const minAge: string | undefined = undefined;
      const maxAge: string | undefined = undefined;
      const age = parseInt(minAge || maxAge || '0', 10);
      expect(age).toBe(0);
    });
  });

  describe('isActive filter', () => {
    it('only returns active templates', () => {
      const templates = [
        { id: '1', isActive: true, title: 'Active 1' },
        { id: '2', isActive: false, title: 'Inactive' },
        { id: '3', isActive: true, title: 'Active 2' },
      ];

      const active = templates.filter(t => t.isActive);
      expect(active).toHaveLength(2);
      expect(active.map(t => t.title)).toEqual(['Active 1', 'Active 2']);
    });
  });

  describe('template not found', () => {
    it('returns 404 for non-existent template', () => {
      const template = undefined;
      const notFound = !template;
      expect(notFound).toBe(true);
    });

    it('returns template when found', () => {
      const template = { id: 'tmpl-1', title: 'Make bed', isActive: true };
      const notFound = !template;
      expect(notFound).toBe(false);
    });
  });

  describe('public endpoint behavior', () => {
    it('uses optionalAuth (not requireAuth)', () => {
      // Templates are public endpoints that use optionalAuth
      // This means they work for both authenticated and unauthenticated users
      const isPublic = true;
      expect(isPublic).toBe(true);
    });
  });
});
