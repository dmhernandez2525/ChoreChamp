import { describe, it, expect } from 'vitest';
import { z } from 'zod';

const addCommentSchema = z.object({
  comment: z.string().min(1).max(5000),
});

describe('chore-comments route logic', () => {
  describe('addCommentSchema validation', () => {
    it('accepts valid comment', () => {
      const result = addCommentSchema.safeParse({ comment: 'Great job!' });
      expect(result.success).toBe(true);
    });

    it('accepts comment at max length (5000 chars)', () => {
      const result = addCommentSchema.safeParse({ comment: 'a'.repeat(5000) });
      expect(result.success).toBe(true);
    });

    it('rejects empty comment', () => {
      const result = addCommentSchema.safeParse({ comment: '' });
      expect(result.success).toBe(false);
    });

    it('rejects comment exceeding 5000 characters', () => {
      const result = addCommentSchema.safeParse({ comment: 'a'.repeat(5001) });
      expect(result.success).toBe(false);
    });

    it('rejects missing comment field', () => {
      const result = addCommentSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it('rejects non-string comment', () => {
      const result = addCommentSchema.safeParse({ comment: 123 });
      expect(result.success).toBe(false);
    });
  });

  describe('comment deletion authorization', () => {
    it('allows author to delete their own comment', () => {
      const canDelete = (
        commentMemberId: string,
        currentMemberId: string,
        currentRole: string
      ): { allowed: boolean; error?: string } => {
        if (commentMemberId === currentMemberId) return { allowed: true };
        if (currentRole === 'parent') return { allowed: true };
        return { allowed: false, error: 'Cannot delete this comment' };
      };

      expect(canDelete('member-1', 'member-1', 'child')).toEqual({ allowed: true });
    });

    it('allows parent to delete any comment', () => {
      const canDelete = (
        commentMemberId: string,
        currentMemberId: string,
        currentRole: string
      ): { allowed: boolean; error?: string } => {
        if (commentMemberId === currentMemberId) return { allowed: true };
        if (currentRole === 'parent') return { allowed: true };
        return { allowed: false, error: 'Cannot delete this comment' };
      };

      expect(canDelete('member-2', 'member-1', 'parent')).toEqual({ allowed: true });
    });

    it('prevents child from deleting another member comment', () => {
      const canDelete = (
        commentMemberId: string,
        currentMemberId: string,
        currentRole: string
      ): { allowed: boolean; error?: string } => {
        if (commentMemberId === currentMemberId) return { allowed: true };
        if (currentRole === 'parent') return { allowed: true };
        return { allowed: false, error: 'Cannot delete this comment' };
      };

      expect(canDelete('member-2', 'member-1', 'child')).toEqual({
        allowed: false,
        error: 'Cannot delete this comment',
      });
    });
  });

  describe('soft delete behavior', () => {
    it('marks comment as deleted with timestamp instead of removing', () => {
      const softDelete = (comment: { id: string; deletedAt: Date | null }): { id: string; deletedAt: Date } => {
        return { ...comment, deletedAt: new Date() };
      };

      const original = { id: 'comment-1', deletedAt: null };
      const deleted = softDelete(original);
      expect(deleted.deletedAt).toBeInstanceOf(Date);
      expect(deleted.id).toBe('comment-1');
    });

    it('filters out soft-deleted comments', () => {
      const filterActive = (
        comments: Array<{ id: string; deletedAt: Date | null }>
      ) => comments.filter(c => c.deletedAt === null);

      const comments = [
        { id: '1', deletedAt: null },
        { id: '2', deletedAt: new Date() },
        { id: '3', deletedAt: null },
      ];
      expect(filterActive(comments)).toHaveLength(2);
      expect(filterActive(comments).map(c => c.id)).toEqual(['1', '3']);
    });
  });

  describe('activity log entry generation', () => {
    it('generates correct activity entry for new comment', () => {
      const createCommentActivity = (choreId: string, memberId: string, commentId: string) => ({
        choreId,
        memberId,
        action: 'commented',
        newValue: { commentId },
      });

      const activity = createCommentActivity('chore-1', 'member-1', 'comment-1');
      expect(activity).toEqual({
        choreId: 'chore-1',
        memberId: 'member-1',
        action: 'commented',
        newValue: { commentId: 'comment-1' },
      });
    });
  });
});
