# skill-extractor

`skill-extractor` bootstraps a community repo for turning books into reusable AI skill documents under `skills/`.

The project uses the TypeScript `pi-mono` runtime packages:
- `@mariozechner/pi-agent-core` for the agent loop and structured tool calls
- `@mariozechner/pi-ai` for provider/model selection and environment-based auth

The default pipeline is intentionally simple:
1. Load a book from `pdf`, `md`, `txt`, or another text-like file.
2. Normalize and chunk the book into prompt-sized sections.
3. Run a chunk-analysis agent that extracts reusable procedures, heuristics, and prompts.
4. Run a synthesis agent that turns those notes into a final skill blueprint.
5. Write the final skill into `skills/<skill-slug>/`.

## Quick Start

```bash
npm install
cp .env.example .env
```

Add the provider key you already have locally, for example:

```bash
OPENAI_API_KEY=...
ANTHROPIC_API_KEY=...
GEMINI_API_KEY=...
```

Then run the extractor:

```bash
npm run extract -- --input "/absolute/path/to/book.pdf"
```

Or choose a different provider/model:

```bash
npm run extract -- --input "/absolute/path/to/book.md" --provider anthropic --model claude-sonnet-4-20250514
```

## CLI Options

```bash
npm run extract -- --help
```

Key options:
- `--input`: source document path
- `--output`: output root, defaults to `skills`
- `--provider`: LLM provider, defaults to `openai`
- `--model`: model id for the provider
- `--thinking`: reasoning level, defaults to `medium`
- `--chunk-size`: approximate max characters per chunk, defaults to `100000`
- `--overlap`: approximate overlap between chunks, defaults to `1200`
- `--max-chunks`: useful for cheap trial runs on long books
- `--title` / `--author`: override metadata detection

## Output Layout

Each run creates a folder like:

```text
skills/<slug>/
  SKILL.md
```

- `SKILL.md` is the agent-facing artifact to keep in the community collection.

## Project Structure

```text
src/
  agents/
  loaders/
  pipeline/
  prompts/
  renderers/
  utils/
skills/
```

## Notes

- `books/` and `sources/` are ignored by default so raw source material is not committed accidentally.
- The prompts are stored in `src/prompts/` and are meant to be edited as the project evolves.
- The framework is intentionally small so the community can swap in better prompts, more stages, or different output formats without refactoring the entire repo.
