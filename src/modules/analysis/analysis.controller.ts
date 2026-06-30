import { Request, Response, NextFunction } from 'express';
import * as analysisService from './analysis.service';
import { successResponse, errorResponse } from '../../utils/response';

export async function analyzeSession(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.userId!;
    const sessionId = req.params.id;

    const result = await analysisService.analyzeSession(userId, sessionId, req.traceId);

    if (result.error === 'NOT_FOUND') {
      res.status(404).json(
        errorResponse('NOT_FOUND', 'Session not found', req.traceId)
      );
      return;
    }

    if (result.error === 'CONFLICT') {
      res.status(409).json(
        errorResponse('CONFLICT', 'Analysis already exists for this session', req.traceId)
      );
      return;
    }

    if (result.error === 'LLM_ERROR') {
      res.status(502).json(
        errorResponse('LLM_ERROR', result.message || 'AI analysis failed after retry', req.traceId)
      );
      return;
    }

    res.status(200).json(successResponse(result.analysis, req.traceId));
  } catch (err) {
    next(err);
  }
}
