import type { ThinkingLevel } from "@mariozechner/pi-ai";

import { runStructuredToolAgent } from "./run-structured-tool-agent.js";
import { buildSkillFinalizationSystemPrompt, buildSkillFinalizationUserPrompt } from "../prompts/skill-finalization.js";
import type { AnyModel, BookMetadata, ChunkAnalysis, ExistingSkill, SkillBlueprint, SkillOverlapReview } from "../types.js";
import { skillBlueprintSchema, toSkillBlueprint } from "../utils/skill-blueprint.js";

interface FinalizeSkillOptions {
  model: AnyModel;
  thinkingLevel: ThinkingLevel;
  book: BookMetadata;
  chunkAnalyses: ChunkAnalysis[];
  candidateBlueprint: SkillBlueprint;
  overlapReview: SkillOverlapReview;
  referencedExistingSkills: ExistingSkill[];
}

export async function finalizeSkillWithAgent(options: FinalizeSkillOptions): Promise<SkillBlueprint> {
  const payload = await runStructuredToolAgent({
    model: options.model,
    thinkingLevel: options.thinkingLevel,
    systemPrompt: buildSkillFinalizationSystemPrompt(options.book),
    userPrompt: buildSkillFinalizationUserPrompt(
      options.book,
      options.chunkAnalyses,
      options.candidateBlueprint,
      options.overlapReview,
      options.referencedExistingSkills,
    ),
    tool: {
      name: "save_skill_blueprint",
      label: "Save Skill Blueprint",
      description: "Persist the final structured skill blueprint after overlap review and any merges.",
      parameters: skillBlueprintSchema,
    },
  });

  return toSkillBlueprint(options.book, payload);
}
