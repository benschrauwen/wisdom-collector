from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path


@dataclass(slots=True)
class PipelineConfig:
    input_path: Path
    skill_name: str
    domain: str


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
