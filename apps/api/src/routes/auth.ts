import { FastifyInstance } from 'fastify';
import { auth } from '../lib/auth';
import { toNodeHandler } from 'better-auth/node';

export async function authRoutes(fastify: FastifyInstance) {
  // better-auth handles all auth routes
  // This creates a catch-all handler for /api/auth/*
  fastify.all('/*', async (request, reply) => {
    const handler = toNodeHandler(auth);

    // Convert Fastify request/reply to Node.js req/res
    return handler(request.raw, reply.raw);
  });
}
