---
name: hacker-friendly-software-design
description: >-
  Design software, languages, and libraries for hackability, fast iteration, clear ownership, and real-user feedback rather than proxy metrics or ceremony.
---

# Hacker-Friendly Software Design

Design software the way makers work: start with something small, keep it changeable, and let real use reveal what matters.

## Core rules

- **Prefer capability over ceremony.** Assume smart users will need access to internals, escape hatches, and unusual workflows.
- **Optimize for change.** The best program is the one that can be revised without pain.
- **Keep the core small.** A short, clean core is easier to understand, extend, and rewrite.
- **Make the first version easy.** Get version 1 out quickly; don’t burden it with speculative generality.
- **Judge by use over time.** Beautiful work survives because it keeps being useful.

## How to work

### 1) Build by sketching, not by perfect drafting

Write the program, then revise it. Debugging, refactoring, and redesign are part of making, not cleanup after making.

- Favor a language that is **malleable**.
- Prefer code that is **short** and easy to rewrite.
- Let the spec evolve while you build.

### 2) Choose languages for power and hackability

Pick languages that help you think and build, not languages that merely look respectable.

- Prefer a language that is expressive enough to keep code brief.
- Use lower-level languages only when the task is truly system-level or speed-critical.
- Prefer dynamic freedom over rules that mostly block smart users.
- Value **macros**, code-as-data, and other forms of abstraction power when they let you extend the language instead of fighting it.
- Choose languages on the main evolutionary branch; avoid dead ends when possible.

### 3) Let profiling, not guesses, drive performance work

Do not freeze design around imagined bottlenecks.

- Build the simplest working version first.
- Use a **profiler** to find real hotspots.
- Optimize bottlenecks, not everything.
- Treat wasted machine cycles as acceptable if they buy simplicity or clarity.
- Push parallelism, low-level tuning, and representation tricks until they are actually needed.

### 4) Treat libraries as part of the language

A language is only as good as the ecosystem a programmer can infer.

- Make libraries **orthogonal** and **guessable**.
- Prefer APIs that are easy to discover from examples.
- Avoid huge libraries that are harder to search than to re-create.
- Keep the layer boundaries clear, but allow lower layers to be rewritten in the higher-level language when that helps.

### 5) Keep feedback close to users

Great software gets better by contact with reality.

- Use support as a bug-finding channel.
- Keep developers close enough to reproduce real user problems quickly.
- Watch click trails, repeated confusion, and support questions for design clues.
- Prefer small, frequent releases over big, infrequent ones.
- Let users reveal requirements you didn’t anticipate.

## Decision rules

- If two options are equally valuable, choose the one that is **harder to copy** or creates more room for elegance.
- If a design seems powerful but makes change painful, simplify it.
- If the code has become large enough that it resists revision, you waited too long to redesign.
- If a feature exists mainly to satisfy process, remove or defer it.
- If a user can’t explain it to someone else, the design probably isn’t yet clear enough.

## Anti-patterns

- **Premature optimization**: tuning before the program exists.
- **Premature design**: deciding too early what the program must be.
- **Ceremonial syntax**: verbosity that hides the idea instead of revealing it.
- **Shared ownership without boundaries**: interfaces and modules rotting because nobody truly owns them.
- **Proxy metrics**: counting what is easy instead of what is real.

## A useful test

Ask of any software system:

- Can a smart user hack it?
- Can you change it without fear?
- Can you see the bottlenecks?
- Can the first version ship quickly?
- Do real users, not theory, tell you what to do next?

If the answer is no, redesign the system around those constraints.

## Source note
Extracted from *Hackers & Painters: Big Ideas from the Computer Age* by Paul Graham.