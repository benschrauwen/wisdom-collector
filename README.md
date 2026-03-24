# skill-extractor

**Turn the world's best books into reusable skills for AI agents.**

---

AI agents are rapidly becoming high-level managers — planning work, delegating tasks, making judgment calls, and coordinating across teams. But most agents today operate on raw intelligence alone, without the accumulated wisdom that makes human managers effective.

That wisdom already exists. It lives in books: decades of distilled experience on leadership, strategy, operations, negotiation, systems thinking, and more. **skill-extractor** is an open-source pipeline that converts books into structured skill documents (`SKILL.md` files) that any AI agent can load and apply.

The goal of this repository is to build **a community-curated collection of the best skills, extracted from the best books** — so that every agent, in every framework, can benefit from humanity's collected expertise.

## How It Works

The extraction pipeline is intentionally simple:

1. **Load** a book from PDF, Markdown, plain text, or another text-like format.
2. **Chunk** the content into prompt-sized sections with configurable overlap.
3. **Analyze** each chunk with an LLM agent that extracts reusable procedures, heuristics, and decision frameworks.
4. **Synthesize** the extracted notes into a final, structured skill document.
5. **Write** the result into `skills/<skill-slug>/SKILL.md`.

The output is a clean, agent-readable skill Markdown file.

## Contributing Skills

**This is the heart of the project.** We want people to extract skills from books and contribute them back to the collection. The more skills we curate, the more capable every agent becomes.

### What makes a good contribution

- Skills extracted from high-quality, well-regarded books
- Clear, actionable frameworks that an agent can apply (not just summaries)
- Proper attribution to the source book and author

### Licensing requirement

You **must** have the right to create derivative works from the source material. This means:

- **Public domain works** — always fine
- **Books you have authored or co-authored** — always fine
- **Books with a license that permits derivative works** (e.g., Creative Commons)
- **Fair use / fair dealing** — extracting principles, frameworks, and heuristics (not reproducing prose) generally qualifies, but use your judgment

**Do not** commit raw book text, full chapters, or substantial verbatim excerpts. The pipeline is designed to distill *principles and procedures*, not to reproduce copyrighted content. The `books/` and `sources/` directories are gitignored for this reason.

### How to contribute

1. Fork this repo
2. Run the extractor on your book (see [Quick Start](#quick-start) below)
3. Review and refine the generated `SKILL.md` — the LLM output is a strong draft, but human judgment makes it great
4. Open a pull request with your new `skills/<skill-slug>/` folder

## Quick Start

```bash
npm install
cp .env.example .env
```

Add the API key in .env for your preferred provider:

```bash
OPENAI_API_KEY=...
ANTHROPIC_API_KEY=...
GEMINI_API_KEY=...
```

Run the extractor:

```bash
npm run extract -- --input "/path/to/book.pdf"
```

## CLI Options

```bash
npm run extract -- --help
```

| Option | Description | Default |
|---|---|---|
| `--input` | Source document path | *(required)* |
| `--output` | Output root directory | `skills` |
| `--provider` | LLM provider (`openai`, `anthropic`, `gemini`) | `openai` |
| `--model` | Model ID for the provider | provider default |
| `--thinking` | Reasoning level | `medium` |
| `--chunk-size` | Approximate max characters per chunk | `100000` |
| `--overlap` | Approximate overlap between chunks | `1200` |
| `--max-chunks` | Limit chunks (useful for cheap trial runs) | all |
| `--title` | Override detected book title | auto-detect |
| `--author` | Override detected author | auto-detect |

## Current Skill Collection

<!-- extracted-books:start -->

<!-- extracted-books:end -->

## Project Structure

```text
src/
  agents/       # LLM agent definitions for analysis and synthesis
  loaders/      # File readers (PDF, Markdown, plain text)
  pipeline/     # Orchestration logic
  prompts/      # Prompt templates (designed to be edited and improved)
  renderers/    # Output formatters
  utils/        # Chunking, metadata, helpers
skills/         # The community skill collection
```

## Design Principles

- **Small and hackable.** The framework is intentionally minimal so the community can swap in better prompts, add pipeline stages, or change output formats without refactoring everything.
- **Provider-agnostic.** Works with OpenAI, Anthropic, and Google out of the box via `@mariozechner/pi-ai`.
- **Agent-framework-agnostic.** The output is plain Markdown. Use it with any agent system.
- **No raw source material in the repo.** `books/` and `sources/` are gitignored. Only distilled skill artifacts are committed.

## License

MIT

