import { Type, type Static, type ThinkingLevel } from "@mariozechner/pi-ai";

import { runStructuredToolAgent } from "./run-structured-tool-agent.js";
import { buildSkillSynthesisSystemPrompt, buildSkillSynthesisUserPrompt } from "../prompts/skill-synthesis.js";
import type { AnyModel, BookMetadata, ChunkAnalysis, SkillBlueprint, SkillFileBlueprint } from "../types.js";
import { slugify } from "../utils/slugify.js";

const skillFileSchema = Type.Object({
  slug: Type.String({ minLength: 1 }),
  skillTitle: Type.String({ minLength: 1 }),
  description: Type.String({ minLength: 1 }),
  skillBody: Type.String({ minLength: 1 }),
});

const skillBlueprintSchema = Type.Object({
  slug: Type.String({ minLength: 1 }),
  skillTitle: Type.String({ minLength: 1 }),
  description: Type.String({ minLength: 1 }),
  skillBody: Type.String({ minLength: 1 }),
  subskills: Type.Array(skillFileSchema),
});

type SkillBlueprintPayload = Static<typeof skillBlueprintSchema>;
type SkillFilePayload = Static<typeof skillFileSchema>;

function cleanText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function stripMarkdownCodeFence(markdown: string): string {
  const trimmed = markdown.trim();
  const fencedMatch = trimmed.match(/^```(?:markdown|md)?\s*\n?([\s\S]*?)\n?```$/i);
  return fencedMatch ? fencedMatch[1].trim() : trimmed;
}

function stripFrontmatter(markdown: string): string {
  const trimmed = stripMarkdownCodeFence(markdown);
  const frontmatterMatch = trimmed.match(/^---\s*\n[\s\S]*?\n---\s*/);
  return frontmatterMatch ? trimmed.slice(frontmatterMatch[0].length).trim() : trimmed;
}

function ensureTopLevelHeading(skillTitle: string, skillBody: string): string {
  const trimmed = skillBody.trim();

  if (!trimmed) {
    return `# ${skillTitle}`;
  }

  if (/^#\s+/.test(trimmed)) {
    return trimmed;
  }

  return `# ${skillTitle}\n\n${trimmed}`;
}

function normalizeSkillBody(skillTitle: string, skillBody: string): string {
  const withoutFrontmatter = stripFrontmatter(skillBody).replace(/\r\n/g, "\n").trim();
  return ensureTopLevelHeading(skillTitle, withoutFrontmatter);
}

function isBookDerivedSlug(book: BookMetadata, candidateSlug: string): boolean {
  const candidateTokens = new Set(candidateSlug.split("-").filter(Boolean));
  const bookTokens = new Set(slugify(book.title).split("-").filter(Boolean));

  if (candidateTokens.size === 0 || bookTokens.size === 0) {
    return false;
  }

  let overlap = 0;
  for (const token of candidateTokens) {
    if (bookTokens.has(token)) {
      overlap += 1;
    }
  }

  return overlap / candidateTokens.size >= 0.6;
}

function resolveSkillSlug(book: BookMetadata, requestedSlug: string, skillTitle: string): string {
  const normalizedRequestedSlug = slugify(requestedSlug);
  const titleSlug = slugify(skillTitle);
  return (
    (normalizedRequestedSlug && !isBookDerivedSlug(book, normalizedRequestedSlug)
      ? normalizedRequestedSlug
      : titleSlug) ||
    normalizedRequestedSlug ||
    titleSlug ||
    slugify(book.title)
  );
}

function toSkillFileBlueprint(book: BookMetadata, payload: SkillFilePayload): SkillFileBlueprint {
  const skillTitle = cleanText(payload.skillTitle);
  const description = cleanText(payload.description);
  const slug = resolveSkillSlug(book, payload.slug, skillTitle);

  return {
    slug,
    skillTitle,
    description,
    skillBody: normalizeSkillBody(skillTitle, payload.skillBody),
  };
}

function toSkillBlueprint(book: BookMetadata, payload: SkillBlueprintPayload): SkillBlueprint {
  const mainSkill = toSkillFileBlueprint(book, payload);
  const seenSlugs = new Set([mainSkill.slug]);
  const subskills: SkillFileBlueprint[] = [];

  for (const subskill of payload.subskills) {
    const normalizedSubskill = toSkillFileBlueprint(book, subskill);

    if (seenSlugs.has(normalizedSubskill.slug)) {
      continue;
    }

    seenSlugs.add(normalizedSubskill.slug);
    subskills.push(normalizedSubskill);
  }

  return {
    ...mainSkill,
    subskills,
  };
}

interface SynthesizeSkillOptions {
  model: AnyModel;
  thinkingLevel: ThinkingLevel;
  book: BookMetadata;
  chunkAnalyses: ChunkAnalysis[];
}

export async function synthesizeSkillWithAgent(
  options: SynthesizeSkillOptions,
): Promise<SkillBlueprint> {
  const payload = await runStructuredToolAgent({
    model: options.model,
    thinkingLevel: options.thinkingLevel,
    systemPrompt: buildSkillSynthesisSystemPrompt(options.book),
    userPrompt: buildSkillSynthesisUserPrompt(options.book, options.chunkAnalyses),
    tool: {
      name: "save_skill_blueprint",
      label: "Save Skill Blueprint",
      description: "Persist the final structured skill blueprint synthesized from the book notes.",
      parameters: skillBlueprintSchema,
    },
  });

  return toSkillBlueprint(options.book, payload);
}
