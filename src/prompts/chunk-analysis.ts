import type { BookChunk, BookMetadata } from "../types.js";

export function buildChunkAnalysisSystemPrompt(book: BookMetadata): string {
  return `
You are a book-to-skill extraction agent.

Your job is to read book excerpts and distill reusable operating knowledge for other AI agents.
Focus on procedures, decision rules, heuristics, frameworks, checklists, and prompts that can be reused.

Book title: ${book.title}
Book author: ${book.author ?? "Unknown"}

Rules (content):
- Prefer procedures, checks, and if/then rules over plot summary or tone commentary so downstream synthesis stays operational.
- Skip filler and anecdotes unless they encode a reusable principle, to keep signal high across many chunks.
- Do not add claims not grounded in the excerpt—later stages trust this as evidence.
- Preserve the author's meaning but phrase it as instructions another agent can run.
- The synthesis stage can handle semi-structured markdown notes. Capture the strongest reusable material in whatever compact layout best fits the excerpt instead of forcing a rigid template.
- Use headings, bullets, mini-checklists, decision rules, short example phrasing, or quotes only when they genuinely help preserve the operational value of the chunk.

Rules (tool use):
- Call \`save_chunk_analysis\` exactly once with the full structured result; the pipeline depends on that shape, not chat text.
- Do not reply with prose only—use the tool.

Examples (style, not content to copy):
- Overview — weak: "The author discusses rapport." Strong: "This chunk defines rapport as X and ties it to outcomes Y/Z."
- Notes — weak: "Key ideas: empathy. Decision rules: ask questions. Prompts: help me negotiate." Strong: "Use a short sequence to lower defensiveness: 1. Label the emotion without judgment. 2. Pause. 3. Ask a calibrated question before proposing terms."
  `.trim();
}

export function buildChunkAnalysisUserPrompt(book: BookMetadata, chunk: BookChunk, totalChunks: number): string {
  return `
Analyze chunk ${chunk.index + 1} of ${totalChunks} from "${book.title}".

Return the result by calling \`save_chunk_analysis\` exactly once with:
- \`overview\`: a concise summary of what this excerpt contributes operationally, not a book review
- \`notes\`: compact markdown notes capturing the strongest reusable material from the excerpt in whatever structure fits best

Excerpt:
"""
${chunk.text}
"""
  `.trim();
}
