# Skill Extractor (pi-mono, TypeScript)

A starter repository for building a community-maintained collection of AI skills distilled from books.

## What this repo does

This repo provides a **simple pi-mono agent framework** for:
1. ingesting a book file (PDF, Markdown, or plain text),
2. generating concise chapter summaries,
3. extracting actionable procedures,
4. compiling them into a reusable `SKILL.md` document.

## Repo layout

- `src/` – core TypeScript framework and CLI.
- `prompts/` – prompt templates for each pipeline stage.
- `tests/` – Node test coverage for plan and prompt rendering.

## Quick start (npm)

```bash
npm install
npm test
```

Run the pipeline planner (dry run):

```bash
npm run run -- --input ./book.pdf --skill-name negotiation-playbook --domain business
```

## pi-mono pipeline

The framework is intentionally minimal and model-agnostic. It uses a linear "mono" flow:

1. **Normalize** file content into clean text chunks.
2. **Summarize** each chunk/chapter.
3. **Extract** methods/checklists/decision rules.
4. **Synthesize** an agent-ready `SKILL.md`.
5. **Evaluate** quality with a rubric and revision loop.

## Community scaling workflow

1. Contributor adds a new book source.
2. Run `npm run run -- --input ...` to generate prompts and plan.
3. Execute prompts with an LLM to produce `skills/<name>/SKILL.md`.
4. Run rubric checks and open PR.

## Next steps

- Add actual LLM provider adapters (OpenAI, local models, etc.).
- Add PDF/EPUB parsers for direct ingestion.
- Add CI checks that validate generated `SKILL.md` metadata quality.
