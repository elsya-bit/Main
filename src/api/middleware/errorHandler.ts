import type { FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import { AppError } from '../../shared/errors/AppError';

export function errorHandler(
  error: FastifyError | AppError | Error,
  request: FastifyRequest,
  reply: FastifyReply
): void {
  if (error instanceof AppError) {
    reply.status(error.statusCode).send({
      error: {
        code: error.code,
        message: error.message,
        context: error.context,
      },
    });
    return;
  }

  // Fastify validation errors
  if ('validation' in error && error.validation) {
    reply.status(400).send({
      error: {
        code: 'VALIDATION_ERROR',
        message: error.message,
        details: error.validation,
      },
    });
    return;
  }

  // Fastify status code errors
  if ('statusCode' in error && typeof error.statusCode === 'number') {
    reply.status(error.statusCode).send({
      error: {
        code: 'HTTP_ERROR',
        message: error.message,
      },
    });
    return;
  }

  // Unknown errors
  request.log.error(error);
  reply.status(500).send({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  });
}
