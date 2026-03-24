from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from .llm import LLMClient
from .prompts import load_prompt


@dataclass(slots=True)
class PipelineConfig:
    input_path: Path
    skill_name: str
    domain: str


@dataclass(slots=True)
class PipelineResult:
    stage: str
    prompt_path: str
    prompt: str
    output_path: Path
    output: str


def build_plan(config: PipelineConfig) -> list[dict[str, str]]:
    """Build the canonical pi-mono execution plan."""
    return [
        {
            "stage": "normalize",
            "goal": f"Convert {config.input_path.name} into normalized chapter chunks.",
            "prompt": "prompts/01_normalize_book.md",
        },
        {
            "stage": "summarize",
            "goal": "Generate chapter summaries with key claims and evidence.",
            "prompt": "prompts/02_summarize_chapter.md",
        },
        {
            "stage": "extract",
            "goal": "Extract reusable procedures, heuristics, and anti-patterns.",
            "prompt": "prompts/03_extract_skill_atoms.md",
        },
        {
            "stage": "synthesize",
            "goal": f"Produce skills/{config.skill_name}/SKILL.md for the {config.domain} domain.",
            "prompt": "prompts/04_synthesize_skill.md",
        },
        {
            "stage": "evaluate",
            "goal": "Score the output with a quality rubric and propose revisions.",
            "prompt": "prompts/05_evaluate_skill.md",
        },
    ]


def execute_plan(
    config: PipelineConfig,
    llm_client: LLMClient,
    *,
    output_root: Path,
) -> list[PipelineResult]:
    """Execute every plan stage with an LLM and persist stage outputs."""
    plan = build_plan(config)
    run_dir = output_root / config.skill_name
    run_dir.mkdir(parents=True, exist_ok=True)

    results: list[PipelineResult] = []
    for index, step in enumerate(plan, start=1):
        prompt_name = Path(step["prompt"]).name
        prompt = load_prompt(
            prompt_name,
            INPUT_PATH=str(config.input_path),
            SKILL_NAME=config.skill_name,
            DOMAIN=config.domain,
        )
        output = llm_client.complete(prompt, stage=step["stage"]).strip()

        output_path = run_dir / f"{index:02d}_{step['stage']}.md"
        output_path.write_text(output + "\n", encoding="utf-8")

        results.append(
            PipelineResult(
                stage=step["stage"],
                prompt_path=step["prompt"],
                prompt=prompt,
                output_path=output_path,
                output=output,
            )
        )

    return results
