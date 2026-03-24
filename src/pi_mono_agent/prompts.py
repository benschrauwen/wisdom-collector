from __future__ import annotations

from pathlib import Path


PROMPT_DIR = Path(__file__).resolve().parents[2] / "prompts"


def load_prompt(filename: str, **kwargs: str) -> str:
    """Load and render a prompt template from the prompts directory."""
    template = (PROMPT_DIR / filename).read_text(encoding="utf-8")
    return template.format(**kwargs)
