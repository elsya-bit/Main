import type { FastifyInstance } from 'fastify';
import { intakeService } from '../../domains/intake/IntakeService';

export async function intakeRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * POST /intake/email
   * Process an inbound email to create a draft consignment.
   */
  fastify.post<{
    Body: { emailText: string; attachmentText?: string };
  }>('/intake/email', {
    schema: {
      body: {
        type: 'object',
        required: ['emailText'],
        properties: {
          emailText: { type: 'string', minLength: 1 },
          attachmentText: { type: 'string' },
        },
      },
    },
    handler: async (request, reply) => {
      const userId = (request.headers['x-user-id'] as string) || 'anonymous';
      const result = await intakeService.processEmail(request.body, userId);
      return reply.status(201).send(result);
    },
  });

  /**
   * POST /intake/email/:id/confirm
   * Dispatcher confirms a draft consignment → moves to BOOK status.
   */
  fastify.post<{
    Params: { id: string };
  }>('/intake/email/:id/confirm', {
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'string' } },
      },
    },
    handler: async (request, reply) => {
      const userId = (request.headers['x-user-id'] as string) || 'anonymous';
      const result = await intakeService.confirmDraft(request.params.id, userId);
      return reply.status(200).send(result);
    },
  });
}
