import type { ChunkAnalysis, ExistingSkill, SkillBlueprint, SkillFileBlueprint, SkillOverlapReview, SkillSource } from "../types.js";

const MAX_EXISTING_SKILL_BODY_CHARS = 10000;

function truncateMarkdown(markdown: string, maxChars: number): string {
  const normalized = markdown.replace(/\r\n/g, "\n").trim();

  if (normalized.length <= maxChars) {
    return normalized;
  }

  return `${normalized.slice(0, maxChars).trimEnd()}\n...[truncated]`;
}

function formatSourceMentions(sourceMentions: SkillSource[]): string {
  if (sourceMentions.length === 0) {
    return "No recorded sources.";
  }

  return sourceMentions
    .map((source) => (source.author ? `*${source.title}* by ${source.author}` : `*${source.title}*`))
    .join(" | ");
}

function formatCandidateSkill(label: string, skill: SkillFileBlueprint): string {
  return [
    label,
    `Slug: ${skill.slug}`,
    `Title: ${skill.skillTitle}`,
    `Description: ${skill.description}`,
    "Candidate markdown body:",
    skill.skillBody.trim(),
  ].join("\n");
}

export function formatChunkAnalyses(chunkAnalyses: ChunkAnalysis[]): string {
  return chunkAnalyses
    .map((analysis) =>
      [
        `Chunk ${analysis.chunkIndex + 1}`,
        `Overview: ${analysis.overview}`,
        analysis.notes,
      ].join("\n\n"),
    )
    .join("\n\n---\n\n");
}

export function formatExistingSkills(
  existingSkills: ExistingSkill[],
  emptyMessage = "No existing skills were found in the output directory.",
): string {
  if (existingSkills.length === 0) {
    return emptyMessage;
  }

  return existingSkills
    .map((skill, index) =>
      [
        `Existing skill ${index + 1}`,
        `Slug: ${skill.slug}`,
        `Title: ${skill.skillTitle}`,
        `Description: ${skill.description || "No description."}`,
        `Sources: ${formatSourceMentions(skill.sourceMentions)}`,
        "Current markdown body excerpt:",
        truncateMarkdown(skill.skillBody, MAX_EXISTING_SKILL_BODY_CHARS),
      ].join("\n"),
    )
    .join("\n\n");
}

export function formatCandidateFamily(blueprint: SkillBlueprint): string {
  const sections = [formatCandidateSkill("Candidate main skill", blueprint)];

  if (blueprint.subskills.length > 0) {
    sections.push(
      ...blueprint.subskills.map((subskill, index) => formatCandidateSkill(`Candidate subskill ${index + 1}`, subskill)),
    );
  }

  return sections.join("\n\n");
}

export function formatOverlapReview(review: SkillOverlapReview): string {
  return [
    `Summary: ${review.summary}`,
    "",
    ...review.decisions.map((decision, index) =>
      [
        `Decision ${index + 1}`,
        `Candidate slug: ${decision.candidateSlug}`,
        `Outcome: ${decision.outcome}`,
        `Matched existing skill slug: ${decision.matchedExistingSkillSlug ?? "None"}`,
        `Matched candidate skill slug: ${decision.matchedCandidateSkillSlug ?? "None"}`,
        `Rationale: ${decision.rationale}`,
      ].join("\n"),
    ),
  ].join("\n");
}
