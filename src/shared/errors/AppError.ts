export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly context?: Record<string, unknown>;

  constructor(
    code: string,
    message: string,
    statusCode = 500,
    context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.context = context;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        context: this.context,
      },
    };
  }
}

// Common error factories
export const Errors = {
  notFound: (entity: string, id: string) =>
    new AppError('NOT_FOUND', `${entity} with id '${id}' not found`, 404, { entity, id }),

  validation: (message: string, context?: Record<string, unknown>) =>
    new AppError('VALIDATION_ERROR', message, 400, context),

  conflict: (message: string, context?: Record<string, unknown>) =>
    new AppError('CONFLICT', message, 409, context),

  forbidden: (message: string) =>
    new AppError('FORBIDDEN', message, 403),

  badRequest: (message: string, context?: Record<string, unknown>) =>
    new AppError('BAD_REQUEST', message, 400, context),

  internal: (message: string, context?: Record<string, unknown>) =>
    new AppError('INTERNAL_ERROR', message, 500, context),

  tokenExpired: () =>
    new AppError('TOKEN_EXPIRED', 'Token has expired', 401),

  tokenInvalid: () =>
    new AppError('TOKEN_INVALID', 'Token is invalid', 401),
};
