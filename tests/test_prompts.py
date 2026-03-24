from pi_mono_agent.prompts import load_prompt


def test_prompt_rendering() -> None:
    rendered = load_prompt(
        "04_synthesize_skill.md",
        INPUT_PATH="book.pdf",
        SKILL_NAME="negotiation",
        DOMAIN="business",
    )
    assert "skills/negotiation/SKILL.md" in rendered
    assert "business" in rendered
