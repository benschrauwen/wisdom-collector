import { Type, type Static, type ThinkingLevel } from "@mariozechner/pi-ai";

import { runStructuredToolAgent } from "./run-structured-tool-agent.js";
import { buildSkillOverlapReviewSystemPrompt, buildSkillOverlapReviewUserPrompt } from "../prompts/skill-overlap-review.js";
import type { AnyModel, BookMetadata, ExistingSkill, SkillBlueprint, SkillOverlapReview } from "../types.js";
import { normalizeSkillOverlapReview } from "../utils/skill-overlap.js";

const skillOverlapDecisionSchema = Type.Object({
  candidateSlug: Type.String({ minLength: 1 }),
  outcome: Type.Union([
    Type.Literal("keep"),
    Type.Literal("merge-with-existing"),
    Type.Literal("drop-as-duplicate"),
  ]),
  matchedExistingSkillSlug: Type.String(),
  matchedCandidateSkillSlug: Type.String(),
  rationale: Type.String({ minLength: 1 }),
});

const skillOverlapReviewSchema = Type.Object({
  summary: Type.String({ minLength: 1 }),
  decisions: Type.Array(skillOverlapDecisionSchema),
});

type SkillOverlapReviewPayload = Static<typeof skillOverlapReviewSchema>;

interface ReviewSkillOverlapOptions {
  model: AnyModel;
  thinkingLevel: ThinkingLevel;
  book: BookMetadata;
  candidateBlueprint: SkillBlueprint;
  existingSkills: ExistingSkill[];
}

export async function reviewSkillOverlapWithAgent(
  options: ReviewSkillOverlapOptions,
): Promise<SkillOverlapReview> {
  const payload = await runStructuredToolAgent({
    model: options.model,
    thinkingLevel: options.thinkingLevel,
    systemPrompt: buildSkillOverlapReviewSystemPrompt(options.book),
    userPrompt: buildSkillOverlapReviewUserPrompt(options.book, options.candidateBlueprint, options.existingSkills),
    tool: {
      name: "save_skill_overlap_review",
      label: "Save Skill Overlap Review",
      description: "Persist overlap review decisions for the candidate skill family.",
      parameters: skillOverlapReviewSchema,
    },
  });

  return normalizeSkillOverlapReview(
    options.candidateBlueprint,
    options.existingSkills,
    payload as SkillOverlapReviewPayload,
  );
}
