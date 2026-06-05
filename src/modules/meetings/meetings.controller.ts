import { Request, Response, NextFunction } from 'express';
import * as meetingsService from './meetings.service';
import { successResponse, errorResponse } from '../../utils/response';
import { ListMeetingsQuerySchema } from './meetings.schema';

export async function createMeeting(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.userId!;
    const meeting = await meetingsService.createMeeting(userId, req.body);

    res.status(201).json(successResponse(meeting, req.traceId));
  } catch (err) {
    next(err);
  }
}

export async function listMeetings(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.userId!;

    // Validate query params
    const parsed = ListMeetingsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      next(parsed.error);
      return;
    }

    const result = await meetingsService.listMeetings(userId, parsed.data);

    res.status(200).json(successResponse(result, req.traceId));
  } catch (err) {
    next(err);
  }
}

export async function getMeeting(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const meeting = await meetingsService.getMeeting(userId, id);

    if (!meeting) {
      res.status(404).json(
        errorResponse('NOT_FOUND', 'Meeting not found', req.traceId)
      );
      return;
    }

    res.status(200).json(successResponse(meeting, req.traceId));
  } catch (err) {
    next(err);
  }
}
