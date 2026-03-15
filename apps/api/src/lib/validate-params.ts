import { z } from 'zod';

/**
 * Zod schema for validating UUID v4 format strings.
 */
export const uuidSchema = z.string().uuid('Invalid UUID format');

/**
 * Validates that a value is a valid UUID v4.
 * Throws an HTTP 400 error if validation fails.
 *
 * @param value - The string to validate
 * @param name - The parameter name (used in the error message)
 * @returns The validated UUID string
 */
export function validateUUID(value: string, name: string): string {
  const result = uuidSchema.safeParse(value);
  if (!result.success) {
    const error = Object.assign(new Error(`Invalid ${name}: must be a valid UUID`), {
      statusCode: 400,
    });
    throw error;
  }
  return result.data;
}
