import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { logger } from './lib/logger';
import { registerRoutes } from './routes';
import { initializeSocket } from './lib/socket';

const PORT = parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || '0.0.0.0';

async function main() {
  // Create Fastify instance with default logger
  const fastify = Fastify({
    logger: true,
  });

  // Register plugins
  await fastify.register(cors, {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'],
    credentials: true,
  });

  await fastify.register(helmet, {
    contentSecurityPolicy: false, // Managed by frontend
  });

  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  });

  // Health check
  fastify.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Register all routes
  await registerRoutes(fastify);

  // Create HTTP server for Socket.io
  const httpServer = createServer(fastify.server);

  // Initialize Socket.io
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'],
      credentials: true,
    },
  });

  initializeSocket(io);

  // Decorate fastify with io instance
  fastify.decorate('io', io);

  // Start server
  try {
    await fastify.listen({ port: PORT, host: HOST });
    logger.info(`Server running on http://${HOST}:${PORT}`);
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
}

main();
