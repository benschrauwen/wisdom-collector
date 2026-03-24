from pathlib import Path

from pi_mono_agent.llm import MockLLMClient
from pi_mono_agent.pipeline import PipelineConfig, build_plan, execute_plan


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


def test_execute_plan_writes_stage_outputs(tmp_path: Path) -> None:
    cfg = PipelineConfig(
        input_path=Path("book.pdf"),
        skill_name="negotiation",
        domain="business",
    )

    results = execute_plan(cfg, MockLLMClient(), output_root=tmp_path)

    assert len(results) == 5
    assert results[0].output_path.exists()
    assert results[0].output_path.read_text(encoding="utf-8").startswith("[MOCK:normalize]")
    assert results[-1].output_path.name == "05_evaluate.md"
