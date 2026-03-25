# Wisdom Collector

<p align="center">
  <img src="banner.png" alt="Wisdom Collector banner" />
</p>

<p align="center">
  <em>Distill timeless wisdom from the greatest books ever written into reusable agent skills to feed the agentic managers and CEOs of tomorrow..</em>
</p>

AI agents are increasingly handling planning, delegation, coordination, and judgment calls. Many of the practices they need already exist in books on leadership, strategy, operations, negotiation, and systems thinking.

**wisdom-collector** is an open collection of reusable skills distilled from books, plus a pipeline that turns source material into structured `SKILL.md` documents that others can review and improve.

This is not a book-summary project. The goal is to build a reusable collection of skills grounded in the original source material.

## How It Works

The extraction pipeline is simple:

1. **Load and parse** a book from PDF, Markdown, plain text, or another text-like format.
2. **Chunk** the content into prompt-sized sections with configurable overlap.
3. **Analyze** each chunk with an LLM agent that extracts reusable procedures, heuristics, and decision frameworks.
4. **Synthesize** the extracted notes into a final, structured skill document, checking the existing collection first to avoid overlap.
5. **Write or extend** the result in `skills/<skill-slug>/SKILL.md` with proper source attribution.

The output is a skill Markdown file that another agent can load and apply.

Because the pipeline works from parsed source material, it does not ask the LLM to summarize a book from memory. That keeps the output closer to the source and easier to review.

## Contributing Skills

The main goal is to extract skills from books and contribute them back to the collection.

### What makes a good contribution

- Skills extracted from high-quality, well-regarded books
- Clear skills and frameworks that an agent can apply, not book summaries
- Extends an existing skill when the new source deepens the same capability instead of creating a near-duplicate
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
3. Review and refine the generated or extended `SKILL.md`
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

<!-- extracted-book:the-effective-executive-the-definitive-guide-to-getting-the-right-things-done-peter-f-drucker -->
### The Effective Executive: The Definitive Guide to Getting the Right Things Done
Author: Peter F. Drucker

Extracted skills:
- [Executive Effectiveness](skills/executive-effectiveness/SKILL.md)
<!-- /extracted-book:the-effective-executive-the-definitive-guide-to-getting-the-right-things-done-peter-f-drucker -->

<!-- extracted-book:high-output-management-andy-grove -->
### High Output Management
Author: Andy Grove

Extracted skills:
- [High-Leverage Team Management](skills/high-leverage-team-management/SKILL.md)
<!-- /extracted-book:high-output-management-andy-grove -->

<!-- extracted-book:zero-to-one-notes-on-startups-or-how-to-build-the-future-peter-thiel -->
### Zero to One: Notes on Startups, or How to Build the Future
Author: Peter Thiel

Extracted skills:
- [First-Principles Startup Strategy](skills/first-principles-startup-strategy/SKILL.md)
<!-- /extracted-book:zero-to-one-notes-on-startups-or-how-to-build-the-future-peter-thiel -->

<!-- extracted-book:thinking-in-systems-a-primer-donella-h-meadows -->
### Thinking in Systems: A Primer
Author: Donella H. Meadows

Extracted skills:
- [System Behavior Diagnosis and Leverage](skills/system-behavior-diagnosis-and-leverage/SKILL.md)
<!-- /extracted-book:thinking-in-systems-a-primer-donella-h-meadows -->

<!-- extracted-book:the-first-90-days-critical-success-strategies-for-new-leaders-at-all-levels-michael-watkins -->
### The First 90 Days: Critical Success Strategies for New Leaders at All Levels
Author: Michael Watkins

Extracted skills:
- [Transition acceleration](skills/transition-acceleration/SKILL.md)
<!-- /extracted-book:the-first-90-days-critical-success-strategies-for-new-leaders-at-all-levels-michael-watkins -->

<!-- extracted-book:the-negotiation-book-your-definitive-guide-to-successful-negotiating-steve-gates -->
### The Negotiation Book: Your Definitive Guide to Successful Negotiating
Author: Steve Gates

Extracted skills:
- [Strategic Value-Based Negotiation](skills/strategic-value-based-negotiation/SKILL.md)
<!-- /extracted-book:the-negotiation-book-your-definitive-guide-to-successful-negotiating-steve-gates -->

<!-- extracted-book:the-innovators-dilemma-clayton-m-christensen -->
### The Innovator’s Dilemma
Author: Clayton M. Christensen

Extracted skills:
- [Disruption Response Design](skills/disruption-response-design/SKILL.md)
<!-- /extracted-book:the-innovators-dilemma-clayton-m-christensen -->

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

- **Small and editable.** The framework stays minimal so you can swap prompts, add pipeline stages, or change output formats without major refactors.
- **Provider-agnostic.** Works with OpenAI, Anthropic, and Google via `@mariozechner/pi-ai`.
- **Agent-framework-agnostic.** The output is plain Markdown. Use it with any agent system.
- **No raw source material in the repo.** `books/` and `sources/` are gitignored. Only distilled skill artifacts are committed.

## License

MIT














