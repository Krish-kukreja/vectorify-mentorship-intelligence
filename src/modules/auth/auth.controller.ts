import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import * as authService from './auth.service';
import { successResponse, errorResponse } from '../../utils/response';
import logger from '../../utils/logger';

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body;
    const user = await authService.register(email, password);

    res.status(201).json(successResponse(user, req.traceId));
  } catch (err: any) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2002'
    ) {
      logger.warn('Registration failed: duplicate email', {
        traceId: req.traceId,
        email: req.body.email,
      });

      res.status(409).json(
        errorResponse('CONFLICT', 'A user with this email already exists', req.traceId)
      );
      return;
    }

    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);

    if (!result) {
      res.status(401).json(
        errorResponse('UNAUTHORIZED', 'Invalid email or password', req.traceId)
      );
      return;
    }

    res.status(200).json(successResponse(result, req.traceId));
  } catch (err: any) {
    next(err);
  }
}
