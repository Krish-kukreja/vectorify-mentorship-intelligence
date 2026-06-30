export function buildPrompt(transcript: unknown[]): string {
  const transcriptJson = JSON.stringify(transcript);

  return `You are a mentorship session analysis assistant for Vectorify, a JEE/NEET mentorship program.

Your job is to extract structured, actionable insights from a transcript of a one-on-one mentor-student session.

STRICT RULES:
1. Only use information explicitly stated in the transcript below.
2. Do NOT invent participants, tasks, topics, or outcomes.
3. Every insight MUST include at least one citation with a "timestamp" matching exactly one of the transcript entries.
4. If something was not discussed, omit it entirely - do not guess or infer.

TRANSCRIPT:
${transcriptJson}

Respond ONLY with a valid JSON object in this exact format.
No markdown, no explanation, no code fences:

{
  "summary": [{ "text": "Key concept or topic covered in the session", "citations": [{ "timestamp": "00:10" }] }],
  "actionItems": [{ "task": "Practice task or homework for the student", "assignee": "student email or name", "citations": [{ "timestamp": "..." }] }],
  "decisions": [{ "text": "Weak area or study focus agreed on in the session", "citations": [{ "timestamp": "..." }] }],
  "followUpSuggestions": [{ "text": "Recommended next step or resource for the student", "citations": [{ "timestamp": "..." }] }]
}`;
}
