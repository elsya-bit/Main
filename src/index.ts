import Fastify from 'fastify';
import cors from '@fastify/cors';
import { errorHandler } from './api/middleware/errorHandler';
import { freightRoutes } from './api/routes/freight';
import { intakeRoutes } from './api/routes/intake';
import { consignmentRoutes } from './api/routes/consignment';
import { scanningRoutes } from './api/routes/scanning';
import { subcontractorRoutes } from './api/routes/subcontractor';
import { rolloutRoutes } from './api/routes/rollout';

const PORT = parseInt(process.env.PORT ?? '3000', 10);
const HOST = process.env.HOST ?? '0.0.0.0';

async function buildServer() {
  const app = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'production' ? 'warn' : 'info',
    },
  });

  // CORS
  await app.register(cors, {
    origin: process.env.CORS_ORIGIN ?? '*',
  });

  // Routes
  await app.register(freightRoutes);
  await app.register(intakeRoutes);
  await app.register(consignmentRoutes);
  await app.register(scanningRoutes);
  await app.register(subcontractorRoutes);
  await app.register(rolloutRoutes);

  // Error handler
  app.setErrorHandler(errorHandler);

  // Health check
  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  return app;
}

async function start() {
  const app = await buildServer();

  try {
    await app.listen({ port: PORT, host: HOST });
    app.log.info(`Snapes TMS Kernel listening on ${HOST}:${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();

export { buildServer };
