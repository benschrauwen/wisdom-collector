# Skill Extractor (pi-mono)

A starter repository for building a community-maintained collection of AI skills distilled from books.

## What this repo does

This repo provides a **simple pi-mono agent framework** for:
1. ingesting a book file (PDF, Markdown, or plain text),
2. generating concise chapter summaries,
3. extracting actionable procedures,
4. compiling them into a reusable `SKILL.md` document.

## Repo layout

- `src/pi_mono_agent/` – core framework and CLI.
- `prompts/` – prompt templates for each pipeline stage.
- `tests/` – lightweight tests for prompt loading/rendering.

## Quick start

```bash
python -m venv .venv
source .venv/bin/activate
pip install -e .
```

Run the pipeline planner (dry run):

```bash
pi-mono run --input ./book.pdf --skill-name negotiation-playbook --domain business
```

This outputs an execution plan and generated prompts you can feed into your preferred LLM runtime.

## pi-mono pipeline

The framework is intentionally minimal and model-agnostic. It uses a linear "mono" flow:

1. **Normalize** file content into clean text chunks.
2. **Summarize** each chunk/chapter.
3. **Extract** methods/checklists/decision rules.
4. **Synthesize** an agent-ready `SKILL.md`.
5. **Evaluate** quality with a rubric and revision loop.

## Community scaling workflow

1. Contributor adds a new book source.
2. Run `pi-mono run ...` to generate prompts and plan.
3. Execute prompts with an LLM to produce `skills/<name>/SKILL.md`.
4. Run rubric checks and open PR.

## Next steps

- Add actual LLM provider adapters (OpenAI, local models, etc.).
- Add PDF/EPUB parsers for direct ingestion.
- Add CI checks that validate generated `SKILL.md` metadata quality.
