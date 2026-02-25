import type { FastifyInstance } from 'fastify';
import { ScanType } from '@prisma/client';
import { scanningService } from '../../domains/scanning/ScanningService';

export async function scanningRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * POST /scan
   * Record a scan event.
   */
  fastify.post<{
    Body: {
      itemId: string;
      scanType: ScanType;
      lat?: number;
      lng?: number;
      userId: string;
      manifestId?: string;
      conditionNote?: string;
      photoUrl?: string;
    };
  }>('/scan', {
    schema: {
      body: {
        type: 'object',
        required: ['itemId', 'scanType', 'userId'],
        properties: {
          itemId: { type: 'string' },
          scanType: { type: 'string' },
          lat: { type: 'number' },
          lng: { type: 'number' },
          userId: { type: 'string' },
          manifestId: { type: 'string' },
          conditionNote: { type: 'string' },
          photoUrl: { type: 'string' },
        },
      },
    },
    handler: async (request, reply) => {
      const result = await scanningService.recordScan(request.body);
      return reply.status(201).send(result);
    },
  });

  /**
   * GET /scan/chain-of-custody/:consignmentId
   * Full custody chain in chronological order.
   */
  fastify.get<{ Params: { consignmentId: string } }>(
    '/scan/chain-of-custody/:consignmentId',
    {
      handler: async (request, reply) => {
        const chain = await scanningService.getChainOfCustody(request.params.consignmentId);
        return reply.send(chain);
      },
    }
  );

  /**
   * GET /scan/discrepancies/:manifestId
   * All active discrepancy alerts for a manifest.
   */
  fastify.get<{ Params: { manifestId: string } }>(
    '/scan/discrepancies/:manifestId',
    {
      handler: async (request, reply) => {
        const discrepancies = await scanningService.getDiscrepancies(
          request.params.manifestId
        );
        return reply.send(discrepancies);
      },
    }
  );

  /**
   * GET /scan/labels/:consignmentId
   * Generate label data for all items in a consignment.
   */
  fastify.get<{ Params: { consignmentId: string } }>(
    '/scan/labels/:consignmentId',
    {
      handler: async (request, reply) => {
        const labels = await scanningService.generateLabelData(request.params.consignmentId);
        return reply.send(labels);
      },
    }
  );
}
