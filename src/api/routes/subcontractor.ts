import type { FastifyInstance } from 'fastify';
import { SubcontractorJobStatus } from '@prisma/client';
import { subcontractorService } from '../../domains/subcontractor/SubcontractorService';

export async function subcontractorRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * POST /subcontractor/jobs
   * Assign a subcontractor to a consignment.
   */
  fastify.post<{
    Body: {
      consignmentId: string;
      subcontractorId: string;
      expectedDeliveryAt: string;
      customerId?: string;
    };
  }>('/subcontractor/jobs', {
    schema: {
      body: {
        type: 'object',
        required: ['consignmentId', 'subcontractorId', 'expectedDeliveryAt'],
        properties: {
          consignmentId: { type: 'string' },
          subcontractorId: { type: 'string' },
          expectedDeliveryAt: { type: 'string', format: 'date-time' },
          customerId: { type: 'string' },
        },
      },
    },
    handler: async (request, reply) => {
      const userId = (request.headers['x-user-id'] as string) || 'anonymous';
      const result = await subcontractorService.assignSubcontractor(
        {
          ...request.body,
          expectedDeliveryAt: new Date(request.body.expectedDeliveryAt),
        },
        userId
      );
      return reply.status(201).send(result);
    },
  });

  /**
   * POST /subcontractor/jobs/token-update
   * Subcontractor updates status via their signed token link.
   */
  fastify.post<{
    Body: {
      token: string;
      status: SubcontractorJobStatus;
      deliveryTime?: string;
      podPhotoUrl?: string;
      notes?: string;
    };
  }>('/subcontractor/jobs/token-update', {
    schema: {
      body: {
        type: 'object',
        required: ['token', 'status'],
        properties: {
          token: { type: 'string' },
          status: { type: 'string' },
          deliveryTime: { type: 'string' },
          podPhotoUrl: { type: 'string' },
          notes: { type: 'string' },
        },
      },
    },
    handler: async (request, reply) => {
      const { token, deliveryTime, ...rest } = request.body;
      const result = await subcontractorService.processSubbieTokenUpdate(token, {
        ...rest,
        deliveryTime: deliveryTime ? new Date(deliveryTime) : undefined,
      });
      return reply.send(result);
    },
  });

  /**
   * GET /subcontractor/jobs/:consignmentId/status
   * Get current status of a subcontractor job.
   */
  fastify.get<{ Params: { consignmentId: string } }>(
    '/subcontractor/jobs/:consignmentId/status',
    {
      handler: async (request, reply) => {
        const status = await subcontractorService.getSubcontractorJobStatus(
          request.params.consignmentId
        );
        return reply.send(status);
      },
    }
  );

  /**
   * POST /subcontractor/jobs/:id/manual-update
   * Snapes staff records a status update on subcontractor's behalf.
   */
  fastify.post<{
    Params: { id: string };
    Body: {
      status: SubcontractorJobStatus;
      deliveryTime?: string;
      podPhotoUrl?: string;
      notes?: string;
    };
  }>('/subcontractor/jobs/:id/manual-update', {
    handler: async (request, reply) => {
      const userId = (request.headers['x-user-id'] as string) || 'anonymous';
      const { deliveryTime, ...rest } = request.body;
      const result = await subcontractorService.manualUpdate(
        request.params.id,
        {
          ...rest,
          deliveryTime: deliveryTime ? new Date(deliveryTime) : undefined,
        },
        userId
      );
      return reply.send(result);
    },
  });

  /**
   * POST /subcontractor/email-parse
   * Parse a status email from a subcontractor.
   */
  fastify.post<{ Body: { emailText: string } }>(
    '/subcontractor/email-parse',
    {
      schema: {
        body: {
          type: 'object',
          required: ['emailText'],
          properties: { emailText: { type: 'string' } },
        },
      },
      handler: async (request, reply) => {
        const result = await subcontractorService.parseSubcontractorEmail(
          request.body.emailText
        );
        return reply.send(result);
      },
    }
  );
}
