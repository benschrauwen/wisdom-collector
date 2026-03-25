import type { ThinkingLevel } from "@mariozechner/pi-ai";

import { runStructuredToolAgent } from "./run-structured-tool-agent.js";
import { buildSkillSynthesisSystemPrompt, buildSkillSynthesisUserPrompt } from "../prompts/skill-synthesis.js";
import type { AnyModel, BookMetadata, ChunkAnalysis, SkillBlueprint } from "../types.js";
import { skillBlueprintSchema, toSkillBlueprint } from "../utils/skill-blueprint.js";

interface SynthesizeSkillOptions {
  model: AnyModel;
  thinkingLevel: ThinkingLevel;
  book: BookMetadata;
  chunkAnalyses: ChunkAnalysis[];
}

export async function synthesizeSkillCandidateWithAgent(
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
      description: "Persist the candidate structured skill blueprint synthesized from the book notes.",
      parameters: skillBlueprintSchema,
    },
  });

  return toSkillBlueprint(options.book, payload);
}
