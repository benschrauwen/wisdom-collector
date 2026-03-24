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

Rules (tool use):
- Call \`save_chunk_analysis\` exactly once with the full structured result; the pipeline depends on that shape, not chat text.
- Do not reply with prose only—use the tool.

Examples (style, not content to copy):
- Overview — weak: "The author discusses rapport." Strong: "This chunk defines rapport as X and ties it to outcomes Y/Z."
- Decision rule — weak: "Be professional." Strong: "If the counterpart is silent after an offer, wait and do not fill the silence with a concession."
- Starter prompt — weak: "Help me negotiate." Strong: "Role-play a counterpart who uses aggressive anchoring; push back using the book's counter-anchors."
  `.trim();
}

export function buildChunkAnalysisUserPrompt(book: BookMetadata, chunk: BookChunk, totalChunks: number): string {
  return `
Analyze chunk ${chunk.index + 1} of ${totalChunks} from "${book.title}".

Return the result by calling \`save_chunk_analysis\` exactly once with:
- a concise overview of the chunk (what this excerpt is *for* operationally, not a book review)
- key ideas worth preserving
- actionable principles an AI agent could apply
- decision rules or if/then heuristics (testable in situations, not vague virtues)
- agent workflows or repeatable sequences
- starter prompts inspired by the material (concrete scenario + desired behavior)
- short quotes or phrases worth keeping when they carry special meaning

Excerpt:
"""
${chunk.text}
"""
  `.trim();
}
