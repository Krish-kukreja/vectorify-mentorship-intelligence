import logger from '../../utils/logger';

interface Citation {
  timestamp: string;
}

interface AnalysisEntry {
  text?: string;
  task?: string;
  assignee?: string;
  citations: Citation[];
}

interface AnalysisResult {
  summary: AnalysisEntry[];
  actionItems: AnalysisEntry[];
  decisions: AnalysisEntry[];
  followUpSuggestions: AnalysisEntry[];
}

interface TranscriptEntry {
  timestamp: string;
  speaker: string;
  text: string;
}

export function validateCitations(
  analysis: AnalysisResult,
  transcript: TranscriptEntry[],
  traceId?: string
): AnalysisResult {
  // Step 1: Build Set from all valid transcript timestamps
  const validTimestamps = new Set<string>(
    transcript.map((entry) => entry.timestamp)
  );

  const sections: (keyof AnalysisResult)[] = [
    'summary',
    'actionItems',
    'decisions',
    'followUpSuggestions',
  ];

  for (const section of sections) {
    const items = analysis[section];
    if (!Array.isArray(items)) continue;

    for (const item of items) {
      if (!Array.isArray(item.citations)) continue;

      const originalLength = item.citations.length;

      // Filter out citations with invalid timestamps
      item.citations = item.citations.filter((citation: Citation) => {
        if (validTimestamps.has(citation.timestamp)) {
          return true;
        }

        logger.warn('Invalid citation stripped', {
          traceId: traceId || 'unknown',
          section,
          timestamp: citation.timestamp,
          msg: 'Citation timestamp does not match any transcript entry',
        });

        return false;
      });

      if (item.citations.length !== originalLength) {
        logger.info('Citations cleaned', {
          traceId: traceId || 'unknown',
          section,
          removed: originalLength - item.citations.length,
          remaining: item.citations.length,
        });
      }
    }
  }

  return analysis;
}
