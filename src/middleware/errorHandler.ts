import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { errorResponse } from '../utils/response';
import logger from '../utils/logger';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const traceId = req.traceId || 'unknown';

  // Zod validation errors → 400
  if (err instanceof ZodError) {
    logger.warn('Validation error', {
      traceId,
      path: req.originalUrl,
      issues: err.issues,
    });

    res.status(400).json(
      errorResponse(
        'VALIDATION_ERROR',
        'Request validation failed',
        traceId,
        err.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }))
      )
    );
    return;
  }

  // JWT errors → 401
  if (err instanceof JsonWebTokenError || err instanceof TokenExpiredError) {
    const message =
      err instanceof TokenExpiredError
        ? 'Token has expired'
        : 'Invalid or malformed token';

    logger.warn('Authentication error', {
      traceId,
      path: req.originalUrl,
      error: err.message,
    });

    res.status(401).json(
      errorResponse('UNAUTHORIZED', message, traceId)
    );
    return;
  }

  // Everything else → 500
  logger.error('Unhandled error', {
    traceId,
    path: req.originalUrl,
    error: err.message,
    stack: err.stack,
  });

  res.status(500).json(
    errorResponse(
      'INTERNAL_ERROR',
      'An unexpected error occurred',
      traceId
    )
  );
}
