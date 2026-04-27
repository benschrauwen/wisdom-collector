---
name: structured-root-cause-analysis
description: >-
  Guides systematic diagnosis of an unexplained performance deviation by building an IS/IS NOT specification, surfacing distinctions and changes, testing candidate causes against every data point, and confirming the true cause before acting. Use this when something is failing or broken and no one yet knows why—common triggers include "we don't know what caused this," "this used to work," "find the root cause," or any situation where the cause of a gap between expected and actual performance is unknown.
---

# Structured root cause analysis

Use this process when an expected level of performance is **not** being achieved **and** the cause is **unknown**. If you already know the cause, you need a decision or a fix plan—not this process.

---

## Before you start: confirm the problem type

Two valid problem structures:

| Type | What it means |
|---|---|
| **Standard deviation** | Performance once met the standard, then declined — a change occurred somewhere. |
| **Day-one deviation** | Performance never met the standard — a required condition never existed. |

Both use the same six-step procedure below.

**Scope test:** Ask "Can the effect described in the problem statement be explained right now?" If yes, you are at the wrong level of abstraction — back up to the unexplained level before proceeding.

---

## Step 1 — State the problem

Write: **one object + one malfunction.**

> Good: "Number One Filter Leaking Oil"
> Weak: "Low productivity in Q3" (vague, bundles multiple issues)

Do not bundle two separate deviations into a single statement. If you have multiple problems, triage them first (see *Rational process selection*) and run this process once per problem.

---

## Step 2 — Specify the problem (IS / IS NOT table)

Build a table across four dimensions. For each, identify:
- **IS** — what the deviation actually is
- **IS NOT** — the closest logical comparator that *could* be affected but is not

| Dimension | Specifying questions | IS | IS NOT |
|---|---|---|---|
| **WHAT** | What object has the deviation? What exactly is the malfunction? | | |
| **WHERE** | Where geographically? Where on the object? | | |
| **WHEN** | When first observed? Pattern since then? Where in the object's lifecycle? | | |
| **EXTENT** | How many objects? How large is the deviation? Trend: growing, stable, shrinking? | | |

> **Rule:** Answer every cell, even if the answer is "N/A" or "no restriction observed." Skipping destroys the objectivity of the comparison.

The IS NOT column is not "what doesn't apply"—it is "what *could* logically be affected by the same cause but is not." Picking the wrong comparator is the most common specification error.

---

## Step 3 — Develop possible causes

Use one or both routes; neither alone is always sufficient.

### Route A — Knowledge, experience, brainstorming
- Generate freely; do not evaluate during generation.
- State each cause as a **mechanism**: not just *what* but *how it would produce the observed deviation*.

### Route B — Distinctions → Changes (often more powerful)
1. For each IS vs. IS NOT pair, ask: *"What is distinctive about the IS data compared with the IS NOT data?"*
2. For each distinction, ask: *"What changed in, on, around, or about this distinction?"*
3. Focus changes proximate to when and where the deviation first appeared.
4. For each change or distinction, ask: *"How could this produce the deviation described in the problem statement?"*

Both routes feed the same candidate cause list.

---

## Step 4 — Test each possible cause against the specification

For every candidate cause, apply: **"If this is the true cause, then how does it explain each IS and IS NOT data point?"**

A true cause must account for **every dimension** without requiring far-fetched assumptions.

- Track all assumptions each explanation requires.
- Do not eliminate a cause just because one dimension is hard to explain — note the assumption and compare assumption quality later.
- Do not prematurely discard plausible causes; keep them in until testing rules them out.

---

## Step 5 — Identify the most probable cause

Select the cause that explains all specification facts using the **fewest, simplest, and most reasonable assumptions**.

Compare candidates on both:
- **Quantity** of assumptions required
- **Quality** (plausibility) of each assumption

The cause with the lightest, most credible assumption load is most probable.

---

## Step 6 — Verify / confirm

Choose the cheapest, fastest, safest method available:

| Method | When to use |
|---|---|
| **Observe** | Watch whether the postulated cause produces the effect under normal conditions. |
| **Experiment** | Swap or isolate the suspected variable; observe whether the deviation appears or disappears. |
| **Try a fix and monitor** | Reverse the suspected change; see if the deviation stops. |
| **Verify assumptions** | When physical confirmation is impossible (evidence destroyed, event unrepeatable), systematically confirm that each assumption the cause relies on is actually true. |

Verification is not optional. A highly probable cause that fails verification is not the true cause — return to Step 5.

---

## Key diagnostic prompts (use verbatim)

- *"What is distinctive about [IS] when compared with [IS NOT]?"*
- *"What changed in, on, around, or about this distinction?"*
- *"If this is the true cause, then how does it explain [this IS / IS NOT data point]?"*
- *"How could this distinction or change have produced the deviation described in the problem statement?"*

---

## Anti-patterns

- **Vague problem statement** — a fuzzy name makes the specification incoherent; fix the statement first.
- **Thin specification** — too few IS/IS NOT entries leave the cause space unconstrained; fill every cell.
- **Assumption creep** — treating an unverified assumption as a confirmed fact during Step 4; label assumptions explicitly and keep them separate from facts.
- **Skipping verification** — high probability is not confirmation; act on verified cause only.
- **Jumping to solutions** — if the cause is already known, this process is not needed; go directly to decision analysis or action planning.

---

## Related skills
- [Rational process selection](../rational-process-selection/SKILL.md): Helps choose the right thinking mode for any situation by matching the core question being asked to one of four structured rational processes. Use this when a team or individual faces a complex situation and is unsure whether they need to diagnose a cause, make a decision, anticipate future risk, or simply clarify what is happening—common triggers include 'where do we even start,' 'we keep solving the wrong problem,' or any moment of ambiguity before analytical work begins.

## Source note
Extracted from *The New Rational Manager* by Charles H. Kepner, Benjamin B. Tregoe.