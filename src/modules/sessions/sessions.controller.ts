import { Request, Response, NextFunction } from 'express';
import * as sessionsService from './sessions.service';
import { successResponse, errorResponse } from '../../utils/response';
import { ListSessionsQuerySchema } from './sessions.schema';

export async function createSession(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.userId!;
    const session = await sessionsService.createSession(userId, req.body);

    res.status(201).json(successResponse(session, req.traceId));
  } catch (err) {
    next(err);
  }
}

export async function listSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.userId!;

    // Validate query params
    const parsed = ListSessionsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      next(parsed.error);
      return;
    }

    const result = await sessionsService.listSessions(userId, parsed.data);

    res.status(200).json(successResponse(result, req.traceId));
  } catch (err) {
    next(err);
  }
}

export async function getSession(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const session = await sessionsService.getSession(userId, id);

    if (!session) {
      res.status(404).json(
        errorResponse('NOT_FOUND', 'Session not found', req.traceId)
      );
      return;
    }

    res.status(200).json(successResponse(session, req.traceId));
  } catch (err) {
    next(err);
  }
}
