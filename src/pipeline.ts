export type PipelineConfig = {
  inputPath: string;
  skillName: string;
  domain: string;
};

export type PipelineStep = {
  stage: "normalize" | "summarize" | "extract" | "synthesize" | "evaluate";
  goal: string;
  prompt: string;
};

export function buildPlan(config: PipelineConfig): PipelineStep[] {
  return [
    {
      stage: "normalize",
      goal: `Convert ${config.inputPath.split(/[\\/]/).at(-1)} into normalized chapter chunks.`,
      prompt: "prompts/01_normalize_book.md"
    },
    {
      stage: "summarize",
      goal: "Generate chapter summaries with key claims and evidence.",
      prompt: "prompts/02_summarize_chapter.md"
    },
    {
      stage: "extract",
      goal: "Extract reusable procedures, heuristics, and anti-patterns.",
      prompt: "prompts/03_extract_skill_atoms.md"
    },
    {
      stage: "synthesize",
      goal: `Produce skills/${config.skillName}/SKILL.md for the ${config.domain} domain.`,
      prompt: "prompts/04_synthesize_skill.md"
    },
    {
      stage: "evaluate",
      goal: "Score the output with a quality rubric and propose revisions.",
      prompt: "prompts/05_evaluate_skill.md"
    }
  ];
}
