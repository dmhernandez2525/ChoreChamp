import { describe, it, expect } from 'vitest';
import { z } from 'zod';

const addAttachmentSchema = z.object({
  fileName: z.string().min(1).max(500),
  fileUrl: z.string().url(),
  fileSize: z.number().min(0).default(0),
  mimeType: z.string().max(100).optional(),
  isPhotoProof: z.boolean().default(false),
});

describe('chore-attachments route logic', () => {
  describe('addAttachmentSchema validation', () => {
    it('accepts valid attachment with all fields', () => {
      const result = addAttachmentSchema.safeParse({
        fileName: 'photo.jpg',
        fileUrl: 'https://cdn.example.com/uploads/photo.jpg',
        fileSize: 1024000,
        mimeType: 'image/jpeg',
        isPhotoProof: true,
      });
      expect(result.success).toBe(true);
    });

    it('accepts minimal valid input with defaults', () => {
      const result = addAttachmentSchema.safeParse({
        fileName: 'document.pdf',
        fileUrl: 'https://example.com/doc.pdf',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.fileSize).toBe(0);
        expect(result.data.isPhotoProof).toBe(false);
        expect(result.data.mimeType).toBeUndefined();
      }
    });

    it('rejects empty fileName', () => {
      const result = addAttachmentSchema.safeParse({
        fileName: '',
        fileUrl: 'https://example.com/file.txt',
      });
      expect(result.success).toBe(false);
    });

    it('rejects fileName exceeding 500 characters', () => {
      const result = addAttachmentSchema.safeParse({
        fileName: 'a'.repeat(501),
        fileUrl: 'https://example.com/file.txt',
      });
      expect(result.success).toBe(false);
    });

    it('rejects invalid URL', () => {
      const result = addAttachmentSchema.safeParse({
        fileName: 'file.txt',
        fileUrl: 'not-a-url',
      });
      expect(result.success).toBe(false);
    });

    it('rejects negative fileSize', () => {
      const result = addAttachmentSchema.safeParse({
        fileName: 'file.txt',
        fileUrl: 'https://example.com/file.txt',
        fileSize: -1,
      });
      expect(result.success).toBe(false);
    });

    it('accepts zero fileSize', () => {
      const result = addAttachmentSchema.safeParse({
        fileName: 'file.txt',
        fileUrl: 'https://example.com/file.txt',
        fileSize: 0,
      });
      expect(result.success).toBe(true);
    });

    it('rejects mimeType exceeding 100 characters', () => {
      const result = addAttachmentSchema.safeParse({
        fileName: 'file.txt',
        fileUrl: 'https://example.com/file.txt',
        mimeType: 'x'.repeat(101),
      });
      expect(result.success).toBe(false);
    });

    it('rejects missing fileUrl', () => {
      const result = addAttachmentSchema.safeParse({
        fileName: 'file.txt',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('attachment deletion authorization', () => {
    it('allows uploader to delete their attachment', () => {
      const canDelete = (
        attachmentMemberId: string,
        currentMemberId: string,
        currentRole: string
      ): { allowed: boolean; error?: string } => {
        if (attachmentMemberId === currentMemberId) return { allowed: true };
        if (currentRole === 'parent') return { allowed: true };
        return { allowed: false, error: 'Cannot delete this attachment' };
      };

      expect(canDelete('member-1', 'member-1', 'child')).toEqual({ allowed: true });
    });

    it('allows parent to delete any attachment', () => {
      const canDelete = (
        attachmentMemberId: string,
        currentMemberId: string,
        currentRole: string
      ): { allowed: boolean; error?: string } => {
        if (attachmentMemberId === currentMemberId) return { allowed: true };
        if (currentRole === 'parent') return { allowed: true };
        return { allowed: false, error: 'Cannot delete this attachment' };
      };

      expect(canDelete('member-2', 'member-1', 'parent')).toEqual({ allowed: true });
    });

    it('prevents child from deleting another member attachment', () => {
      const canDelete = (
        attachmentMemberId: string,
        currentMemberId: string,
        currentRole: string
      ): { allowed: boolean; error?: string } => {
        if (attachmentMemberId === currentMemberId) return { allowed: true };
        if (currentRole === 'parent') return { allowed: true };
        return { allowed: false, error: 'Cannot delete this attachment' };
      };

      expect(canDelete('member-2', 'member-1', 'child')).toEqual({
        allowed: false,
        error: 'Cannot delete this attachment',
      });
    });
  });

  describe('activity log entry generation', () => {
    it('generates correct activity entry for attachment upload', () => {
      const createAttachmentActivity = (
        choreId: string,
        memberId: string,
        attachmentId: string,
        fileName: string
      ) => ({
        choreId,
        memberId,
        action: 'attachment_added',
        newValue: { attachmentId, fileName },
      });

      const activity = createAttachmentActivity('chore-1', 'member-1', 'att-1', 'photo.jpg');
      expect(activity).toEqual({
        choreId: 'chore-1',
        memberId: 'member-1',
        action: 'attachment_added',
        newValue: { attachmentId: 'att-1', fileName: 'photo.jpg' },
      });
    });
  });

  describe('photo proof identification', () => {
    it('distinguishes photo proof from regular attachments', () => {
      const isPhotoProof = (attachment: { isPhotoProof: boolean }): boolean => {
        return attachment.isPhotoProof;
      };

      expect(isPhotoProof({ isPhotoProof: true })).toBe(true);
      expect(isPhotoProof({ isPhotoProof: false })).toBe(false);
    });
  });
});
