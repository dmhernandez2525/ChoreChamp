import { FastifyRequest, FastifyReply } from 'fastify';
import { auth } from '../lib/auth';

export interface AuthenticatedRequest extends FastifyRequest {
  user: {
    id: string;
    email: string;
    name: string | null;
    emailVerified: boolean;
  };
  session: {
    id: string;
    userId: string;
    expiresAt: Date;
  };
}

export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const session = await auth.api.getSession({
      headers: request.headers as Record<string, string>,
    });

    if (!session) {
      return reply.status(401).send({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    (request as AuthenticatedRequest).user = session.user;
    (request as AuthenticatedRequest).session = session.session;
  } catch {
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'Invalid or expired session',
    });
  }
}

export async function optionalAuth(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  try {
    const session = await auth.api.getSession({
      headers: request.headers as Record<string, string>,
    });

    if (session) {
      (request as AuthenticatedRequest).user = session.user;
      (request as AuthenticatedRequest).session = session.session;
    }
  } catch {
    // Silent fail for optional auth
  }
}
