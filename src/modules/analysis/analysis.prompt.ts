export function buildPrompt(transcript: unknown[]): string {
  const transcriptJson = JSON.stringify(transcript);

  return `You are a meeting analysis assistant.

Your job is to extract structured insights from a meeting transcript.

STRICT RULES:
1. Only use information explicitly stated in the transcript below.
2. Do NOT invent attendees, tasks, decisions, or outcomes.
3. Every insight MUST include at least one citation with a "timestamp" matching exactly one of the transcript entries.
4. If something was not discussed, omit it entirely - do not guess or infer.

TRANSCRIPT:
${transcriptJson}

Respond ONLY with a valid JSON object in this exact format.
No markdown, no explanation, no code fences:

{
  "summary": [{ "text": "...", "citations": [{ "timestamp": "00:10" }] }],
  "actionItems": [{ "task": "...", "assignee": "...", "citations": [{ "timestamp": "..." }] }],
  "decisions": [{ "text": "...", "citations": [{ "timestamp": "..." }] }],
  "followUpSuggestions": [{ "text": "...", "citations": [{ "timestamp": "..." }] }]
}`;
}
