---
name: data-system-tradeoff-design
description: >-
  Design and evaluate data-intensive systems by matching data model, storage engine, replication, transaction, and dataflow choices to workload shape and the guarantees they need.
---

# Data System Tradeoff Design

Use this skill when a system must stay reliable as load grows while remaining understandable, operable, and easy to evolve. Treat the system as a composition of specialized tools, not as one database that should solve every problem.

## Start with the three questions
- **Reliability:** what faults must the system survive without user-visible failure?
- **Scalability:** what load changes will matter, and what bottleneck moves first?
- **Maintainability:** what keeps the system easy to operate, understand, and change?

If a design improves one dimension by weakening another, make the tradeoff explicit.

## Choose the data model by relationship shape
Match the model to the structure of the data and the access patterns.

- **Document model** when data is mostly a tree or self-contained unit and is usually read as a whole.
- **Relational model** when many-to-one or many-to-many relationships are common and joins are part of the job.
- **Graph model** when entities are highly interconnected and queries traverse variable-length paths.

Practical rules:
- If you keep denormalizing just to avoid joins, check whether the model has outgrown documents.
- If you need explicit references across entities, favor IDs and joins over deep embedding.
- Use schema-on-read when structure is heterogeneous or externally controlled; use schema-on-write when the structure should be enforced and documented.
- “Schemaless” does not mean schema-free; it usually means the schema is enforced later.

## Choose storage by workload
Ask what kind of access dominates: point lookups, range scans, writes, or analytics.

### Append-only and log-structured storage
Use append-friendly layouts when sequential writes matter.
- Keep an index; a log without an index gives fast writes and slow reads.
- Favor **LSM-style** storage when write throughput and range scans matter and background compaction is acceptable.
- Favor **B-trees** when you want classic balanced-tree behavior and more predictable point reads.

Selection cues:
- If compaction lag can hurt latency or fill disks, monitor it explicitly.
- If the workload is mostly point lookups with strong transactional needs, B-trees are often easier to reason about.
- If the workload is large, write-heavy, and range-oriented, LSM trees are usually the better fit.

### Use indexes selectively
- Add indexes for actual query patterns, not by default.
- Secondary indexes may point to row IDs or store the key plus row ID.
- Use covering indexes when read speed is worth the storage and update cost.
- Use specialized indexes for spatial, fuzzy, or full-text search; do not expect a generic exact-match index to handle everything.

## Separate OLTP from OLAP
Do not force transactional and analytical workloads onto the same physical design unless you have checked the bottleneck.

- **OLTP:** low-latency key access, few records per request, seek-bound.
- **OLAP:** scans and aggregations, bandwidth-bound.

Rules:
- Keep analytics off the OLTP path when they would harm transaction latency.
- Use column-oriented storage when queries read only a small subset of columns from many rows.
- Sort data by common predicates or ranges.
- Precompute aggregates only when repeated queries justify the flexibility cost.

## Prefer declarative interfaces
Prefer “what result do I want?” over “how should the engine fetch it?”

- Declarative queries let the engine choose access paths, join order, and parallelism.
- Keep application logic out of the query plan when the database can optimize it better.
- Use MapReduce or explicit dataflow when the job is bulk-oriented or does not fit a declarative query well.

## Design replication around the guarantee you actually need
Replicate for latency, availability, and read throughput—but be honest about freshness.

### Single-leader replication
Use when you need a simpler consistency story.
- Writes go to one leader, then propagate to followers.
- Good default when follower lag is acceptable or reads can be routed carefully.
- Use synchronous replication only for the replicas whose freshness really matters; fully synchronous replication across all followers is usually too expensive.

### Multi-leader replication
Use only when local writes at multiple sites are worth the conflict risk.
- Good for multi-datacenter writes, offline clients, and some collaborative workflows.
- Expect write conflicts and resolve them deliberately.
- Do not rely on timestamps for causal ordering.

### Leaderless replication
Use when availability under failure and low-latency writes matter more than strict freshness.
- Quorums reduce staleness, but they are not a magic linearizability guarantee.
- Add read repair and anti-entropy if you accept eventual consistency.
- Monitor stale reads explicitly; do not assume eventual consistency is “close enough” without checking user impact.

## Use transactions when you need atomic multi-step behavior
Treat transactions as the tool for grouping multiple reads and writes into one logical unit with abort-and-retry semantics.

Guidance:
- Retry only transient failures.
- Make retries idempotent or deduplicated.
- Do not assume “ACID” means the same thing everywhere; verify the actual isolation behavior.
- Use atomic operations or row locks for simple lost-update cases.
- Use serializable isolation when the application cannot safely reason about anomalies.

Recognize the common anomaly patterns:
- **Lost update:** two read-modify-write loops overwrite each other.
- **Write skew:** concurrent transactions each see a safe state and together break an invariant.
- **Phantom:** a search query changes underneath a decision.

Choose the strongest isolation you actually need:
- **Read committed** for basic protection from dirty reads and dirty writes.
- **Snapshot isolation** for consistent reads and long-running queries, while remembering it still allows some anomalies.
- **Serializable / SSI / 2PL / serial execution** when correctness matters more than concurrency.

## Coordinate only when the decision truly needs it
If a decision must be unique, ordered, or mutually exclusive, use coordination with a clear final authority.

Use consensus, total order broadcast, or a coordination service when you need:
- leader election
- fencing tokens
- global uniqueness
- atomic commit across participants
- membership agreement

Rules:
- A lease is not enough if a paused process can wake up and act on stale ownership.
- Put a monotonically increasing fencing token on the protected resource, and have the resource reject old tokens.
- Do not let clients be the only ones checking whether a lock is still valid.

## Build derived data from a single source of truth
For caches, indexes, search, analytics, recommendations, and UI state, treat outputs as derived data.

Preferred pattern:
1. write once to the system of record,
2. capture changes in an ordered log,
3. replay that log into derived systems,
4. keep processors deterministic and idempotent.

Rules:
- Prefer immutable inputs and write-once outputs for batch jobs.
- Prefer replayable event streams for derived views that must recover cleanly.
- Do not use dual writes across heterogeneous systems unless you are prepared to handle partial failure and reordering.
- If a derived view matters for correctness, keep the ordering source explicit.

Use batch when you need reprocessing and large scans. Use streaming when you need continuous updates and low latency. Use both when you need fast updates plus historical rebuildability.

## Check the operational details before you commit
Before choosing an architecture, ask:
- Are the main bottlenecks seeks, bandwidth, write amplification, or compaction lag?
- Are the data relationships mostly nested, mostly relational, or deeply connected?
- Does the workload need freshness, or only eventual convergence?
- Can the system tolerate retries, duplicate processing, or temporary staleness?
- Will old and new code coexist during rolling upgrades?
- Can the chosen layout be monitored, repaired, and evolved without a rewrite?

If you cannot answer these, the design is too vague to trust.

## Practical fits
- Use a relational model plus transactions for cross-entity invariants.
- Use a document model for self-contained records that are usually loaded together.
- Use a graph model for evolving connectivity and path queries.
- Use LSM-style storage for large write-heavy datasets with range scans.
- Use B-trees when you need a classic general-purpose indexed store.
- Use logs and CDC to keep caches, warehouses, and search indexes in sync.

## Source note
Extracted from *Designing Data-Intensive Applications: The Big Ideas Behind Reliable, Scalable, and Maintainable Systems* by Martin Kleppmann.