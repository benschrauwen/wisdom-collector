import type { BookMetadata, ChunkAnalysis } from "../types.js";

function formatChunkAnalyses(chunkAnalyses: ChunkAnalysis[]): string {
  return chunkAnalyses
    .map((analysis) =>
      [
        `Chunk ${analysis.chunkIndex + 1}`,
        `Overview: ${analysis.overview}`,
        `Key ideas: ${analysis.keyIdeas.join(" | ")}`,
        `Actionable principles: ${analysis.actionablePrinciples.join(" | ")}`,
        `Decision rules: ${analysis.decisionRules.join(" | ")}`,
        `Agent workflows: ${analysis.agentWorkflows.join(" | ")}`,
        `Starter prompts: ${analysis.starterPrompts.join(" | ")}`,
        `Useful quotes: ${analysis.usefulQuotes.join(" | ")}`,
      ].join("\n"),
    )
    .join("\n\n");
}

export function buildSkillSynthesisSystemPrompt(book: BookMetadata): string {
  return `
You are turning book notes into a reusable Cursor skill document.

Your output is not a book report. It is a practical skill another agent can apply directly.

Book title: ${book.title}
Book author: ${book.author ?? "Unknown"}

Rules:
- Synthesize the strongest recurring ideas across the notes; repetition across chunks is a signal of importance.
- Favor operational guidance over explanation so another agent can act without re-reading the book.
- Frontmatter \`description\` (third person): state what the skill does and when to use it. Mention adjacent, plain-language triggers only when they are genuinely supported by the source material so the skill can still load even if the user does not say "skill" or name the book.
- Keep the description grounded in this book's domain. Do not borrow example scenarios, industries, or use cases unless the notes clearly support them.
- Skill title: a reusable capability (e.g. "Difficult conversation framing")—not the book title or a citation.
- Slug: capability-based and suitable for the folder name and frontmatter \`name\`; derive it from the skill title, not the book title or source filename.
- Workflow steps: imperative, ordered, one action per step where possible.
- Array fields: plain text strings only—no leading bullets, numbers, or Markdown in the string values—so rendering and tooling stay predictable.
- Merge overlapping ideas into the strongest phrasing instead of producing near-duplicate bullets or starter prompts.
- Include guardrails and anti-patterns when the source material implies them.
- Omit tags and hashtag-style labels unless the schema explicitly asks for them.
- No absolute paths, local filenames, or machine-specific details—skills are shared and relocated.
- Credit the book and author in high-level source notes only; do not paste chunk indices, file paths, or extraction metadata.
- Stay faithful to the book while wording the skill so it helps on similar tasks beyond this one title.
- Call \`save_skill_blueprint\` exactly once with the full structured result; do not substitute free-form chat for the tool.

Examples (style, not content to copy):
- Title — weak: "Book title summary." Strong: "Capability-focused title for the reusable behavior."
- Description — weak: "A skill based on a book about strategy." Strong: "Helps diagnose recurring situations, choose a repeatable response, and act when similar plain-language requests appear."
- Array item — weak: "- Ask open questions" (with bullet inside the string). Strong: "Ask open questions that invite the counterpart to reveal constraints."
  `.trim();
}

export function buildSkillSynthesisUserPrompt(book: BookMetadata, chunkAnalyses: ChunkAnalysis[]): string {
  return `
Create a community-ready skill blueprint from the extracted notes for "${book.title}".

The skill should include:
- a short, capability-based slug suitable for the folder name and frontmatter \`name\`, derived from the title rather than the book title or source filename
- a strong skill title focused on the capability, not the book title
- a short frontmatter description in third person: what it does, when to use it, and phrasings or situations where it should still apply (even if the user does not say "skill" or the book name)
- a concise summary
- when to use the skill
- required inputs or context
- an ordered workflow
- heuristics and decision rules
- anti-patterns or mistakes to avoid
- starter prompts an agent or user could use
- source notes that credit the book and author without copying large passages or exposing local file details

Return array items as plain text only—no bullets, numbering, or repeated section labels inside each string—so the renderer can wrap or list them consistently.
Only include triggers, scenarios, and examples that are clearly supported by the chunk analyses.
Merge overlaps instead of repeating the same idea with slightly different wording.

Chunk analyses:
${formatChunkAnalyses(chunkAnalyses)}
  `.trim();
}
