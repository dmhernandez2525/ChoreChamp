import { FastifyInstance } from 'fastify';
import { auth } from '../lib/auth';

export async function authRoutes(fastify: FastifyInstance) {
  // better-auth handles all auth routes
  // This creates a catch-all handler for /api/auth/*
  fastify.route({
    method: ['GET', 'POST'],
    url: '/*',
    async handler(request, reply) {
      // Build Fetch API-compatible request from Fastify request
      const url = new URL(request.url, `http://${request.headers.host}`);
      const headers = new Headers();
      Object.entries(request.headers).forEach(([key, value]) => {
        if (value) headers.append(key, Array.isArray(value) ? value.join(', ') : value);
      });

      const req = new Request(url.toString(), {
        method: request.method,
        headers,
        ...(request.body ? { body: JSON.stringify(request.body) } : {}),
      });

      // Pass to better-auth handler
      const response = await auth.handler(req);

      // Send response back through Fastify
      reply.status(response.status);
      response.headers.forEach((value, key) => reply.header(key, value));
      const body = response.body ? await response.text() : null;
      return reply.send(body);
    },
  });
}
