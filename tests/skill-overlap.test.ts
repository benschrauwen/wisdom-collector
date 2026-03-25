import { describe, expect, it } from "vitest";

import type { ExistingSkill, SkillBlueprint, SkillOverlapReview } from "../src/types.js";
import { normalizeSkillOverlapReview, selectExistingSkillsForFinalization } from "../src/utils/skill-overlap.js";

function makeCandidateBlueprint(): SkillBlueprint {
  return {
    slug: "executive-effectiveness-system",
    skillTitle: "Executive Effectiveness System",
    description: "Umbrella skill for operating effectively as an executive.",
    skillBody: "# Executive Effectiveness System\n\nUse this as the umbrella skill.",
    subskills: [
      {
        slug: "leadership-transition-acceleration",
        skillTitle: "Leadership Transition Acceleration",
        description: "Helps new leaders ramp quickly in new roles.",
        skillBody: "# Leadership Transition Acceleration\n\nAccelerate the first 90 days.",
      },
      {
        slug: "managerial-operating-rhythm",
        skillTitle: "Managerial Operating Rhythm",
        description: "Keeps execution moving through a repeatable cadence.",
        skillBody: "# Managerial Operating Rhythm\n\nRun a steady management cadence.",
      },
    ],
  };
}

function makeExistingSkills(): ExistingSkill[] {
  return [
    {
      filePath: "/tmp/executive-effectiveness/SKILL.md",
      slug: "executive-effectiveness",
      skillTitle: "Executive Effectiveness",
      description: "Improves leverage, focus, and execution as an executive.",
      skillBody: "# Executive Effectiveness\n\nExisting guidance.",
      sourceMentions: [],
    },
    {
      filePath: "/tmp/leadership-transition-acceleration/SKILL.md",
      slug: "leadership-transition-acceleration",
      skillTitle: "Leadership Transition Acceleration",
      description: "Helps new leaders ramp quickly in new roles.",
      skillBody: "# Leadership Transition Acceleration\n\nExisting transition guidance.",
      sourceMentions: [],
    },
  ];
}

describe("normalizeSkillOverlapReview", () => {
  it("orders decisions by candidate family and backfills safe keep decisions", () => {
    const candidateBlueprint = makeCandidateBlueprint();
    const existingSkills = makeExistingSkills();
    const review: SkillOverlapReview = {
      summary: "  Candidate family has one clear extension target.  ",
      decisions: [
        {
          candidateSlug: "leadership-transition-acceleration",
          outcome: "merge-with-existing",
          matchedExistingSkillSlug: "leadership-transition-acceleration",
          rationale: "  This is materially the same capability as the existing transition skill.  ",
        },
        {
          candidateSlug: "executive-effectiveness-system",
          outcome: "merge-with-existing",
          matchedExistingSkillSlug: "missing-skill",
          rationale: "Looks similar, but the slug is invalid.",
        },
      ],
    };

    expect(normalizeSkillOverlapReview(candidateBlueprint, existingSkills, review)).toEqual({
      summary: "Candidate family has one clear extension target.",
      decisions: [
        {
          candidateSlug: "executive-effectiveness-system",
          outcome: "keep",
          rationale: "Looks similar, but the slug is invalid.",
        },
        {
          candidateSlug: "leadership-transition-acceleration",
          outcome: "merge-with-existing",
          matchedExistingSkillSlug: "leadership-transition-acceleration",
          rationale: "This is materially the same capability as the existing transition skill.",
        },
        {
          candidateSlug: "managerial-operating-rhythm",
          outcome: "keep",
          rationale: "This candidate appears distinct enough to keep as its own skill.",
        },
      ],
    });
  });
});

describe("selectExistingSkillsForFinalization", () => {
  it("returns only referenced existing skills without duplicates", () => {
    const existingSkills = makeExistingSkills();
    const review: SkillOverlapReview = {
      summary: "Overlap review complete.",
      decisions: [
        {
          candidateSlug: "executive-effectiveness-system",
          outcome: "merge-with-existing",
          matchedExistingSkillSlug: "executive-effectiveness",
          rationale: "Close enough to review as an extension.",
        },
        {
          candidateSlug: "leadership-transition-acceleration",
          outcome: "merge-with-existing",
          matchedExistingSkillSlug: "executive-effectiveness",
          rationale: "This duplicate reference should only appear once.",
        },
        {
          candidateSlug: "managerial-operating-rhythm",
          outcome: "keep",
          rationale: "Distinct candidate.",
        },
      ],
    };

    expect(selectExistingSkillsForFinalization(review, existingSkills)).toEqual([existingSkills[0]]);
  });
});
