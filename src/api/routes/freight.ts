import type { FastifyInstance } from 'fastify';
import {
  calculateItemPS,
  calculateConsignmentTotals,
  suggestVehicleType,
} from '../../domains/freight/FreightMeasurementEngine';
import type { FreightItem } from '../../domains/freight/types';

export async function freightRoutes(fastify: FastifyInstance): Promise<void> {
  /**
   * POST /freight/calculate-item
   * Calculate pallet space for a single item.
   */
  fastify.post<{ Body: FreightItem }>('/freight/calculate-item', {
    schema: {
      body: {
        type: 'object',
        required: ['widthMm', 'depthMm', 'heightMm', 'weightKgEach', 'quantity'],
        properties: {
          widthMm: { type: 'number', minimum: 1 },
          depthMm: { type: 'number', minimum: 1 },
          heightMm: { type: 'number', minimum: 1 },
          weightKgEach: { type: 'number', minimum: 0 },
          quantity: { type: 'integer', minimum: 1 },
          stackable: { type: 'boolean' },
          description: { type: 'string' },
        },
      },
    },
    handler: async (request, reply) => {
      const body = request.body;
      const item: FreightItem = {
        ...body,
        stackable: body.stackable !== undefined ? body.stackable : true,
      };
      const result = calculateItemPS(item);
      return reply.send(result);
    },
  });

  /**
   * POST /freight/calculate-consignment
   * Calculate totals and suggest vehicle types for a consignment.
   */
  fastify.post<{ Body: { items: FreightItem[] } }>('/freight/calculate-consignment', {
    schema: {
      body: {
        type: 'object',
        required: ['items'],
        properties: {
          items: { type: 'array', items: { type: 'object' } },
        },
      },
    },
    handler: async (request, reply) => {
      const items: FreightItem[] = request.body.items.map((it) => ({
        ...it,
        stackable: it.stackable !== undefined ? it.stackable : true,
      }));
      const summary = calculateConsignmentTotals(items);
      const vehicleSuggestions = suggestVehicleType(summary);
      return reply.send({ summary, vehicleSuggestions });
    },
  });
}
