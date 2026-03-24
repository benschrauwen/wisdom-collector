from pathlib import Path

from pi_mono_agent.pipeline import PipelineConfig, build_plan


def test_build_plan_has_five_steps() -> None:
    plan = build_plan(
        PipelineConfig(
            input_path=Path("book.pdf"),
            skill_name="test-skill",
            domain="general",
        )
    )
    assert len(plan) == 5
    assert plan[0]["stage"] == "normalize"
    assert plan[-1]["stage"] == "evaluate"
