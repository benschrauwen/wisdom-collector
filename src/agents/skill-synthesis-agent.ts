import { Type, type Static, type ThinkingLevel } from "@mariozechner/pi-ai";

import { runStructuredToolAgent } from "./run-structured-tool-agent.js";
import { buildSkillSynthesisSystemPrompt, buildSkillSynthesisUserPrompt } from "../prompts/skill-synthesis.js";
import type { AnyModel, BookMetadata, ChunkAnalysis, SkillBlueprint } from "../types.js";
import { slugify } from "../utils/slugify.js";

const skillBlueprintSchema = Type.Object({
  slug: Type.String({ minLength: 1 }),
  skillTitle: Type.String({ minLength: 1 }),
  description: Type.String({ minLength: 1 }),
  summary: Type.String({ minLength: 1 }),
  whenToUse: Type.Array(Type.String({ minLength: 1 })),
  requiredInputs: Type.Array(Type.String({ minLength: 1 })),
  workflow: Type.Array(Type.String({ minLength: 1 })),
  heuristics: Type.Array(Type.String({ minLength: 1 })),
  antiPatterns: Type.Array(Type.String({ minLength: 1 })),
  starterPrompts: Type.Array(Type.String({ minLength: 1 })),
  sourceNotes: Type.Array(Type.String({ minLength: 1 })),
});

type SkillBlueprintPayload = Static<typeof skillBlueprintSchema>;

function cleanText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function stripLeadingListMarker(value: string): string {
  return value.replace(/^(?:[-*]\s+|\d+[.)]\s+)/, "");
}

function canonicalizeForDedup(value: string): string {
  return value
    .toLowerCase()
    .replace(/->|→/g, " ")
    .replace(/["'`]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasHighTokenOverlap(left: string, right: string): boolean {
  if (!left || !right) {
    return false;
  }

  const leftTokens = new Set(left.split(" ").filter(Boolean));
  const rightTokens = new Set(right.split(" ").filter(Boolean));
  const minTokenCount = Math.min(leftTokens.size, rightTokens.size);

  if (minTokenCount < 8) {
    return false;
  }

  let overlap = 0;
  for (const token of leftTokens) {
    if (rightTokens.has(token)) {
      overlap += 1;
    }
  }

  return overlap / minTokenCount >= 0.9;
}

function dedupeList(values: string[]): string[] {
  const kept: Array<{ value: string; canonical: string }> = [];

  for (const value of values) {
    const canonical = canonicalizeForDedup(value);
    if (!canonical) {
      continue;
    }

    const isDuplicate = kept.some(
      (entry) => entry.canonical === canonical || hasHighTokenOverlap(entry.canonical, canonical),
    );

    if (!isDuplicate) {
      kept.push({ value, canonical });
    }
  }

  return kept.map((entry) => entry.value);
}

function cleanList(values: string[], { stripListMarkers = false }: { stripListMarkers?: boolean } = {}): string[] {
  const cleaned = values
    .map((value) => {
      const normalized = stripListMarkers ? stripLeadingListMarker(value) : value;
      return cleanText(normalized);
    })
    .filter(Boolean);

  return dedupeList(cleaned);
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

function toSkillBlueprint(book: BookMetadata, payload: SkillBlueprintPayload): SkillBlueprint {
  const skillTitle = cleanText(payload.skillTitle);
  const requestedSlug = slugify(payload.slug);
  const titleSlug = slugify(skillTitle);
  const slug =
    (requestedSlug && !isBookDerivedSlug(book, requestedSlug) ? requestedSlug : titleSlug) ||
    requestedSlug ||
    titleSlug ||
    slugify(book.title);
  const summary = cleanText(payload.summary);
  const description = cleanText(payload.description) || summary;

  return {
    slug,
    skillTitle,
    description,
    summary,
    whenToUse: cleanList(payload.whenToUse, { stripListMarkers: true }),
    requiredInputs: cleanList(payload.requiredInputs, { stripListMarkers: true }),
    workflow: cleanList(payload.workflow, { stripListMarkers: true }),
    heuristics: cleanList(payload.heuristics, { stripListMarkers: true }),
    antiPatterns: cleanList(payload.antiPatterns, { stripListMarkers: true }),
    starterPrompts: cleanList(payload.starterPrompts, { stripListMarkers: true }),
    sourceNotes: cleanList(payload.sourceNotes, { stripListMarkers: true }),
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
