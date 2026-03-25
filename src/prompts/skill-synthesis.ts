import type { BookMetadata, ChunkAnalysis } from "../types.js";
import { formatChunkAnalyses } from "./skill-prompt-formatters.js";

export function buildSkillSynthesisSystemPrompt(book: BookMetadata): string {
  return `
You are turning book notes into a candidate reusable skill document or small skill family.

This is the first pass in a multi-step pipeline. Focus only on the book evidence in the chunk analyses.

Your output is not a book report. It is the candidate skill content another agent should read and apply directly.

Book title: ${book.title}
Book author: ${book.author ?? "Unknown"}

Rules:
- Synthesize the strongest recurring ideas across the notes; repetition across chunks is a signal of importance.
- Stay strongly grounded in the chunk analyses. Do not optimize for an existing library, expected taxonomy, or previously written skill names.
- Favor operational guidance over explanation so another agent can act without re-reading the book.
- Keep the frontmatter focused on triggering, keep the body lean, and use only as much structure as the material actually needs.
- Treat \`skillBody\` as the real markdown body of \`SKILL.md\`. The structured fields only carry it through the pipeline; do not write the body like a rigid form if a different layout would teach the skill better.
- Frontmatter \`description\` (third person): state what the skill does and when to use it. Mention adjacent, plain-language triggers only when they are genuinely supported by the source material so the skill can still load even if the user does not say "skill" or name the book.
- Keep the description grounded in this book's domain. Do not borrow example scenarios, industries, or use cases unless the notes clearly support them.
- Skill title: a reusable capability (for example, "Difficult conversation framing") rather than the book title or a citation.
- Slug: capability-based and suitable for the folder name and frontmatter \`name\`; derive it from the skill title, not the book title or source filename.
- Use headings and subsections that fit the material. Do not force sections like "Required Inputs" or "When To Use" unless they genuinely improve the skill.
- Use imperative guidance, decision rules, anti-patterns, and short examples where they help another agent act.
- Merge overlapping ideas into the strongest phrasing instead of producing near-duplicate bullets or sections.
- If the book clearly contains multiple distinct reusable capabilities, you may create \`subskills\`. Only split when the capabilities would be reusable on their own or would otherwise make the main skill bloated.
- When you create subskills, make the main skill a concise router that explains when to use each subskill and preserves only the shared principles at the top level.
- Avoid duplicate subskills inside the candidate family itself. If two sections are materially the same capability, combine them here.
- Include guardrails and anti-patterns when the source material implies them.
- No absolute paths, local filenames, or machine-specific details—skills are shared and relocated.
- Credit the book and author in high-level source notes only; do not paste chunk indices, file paths, or extraction metadata.
- Do not include inline source citations near the title or introduction. Source attribution belongs only in a final \`## Source note\` section at the end.
- Keep source notes compatible with multi-source skills when the final skill is extended from prior material plus this book.
- Stay faithful to the book while wording the skill so it helps on similar tasks beyond this one title.
- Call \`save_skill_blueprint\` exactly once with the full structured result; do not substitute free-form chat for the tool.

Examples (style, not content to copy):
- Title — weak: "Book title summary." Strong: "Capability-focused title for the reusable behavior."
- Description — weak: "A skill based on a book about strategy." Strong: "Helps diagnose recurring situations, choose a repeatable response, and act when similar plain-language requests appear."
- Body structure — weak: "Fill every possible section whether needed or not." Strong: "Choose a compact set of headings that makes the workflow easy to follow."
- Subskills — weak: "Invent extra skills for every chapter." Strong: "Split only when the notes support distinct reusable capabilities with different triggers or workflows."
  `.trim();
}

export function buildSkillSynthesisUserPrompt(book: BookMetadata, chunkAnalyses: ChunkAnalysis[]): string {
  return `
Create a candidate reusable skill from the extracted notes for "${book.title}".

Return:
- \`slug\`: a short, capability-based slug suitable for the folder name and frontmatter \`name\`, derived from the capability rather than the book title or source filename
- \`skillTitle\`: a strong title focused on the capability, not the book title
- \`description\`: a short frontmatter description in third person covering what the skill does, when to use it, and nearby phrasings or situations where it should still apply
- \`skillBody\`: the actual markdown body that should appear after the YAML frontmatter in \`SKILL.md\`; write the skill file itself, using whatever headings and layout best fit the material
- \`subskills\`: zero or more additional skill files for clearly distinct reusable capabilities discovered in the notes; each subskill should include its own \`slug\`, \`skillTitle\`, \`description\`, and \`skillBody\`; use an empty array when one main skill is the better fit

Guidelines:
- Treat this as the book-native candidate family. Do not compare against a broader skill library in this step.
- Prefer one strong skill unless the notes clearly support a split into distinct capabilities or modes.
- If you split into subskills, keep the main skill concise and use it as an umbrella or router.
- Reject overlap inside the candidate family you are drafting.
- Prefer concise, capability-based writing with progressive disclosure and specialized branches only when they improve reuse.
- The chunk analyses below are semi-structured evidence, not a fixed outline. Infer the recurring capability and best teaching structure instead of mirroring their local headings.
- Include heuristics, decision rules, warnings, or examples only where they strengthen the skill; do not force a fixed outline.
- Only include triggers, scenarios, and examples that are clearly supported by the chunk analyses.
- Keep the markdown lean enough that another agent can absorb it quickly.
- Credit the book and author briefly when helpful, without copying large passages or exposing local file details.

Chunk analyses:
${formatChunkAnalyses(chunkAnalyses)}
  `.trim();
}
