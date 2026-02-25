import type { FastifyInstance } from 'fastify';
import { TaskType } from '@prisma/client';
import { consignmentService } from '../../domains/consignment/ConsignmentService';

export async function consignmentRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * POST /consignments
   * Create a new consignment.
   */
  fastify.post('/consignments', {
    handler: async (request, reply) => {
      const userId = (request.headers['x-user-id'] as string) || 'anonymous';
      const consignment = await consignmentService.createConsignment(
        request.body as Parameters<typeof consignmentService.createConsignment>[0],
        userId
      );
      return reply.status(201).send(consignment);
    },
  });

  /**
   * GET /consignments/:id
   */
  fastify.get<{ Params: { id: string } }>('/consignments/:id', {
    handler: async (request, reply) => {
      const { prisma } = await import('../../shared/db/client');
      const consignment = await prisma.consignment.findUnique({
        where: { id: request.params.id },
        include: { items: true, tasks: true, customer: true },
      });
      if (!consignment) {
        return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Consignment not found' } });
      }
      return reply.send(consignment);
    },
  });

  /**
   * POST /consignments/:id/tasks
   * Add a task to a consignment.
   */
  fastify.post<{
    Params: { id: string };
    Body: { taskType: TaskType; manifestId?: string; estimatedCostCents?: number };
  }>('/consignments/:id/tasks', {
    handler: async (request, reply) => {
      const userId = (request.headers['x-user-id'] as string) || 'anonymous';
      const task = await consignmentService.addTask(
        request.params.id,
        request.body,
        userId
      );
      return reply.status(201).send(task);
    },
  });

  /**
   * GET /consignments/:id/task-chain
   * Get all tasks ordered by manifest date + sequence.
   */
  fastify.get<{ Params: { id: string } }>('/consignments/:id/task-chain', {
    handler: async (request, reply) => {
      const chain = await consignmentService.getTaskChain(request.params.id);
      return reply.send(chain);
    },
  });

  /**
   * POST /consignments/:id/compute-status
   * Derive and update the consignment's status from task states.
   */
  fastify.post<{ Params: { id: string } }>('/consignments/:id/compute-status', {
    handler: async (request, reply) => {
      const status = await consignmentService.computeConsignmentStatus(request.params.id);
      return reply.send({ status });
    },
  });

  /**
   * POST /manifests/:manifestId/reassign-driver
   * Reassign manifest driver with licence validation.
   */
  fastify.post<{
    Params: { manifestId: string };
    Body: { newDriverId: string };
  }>('/manifests/:manifestId/reassign-driver', {
    handler: async (request, reply) => {
      const userId = (request.headers['x-user-id'] as string) || 'anonymous';
      await consignmentService.reassignManifestDriver({
        manifestId: request.params.manifestId,
        newDriverId: request.body.newDriverId,
        userId,
      });
      return reply.status(204).send();
    },
  });

  /**
   * POST /tasks/:taskId/futile-pickup
   * Scenario 11: Mark a pickup task as futile.
   */
  fastify.post<{
    Params: { taskId: string };
    Body: { photoUrl?: string };
  }>('/tasks/:taskId/futile-pickup', {
    handler: async (request, reply) => {
      const userId = (request.headers['x-user-id'] as string) || 'anonymous';
      const result = await consignmentService.markFutilePickup(
        request.params.taskId,
        request.body?.photoUrl,
        userId
      );
      return reply.send(result);
    },
  });

  /**
   * POST /tasks/:taskId/partial-delivery
   * Scenario 13: Record a partial delivery.
   */
  fastify.post<{
    Params: { taskId: string };
    Body: { deliveredItemIds: string[]; returnedItemIds: string[] };
  }>('/tasks/:taskId/partial-delivery', {
    handler: async (request, reply) => {
      const userId = (request.headers['x-user-id'] as string) || 'anonymous';
      const result = await consignmentService.recordPartialDelivery(
        request.params.taskId,
        request.body.deliveredItemIds,
        request.body.returnedItemIds,
        userId
      );
      return reply.send(result);
    },
  });

  /**
   * POST /manifests/:manifestId/adhoc-service
   * Scenario 16: Add an ad-hoc service task mid-shift.
   */
  fastify.post<{
    Params: { manifestId: string };
    Body: { taskType: TaskType; capturedMinutes: number; consignmentId: string };
  }>('/manifests/:manifestId/adhoc-service', {
    handler: async (request, reply) => {
      const userId = (request.headers['x-user-id'] as string) || 'anonymous';
      const result = await consignmentService.addAdHocServiceTask(
        request.params.manifestId,
        request.body.taskType,
        request.body.capturedMinutes,
        request.body.consignmentId,
        userId
      );
      return reply.status(201).send(result);
    },
  });
}
