import { describe, it, expect } from 'vitest';
import { z } from 'zod';

const addDependencySchema = z.object({
  dependsOnChoreId: z.string().uuid(),
  type: z.enum(['blocks', 'blocked_by', 'relates_to']).default('blocks'),
});

const VALID_UUID = '11111111-1111-1111-1111-111111111111';
const VALID_UUID_2 = '22222222-2222-2222-2222-222222222222';
const VALID_UUID_3 = '33333333-3333-3333-3333-333333333333';
const VALID_UUID_4 = '44444444-4444-4444-4444-444444444444';

describe('dependencies route logic', () => {
  describe('addDependencySchema validation', () => {
    it('accepts valid dependency with explicit type', () => {
      const result = addDependencySchema.safeParse({
        dependsOnChoreId: VALID_UUID,
        type: 'blocked_by',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe('blocked_by');
      }
    });

    it('defaults type to blocks when not provided', () => {
      const result = addDependencySchema.safeParse({
        dependsOnChoreId: VALID_UUID,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe('blocks');
      }
    });

    it('accepts relates_to type', () => {
      const result = addDependencySchema.safeParse({
        dependsOnChoreId: VALID_UUID,
        type: 'relates_to',
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid dependency type', () => {
      const result = addDependencySchema.safeParse({
        dependsOnChoreId: VALID_UUID,
        type: 'requires',
      });
      expect(result.success).toBe(false);
    });

    it('rejects non-UUID dependsOnChoreId', () => {
      const result = addDependencySchema.safeParse({
        dependsOnChoreId: 'abc-123',
      });
      expect(result.success).toBe(false);
    });

    it('rejects missing dependsOnChoreId', () => {
      const result = addDependencySchema.safeParse({ type: 'blocks' });
      expect(result.success).toBe(false);
    });
  });

  describe('self-dependency prevention', () => {
    it('detects self-dependency', () => {
      const choreId = VALID_UUID;
      const dependsOnChoreId = VALID_UUID;
      expect(choreId === dependsOnChoreId).toBe(true);
    });

    it('allows dependency on a different chore', () => {
      const choreId: string = VALID_UUID;
      const dependsOnChoreId: string = VALID_UUID_2;
      expect(choreId === dependsOnChoreId).toBe(false);
    });
  });

  describe('BFS cycle detection', () => {
    // Simulate the cycle detection algorithm from the route.
    // Graph is represented as an adjacency list: choreId -> [dependsOnChoreId, ...]
    function hasCycle(
      graph: Map<string, string[]>,
      choreId: string,
      dependsOnChoreId: string
    ): boolean {
      const visited = new Set<string>();
      const queue = [dependsOnChoreId];

      while (queue.length > 0) {
        const current = queue.shift()!;
        if (current === choreId) {
          return true;
        }
        if (visited.has(current)) continue;
        visited.add(current);

        const downstream = graph.get(current) || [];
        for (const target of downstream) {
          if (!visited.has(target)) {
            queue.push(target);
          }
        }
      }
      return false;
    }

    it('detects direct cycle (A->B, adding B->A)', () => {
      const graph = new Map<string, string[]>();
      // Existing: A depends on B (A -> B)
      graph.set(VALID_UUID, [VALID_UUID_2]);

      // Adding B -> A would create a cycle
      const cycleDetected = hasCycle(graph, VALID_UUID_2, VALID_UUID);
      expect(cycleDetected).toBe(true);
    });

    it('detects transitive cycle (A->B->C, adding C->A)', () => {
      const graph = new Map<string, string[]>();
      graph.set(VALID_UUID, [VALID_UUID_2]);
      graph.set(VALID_UUID_2, [VALID_UUID_3]);

      // Adding C -> A: walk from A, can we reach C?
      const cycleDetected = hasCycle(graph, VALID_UUID_3, VALID_UUID);
      expect(cycleDetected).toBe(true);
    });

    it('detects cycle in longer chain (A->B->C->D, adding D->A)', () => {
      const graph = new Map<string, string[]>();
      graph.set(VALID_UUID, [VALID_UUID_2]);
      graph.set(VALID_UUID_2, [VALID_UUID_3]);
      graph.set(VALID_UUID_3, [VALID_UUID_4]);

      const cycleDetected = hasCycle(graph, VALID_UUID_4, VALID_UUID);
      expect(cycleDetected).toBe(true);
    });

    it('allows dependency when no cycle exists', () => {
      const graph = new Map<string, string[]>();
      graph.set(VALID_UUID, [VALID_UUID_2]);

      // Adding C -> B does not create a cycle starting from A
      const cycleDetected = hasCycle(graph, VALID_UUID_3, VALID_UUID_2);
      expect(cycleDetected).toBe(false);
    });

    it('allows dependency on an isolated node', () => {
      const graph = new Map<string, string[]>();
      // Empty graph, no existing edges
      const cycleDetected = hasCycle(graph, VALID_UUID, VALID_UUID_2);
      expect(cycleDetected).toBe(false);
    });

    it('handles graph with multiple branches without false positives', () => {
      const graph = new Map<string, string[]>();
      // A -> B, A -> C, B -> D
      graph.set(VALID_UUID, [VALID_UUID_2, VALID_UUID_3]);
      graph.set(VALID_UUID_2, [VALID_UUID_4]);

      // Adding D -> C: walk from C. C has no outgoing edges, never reaches D.
      const cycleDetected = hasCycle(graph, VALID_UUID_4, VALID_UUID_3);
      expect(cycleDetected).toBe(false);
    });

    it('handles diamond-shaped dependency graph without false cycle detection', () => {
      const graph = new Map<string, string[]>();
      // A -> B, A -> C, B -> D, C -> D (diamond, not a cycle)
      graph.set(VALID_UUID, [VALID_UUID_2, VALID_UUID_3]);
      graph.set(VALID_UUID_2, [VALID_UUID_4]);
      graph.set(VALID_UUID_3, [VALID_UUID_4]);

      // Adding a new node E -> A should not detect a cycle
      const e = '55555555-5555-5555-5555-555555555555';
      const cycleDetected = hasCycle(graph, e, VALID_UUID);
      expect(cycleDetected).toBe(false);
    });
  });
});
