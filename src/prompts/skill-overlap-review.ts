import type { BookMetadata, ExistingSkill, SkillBlueprint } from "../types.js";
import { formatCandidateFamily, formatExistingSkills } from "./skill-prompt-formatters.js";

export function buildSkillOverlapReviewSystemPrompt(book: BookMetadata): string {
  return `
You are reviewing a candidate skill family against an existing skill collection.

This is a comparison pass, not a writing pass. Do not rewrite skill markdown. Decide where overlap exists and return a focused recommendation for each candidate skill.

Book title: ${book.title}
Book author: ${book.author ?? "Unknown"}

Rules:
- Review every candidate skill in the family, including the main skill and each subskill.
- For each candidate, choose exactly one outcome:
  - \`keep\`: the candidate appears distinct enough to keep as its own skill
  - \`merge-with-existing\`: the candidate materially overlaps a specific existing skill and should be reviewed for extension
  - \`drop-as-duplicate\`: the candidate is redundant with another candidate in the same family and should be absorbed rather than kept separate
- Use \`merge-with-existing\` only when the capability is materially the same, not merely adjacent or related.
- Use \`drop-as-duplicate\` only for overlap inside the candidate family itself.
- When recommending \`merge-with-existing\`, set \`matchedExistingSkillSlug\` to the exact existing skill slug and leave \`matchedCandidateSkillSlug\` empty.
- When recommending \`drop-as-duplicate\`, set \`matchedCandidateSkillSlug\` to the surviving candidate slug and leave \`matchedExistingSkillSlug\` empty.
- When recommending \`keep\`, leave both matched slug fields empty.
- Keep rationales concise and specific.
- Call \`save_skill_overlap_review\` exactly once with the full review.
  `.trim();
}

export function buildSkillOverlapReviewUserPrompt(
  book: BookMetadata,
  candidateBlueprint: SkillBlueprint,
  existingSkills: ExistingSkill[],
): string {
  return `
Review the candidate skill family for "${book.title}" against the current skill collection.

Return:
- \`summary\`: a brief overall assessment of the overlap situation
- \`decisions\`: one item for the main skill and one item for each subskill
- For each decision include:
  - \`candidateSlug\`
  - \`outcome\`
  - \`matchedExistingSkillSlug\`
  - \`matchedCandidateSkillSlug\`
  - \`rationale\`

Candidate skill family:
${formatCandidateFamily(candidateBlueprint)}

Existing skills:
${formatExistingSkills(existingSkills)}
  `.trim();
}
