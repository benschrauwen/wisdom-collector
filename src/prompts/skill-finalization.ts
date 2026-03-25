import type { BookMetadata, ChunkAnalysis, ExistingSkill, SkillBlueprint, SkillOverlapReview } from "../types.js";
import {
  formatCandidateFamily,
  formatChunkAnalyses,
  formatExistingSkills,
  formatOverlapReview,
} from "./skill-prompt-formatters.js";

export function buildSkillFinalizationSystemPrompt(book: BookMetadata): string {
  return `
You are finalizing the canonical skill family for a book after synthesis and overlap review.

This is the writing pass that decides whether to keep each candidate skill as-is, revise it, merge it into a referenced existing skill, or drop it as redundant.

Book title: ${book.title}
Book author: ${book.author ?? "Unknown"}

Rules:
- Stay grounded in the chunk analyses and candidate skill family. The candidate family is the main starting point; the overlap review is advisory.
- You may keep a candidate skill, revise it, merge it into one of the referenced existing skills below, or drop it if it is truly redundant.
- Only merge with existing skills that are explicitly provided below. Do not invent unseen existing skills.
- When you merge into an existing skill, preserve that skill's slug and title unless there is a compelling reason to change them.
- If you keep a candidate as a new skill, use capability-based slugs and titles derived from the candidate itself rather than the book title.
- Preserve the strongest guidance from the candidate family and incorporate the best relevant guidance from any existing skill you merge into.
- The structured payload uses one top-level skill plus \`subskills\` only as a transport format. Do not assume the top-level skill should be an umbrella or parent.
- Avoid duplicate capabilities in the final skill family.
- Be conservative about retaining extra skills. Collapse fine-grained or chapter-sized splits unless they have clearly distinct triggers and standalone reuse value.
- Prefer broader skills with stronger internal sections over many narrow sibling skills.
- Never keep a book-level router skill whose main purpose is to point to the rest of the family.
- If the family contains multiple skills, each one should stand on its own and be independently loadable.
- An additional skill should remain only if another agent would plausibly load it by itself in a different user moment than the others.
- It is usually better for the final family to contain 1-4 skills. Keep more only when the separations are unmistakably strong.
- Keep the markdown practical, lean, and ready for direct reuse by another agent.
- Put attribution only in a final \`## Source note\` section if you mention it in the body at all.
- Call \`save_skill_blueprint\` exactly once with the final structured skill family.
  `.trim();
}

export function buildSkillFinalizationUserPrompt(
  book: BookMetadata,
  chunkAnalyses: ChunkAnalysis[],
  candidateBlueprint: SkillBlueprint,
  overlapReview: SkillOverlapReview,
  referencedExistingSkills: ExistingSkill[],
): string {
  return `
Finalize the canonical reusable skill family for "${book.title}".

Return:
- \`slug\`
- \`skillTitle\`
- \`description\`
- \`skillBody\`
- \`subskills\`

Use the overlap review to focus your attention, but decide in this pass whether each candidate should remain distinct, merge into an existing skill, or be absorbed into another candidate.

Bias toward fewer, broader final skills unless the distinctions are strong enough that separate files would clearly improve reuse.
If multiple skills remain, treat them as sibling skills in a family of equals rather than a parent skill with children.

Chunk analyses:
${formatChunkAnalyses(chunkAnalyses)}

Candidate skill family:
${formatCandidateFamily(candidateBlueprint)}

Overlap review:
${formatOverlapReview(overlapReview)}

Referenced existing skills:
${formatExistingSkills(referencedExistingSkills, "No existing skills were referenced by the overlap review.")}
  `.trim();
}
