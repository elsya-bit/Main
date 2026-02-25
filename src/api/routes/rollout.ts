import type { FastifyInstance } from 'fastify';
import { rolloutService } from '../../domains/rollout/RolloutService';

export async function rolloutRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * POST /rollout/projects
   * Create a rollout project.
   */
  fastify.post('/rollout/projects', {
    schema: {
      body: {
        type: 'object',
        required: ['customerId', 'projectName', 'coordinatorId'],
        properties: {
          customerId: { type: 'string' },
          projectName: { type: 'string' },
          coordinatorId: { type: 'string' },
          startDate: { type: 'string' },
          endDate: { type: 'string' },
          marginTargetPercent: { type: 'number' },
        },
      },
    },
    handler: async (request, reply) => {
      const userId = (request.headers['x-user-id'] as string) || 'anonymous';
      const body = request.body as {
        customerId: string;
        projectName: string;
        coordinatorId: string;
        startDate?: string;
        endDate?: string;
        marginTargetPercent?: number;
      };
      const project = await rolloutService.createProject(
        {
          ...body,
          startDate: body.startDate ? new Date(body.startDate) : undefined,
          endDate: body.endDate ? new Date(body.endDate) : undefined,
        },
        userId
      );
      return reply.status(201).send(project);
    },
  });

  /**
   * POST /rollout/projects/:id/waves
   * Add a wave to a project.
   */
  fastify.post<{ Params: { id: string } }>('/rollout/projects/:id/waves', {
    schema: {
      body: {
        type: 'object',
        required: ['waveNumber', 'waveName'],
        properties: {
          waveNumber: { type: 'integer' },
          waveName: { type: 'string' },
          plannedDate: { type: 'string' },
        },
      },
    },
    handler: async (request, reply) => {
      const userId = (request.headers['x-user-id'] as string) || 'anonymous';
      const body = request.body as {
        waveNumber: number;
        waveName: string;
        plannedDate?: string;
      };
      const wave = await rolloutService.addWave(
        request.params.id,
        {
          ...body,
          plannedDate: body.plannedDate ? new Date(body.plannedDate) : undefined,
        },
        userId
      );
      return reply.status(201).send(wave);
    },
  });

  /**
   * POST /rollout/projects/:id/waves/:waveId/sites
   * Add a site to a wave (creates child consignment).
   */
  fastify.post<{ Params: { id: string; waveId: string } }>(
    '/rollout/projects/:id/waves/:waveId/sites',
    {
      handler: async (request, reply) => {
        const userId = (request.headers['x-user-id'] as string) || 'anonymous';
        const body = request.body as {
          siteName: string;
          deliveryAddress: string;
          pickupAddress: string;
          pickupDate?: string;
          deliveryDate?: string;
          quotedRevenueCents?: number;
          items: Array<{
            description: string;
            quantity: number;
            widthMm?: number;
            depthMm?: number;
            heightMm?: number;
            weightKgEach?: number;
            stackable?: boolean;
          }>;
        };
        const result = await rolloutService.addSite(
          request.params.id,
          request.params.waveId,
          {
            ...body,
            pickupDate: body.pickupDate ? new Date(body.pickupDate) : undefined,
            deliveryDate: body.deliveryDate ? new Date(body.deliveryDate) : undefined,
          },
          userId
        );
        return reply.status(201).send(result);
      },
    }
  );

  /**
   * GET /rollout/projects/:id/profitability
   * Full profitability report.
   */
  fastify.get<{ Params: { id: string } }>(
    '/rollout/projects/:id/profitability',
    {
      handler: async (request, reply) => {
        const report = await rolloutService.getProjectProfitability(request.params.id);
        return reply.send(report);
      },
    }
  );

  /**
   * GET /rollout/projects/:id/sites
   * All sites with per-site margin.
   */
  fastify.get<{ Params: { id: string } }>(
    '/rollout/projects/:id/sites',
    {
      handler: async (request, reply) => {
        const sites = await rolloutService.getProjectSites(request.params.id);
        return reply.send(sites);
      },
    }
  );
}
