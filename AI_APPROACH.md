# AI Approach

This document describes the design of the AI analysis pipeline - prompt engineering, grounding strategy, citation validation, and JSON enforcement.

---

## Prompt Design with Strict Rules

The system prompt (`src/modules/analysis/analysis.prompt.ts`) is designed with four strict rules that constrain the model's behavior:

```
STRICT RULES:
1. Only use information explicitly stated in the transcript below.
2. Do NOT invent attendees, tasks, decisions, or outcomes.
3. Every insight MUST include at least one citation with a "timestamp" matching exactly one of the transcript entries.
4. If something was not discussed, omit it entirely - do not guess or infer.
```

**Why these rules matter:**

- **Rule 1** prevents the model from using its training data to "fill in" plausible but fabricated meeting content.
- **Rule 2** explicitly bans hallucination of entities - the most dangerous failure mode in meeting analysis.
- **Rule 3** forces citation grounding - every claim must reference a specific transcript timestamp.
- **Rule 4** tells the model that omission is preferred over fabrication, which is the correct default for business-critical analysis.

---

## Grounding Strategy - No Hallucination

The transcript is injected as a JSON array into the prompt via `JSON.stringify()`. Each entry has a `timestamp`, `speaker`, and `text` field. The model is instructed to only reference timestamps that exist in this array.

**Design principle:** The model can only claim what is traceable. If a citation points to timestamp `"00:05"`, anyone can look up exactly what was said at `00:05` in the original transcript.

This is a lightweight version of the RAG (Retrieval-Augmented Generation) pattern - instead of retrieving from a vector store, we inject the full context directly and constrain the output to reference it.

---

## Citation Validation with Set

After receiving the model's response, the system validates every citation timestamp against the original transcript using a `Set<string>`:

```typescript
// Build Set from all valid transcript timestamps
const validTimestamps = new Set<string>(
  transcript.map((entry) => entry.timestamp)
);

// Filter out citations with invalid timestamps
item.citations = item.citations.filter((citation) =>
  validTimestamps.has(citation.timestamp)
);
```

**Why a Set?**
- O(1) lookup per citation vs. O(n) with array `.includes()`
- For a transcript with 500 entries and an analysis with 50 citations, this is 50 O(1) lookups instead of 50 × 500 comparisons.

**What happens to invalid citations?**
- They are silently stripped from the response.
- A `logger.warn()` entry is created for each stripped citation, including the invalid timestamp and the section it came from.
- The analysis is still saved - we don't reject it entirely because partial grounding is better than no analysis.

---

## JSON Mode Enforcement

The Groq API is configured with `responseMimeType: 'application/json'`:

```typescript
const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash',
  generationConfig: {
    responseMimeType: 'application/json',
  },
});
```

**Why this matters:**
- Without JSON mode, the model might return markdown-wrapped JSON (`\`\`\`json ... \`\`\``), plain text, or a mix.
- JSON mode guarantees the response is valid JSON, eliminating the need for regex stripping or error-prone parsing.
- The prompt also specifies the exact JSON structure expected, so the model knows the contract.

**Fallback:** Even with JSON mode, we still wrap `JSON.parse()` in a try/catch. If parsing fails, the service returns a `502 LLM_ERROR` response.

---

## Retry Strategy

The service uses a single retry with a 1-second delay:

```
Attempt 1 → fail → wait 1s → Attempt 2 → fail → return 502 LLM_ERROR
```

**Why only one retry?**
- Groq's free tier has rate limits. Aggressive retrying can exhaust the quota.
- A single retry handles transient network errors and brief rate limit windows.
- If both attempts fail, the error is propagated to the client as a clear `LLM_ERROR` with a 502 status.

---

## Output Structure

The analysis produces four sections, each with citations:

| Section | Content | Citation Requirement |
|---------|---------|---------------------|
| `summary` | Key discussion points | Each point cites transcript timestamps |
| `actionItems` | Tasks with assignees | Each task cites where it was discussed |
| `decisions` | Decisions made | Each decision cites the moment it was agreed |
| `followUpSuggestions` | Recommended next steps | Each suggestion cites what prompted it |

After analysis, `actionItems` are automatically saved as `ActionItem` records in the database with `status: PENDING`, enabling the overdue tracking and reminder system.
