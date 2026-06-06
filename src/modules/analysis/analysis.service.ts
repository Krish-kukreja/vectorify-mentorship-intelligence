import Groq from 'groq-sdk';
import { Prisma } from '@prisma/client';
import { prisma } from '../../utils/prisma';
import { env } from '../../config/env';
import logger from '../../utils/logger';
import { buildPrompt } from './analysis.prompt';
import { validateCitations } from './analysis.validator';

const REQUIRED_KEYS = ['summary', 'actionItems', 'decisions', 'followUpSuggestions'];

async function callLLM(prompt: string): Promise<string> {
  const groq = new Groq({ apiKey: env.GEMINI_API_KEY });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000); // 30 seconds

  try {
    const response = await groq.chat.completions.create(
      {
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.1,
      },
      { signal: controller.signal } as any // Adding signal to request options
    );
    clearTimeout(timeout);
    return response.choices[0].message.content || '{}';
  } catch (err: any) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') {
      throw new Error('LLM_ERROR: Request timeout');
    }
    throw err;
  }
}

async function callLLMWithRetry(prompt: string, traceId: string): Promise<string> {
  try {
    return await callLLM(prompt);
  } catch (firstError) {
    logger.warn('LLM API first attempt failed, retrying in 1s', {
      traceId,
      error: (firstError as Error).message,
    });

    await new Promise((resolve) => setTimeout(resolve, 1000));

    try {
      return await callLLM(prompt);
    } catch (retryError) {
      logger.error('LLM API retry also failed', {
        traceId,
        error: (retryError as Error).message,
      });
      throw new Error('LLM_ERROR');
    }
  }
}

export async function analyzeMeeting(userId: string, meetingId: string, traceId: string) {
  logger.info('Starting meeting analysis', { traceId, userId, meetingId });

  // 1. Verify meeting exists and belongs to user
  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    include: { analysis: true },
  });

  if (!meeting || meeting.userId !== userId) {
    logger.warn('Meeting not found or access denied for analysis', { traceId, meetingId, userId });
    return { error: 'NOT_FOUND' };
  }

  // 2. Check if analysis already exists
  if (meeting.analysis) {
    logger.info('Analysis already exists for meeting', { traceId, meetingId });
    return { error: 'CONFLICT', existing: meeting.analysis };
  }

  // 3. Build prompt and call LLM
  const transcript = meeting.transcript as any[];
  const prompt = buildPrompt(transcript);

  let responseText: string;
  try {
    responseText = await callLLMWithRetry(prompt, traceId);
  } catch (err) {
    return { error: 'LLM_ERROR', message: (err as Error).message };
  }

  // 4. Parse and validate JSON response
  let analysisData: any;
  try {
    analysisData = JSON.parse(responseText);
  } catch {
    logger.error('LLM returned invalid JSON', { traceId, responseText: responseText.substring(0, 500) });
    return { error: 'LLM_ERROR', message: 'Invalid JSON response from LLM' };
  }

  // 5. Validate required keys
  for (const key of REQUIRED_KEYS) {
    if (!Array.isArray(analysisData[key])) {
      logger.error('LLM response missing required key', { traceId, missingKey: key });
      return { error: 'LLM_ERROR', message: `Missing required key: ${key}` };
    }
  }

  // 6. Validate citations
  const cleanedAnalysis = validateCitations(analysisData, transcript, traceId);

  // 7. Save MeetingAnalysis to DB
  const savedAnalysis = await prisma.meetingAnalysis.create({
    data: {
      meetingId,
      summary: cleanedAnalysis.summary as any,
      actionItems: cleanedAnalysis.actionItems as any,
      decisions: cleanedAnalysis.decisions as any,
      followUpSuggestions: cleanedAnalysis.followUpSuggestions as any,
    },
  });

  logger.info('Meeting analysis saved', { traceId, analysisId: savedAnalysis.id, meetingId });

  // 8. Auto-create ActionItems from analysis.actionItems
  if (Array.isArray(cleanedAnalysis.actionItems) && cleanedAnalysis.actionItems.length > 0) {
    const actionItemsData = cleanedAnalysis.actionItems.map((item: any) => ({
      meetingId,
      task: item.task || 'Untitled action item',
      assignee: item.assignee || 'unassigned',
      status: 'PENDING' as const,
      dueDate: null,
      citations: item.citations || [],
    }));

    await prisma.actionItem.createMany({
      data: actionItemsData,
    });

    logger.info('Action items auto-created from analysis', {
      traceId,
      meetingId,
      count: actionItemsData.length,
    });
  }

  return { analysis: savedAnalysis };
}
